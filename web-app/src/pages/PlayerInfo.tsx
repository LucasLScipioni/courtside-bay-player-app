import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { registerPlayer, updatePlayer, getGameSession } from "../lib/api";
import { useGameSession } from "../hooks/useGameSession";
import CharacterGrid from "../components/CharacterGrid";

export default function PlayerInfo() {
  const navigate = useNavigate();
  const { gameSession } = useGameSession();
  const [name, setName] = useState("");
  const [characterId, setCharacterId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const initCalled = useRef(false);

  // On mount: register or reconnect
  useEffect(() => {
    if (initCalled.current) return;
    initCalled.current = true;

    async function init() {
      const existingId = localStorage.getItem("playerId");

      if (existingId) {
        // Reconnect: check if player exists in session
        try {
          const session = await getGameSession();
          const player = session.players.find((p) => p.playerId === existingId);

          if (player) {
            // Player exists — redirect based on state
            if (player.ready && session.gameState === "lobby") {
              navigate("/lobby", { replace: true });
              return;
            }
            if (session.gameState === "running") {
              navigate("/game", { replace: true });
              return;
            }
            if (session.gameState === "finished") {
              navigate("/results", { replace: true });
              return;
            }
            // Player exists but not ready — stay here, prefill
            setName(player.name);
            setCharacterId(player.characterId);
          } else {
            // Player ID in localStorage but not in session — re-register
            localStorage.removeItem("playerId");
            const newPlayer = await registerPlayer();
            localStorage.setItem("playerId", newPlayer.playerId);
          }
        } catch {
          setError("Could not connect to server. Retrying...");
        }
      } else {
        // New player: register
        try {
          const player = await registerPlayer();
          localStorage.setItem("playerId", player.playerId);
        } catch {
          setError("Could not connect to server. Retrying...");
        }
      }
      setLoading(false);
    }

    init();
  }, [navigate]);

  // Watch for gameState changes via WebSocket
  useEffect(() => {
    if (!gameSession) return;
    const playerId = localStorage.getItem("playerId");
    const player = gameSession.players.find((p) => p.playerId === playerId);

    if (player?.ready && gameSession.gameState === "lobby") {
      navigate("/lobby", { replace: true });
    } else if (gameSession.gameState === "running") {
      navigate("/game", { replace: true });
    } else if (gameSession.gameState === "finished") {
      navigate("/results", { replace: true });
    }
  }, [gameSession, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const playerId = localStorage.getItem("playerId");
    if (!playerId || !name.trim() || !characterId) return;

    setSubmitting(true);
    setError("");
    try {
      await updatePlayer(playerId, {
        name: name.trim(),
        characterId,
      });
      navigate("/lobby");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Connecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <h1 className="text-3xl font-bold text-center mb-2">
          COURTSIDE BAY
        </h1>
        <p className="text-gray-400 text-center mb-8">Enter your info to join</p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Choose Your Character
            </label>
            <CharacterGrid selected={characterId} onSelect={setCharacterId} />
          </div>

          <button
            type="submit"
            disabled={!name.trim() || !characterId || submitting}
            className="w-full py-3 rounded-lg font-semibold text-lg transition-all bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Joining..." : "Join Game"}
          </button>
        </form>
      </div>
    </div>
  );
}
