import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGameSession } from "../hooks/useGameSession";
import { selectGame, startGame, removePlayer, transferHost, updatePlayer } from "../lib/api";
import PlayerList from "../components/PlayerList";
import GameSelector from "../components/GameSelector";

export default function Lobby() {
  const navigate = useNavigate();
  const { gameSession, myPlayer } = useGameSession();
  const [activeTab, setActiveTab] = useState<"players" | "games">("players");
  const [error, setError] = useState("");

  const playerId = localStorage.getItem("playerId");

  // Redirect guards
  useEffect(() => {
    if (!playerId) {
      navigate("/", { replace: true });
      return;
    }
    if (!gameSession) return;

    const player = gameSession.players.find((p) => p.playerId === playerId);
    if (!player) {
      localStorage.removeItem("playerId");
      navigate("/", { replace: true });
      return;
    }
    if (!player.ready) {
      navigate("/", { replace: true });
      return;
    }
    if (gameSession.gameState === "running") {
      navigate("/game", { replace: true });
    } else if (gameSession.gameState === "finished") {
      navigate("/results", { replace: true });
    }
  }, [gameSession, playerId, navigate]);

  if (!gameSession || !myPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading lobby...</p>
      </div>
    );
  }

  const isHost = myPlayer.isHost;
  const readyCount = gameSession.players.filter((p) => p.ready).length;
  const canStart = isHost && gameSession.gameType !== "" && readyCount >= 2;

  async function handleSelectGame(gameType: string) {
    setError("");
    try {
      await selectGame(gameType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to select game");
    }
  }

  async function handleStart() {
    setError("");
    try {
      await startGame();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start game");
    }
  }

  async function handleLeave() {
    const id = localStorage.getItem("playerId");
    if (!id) return;
    setError("");
    try {
      await removePlayer(id);
      localStorage.removeItem("playerId");
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to leave lobby");
    }
  }

  async function handleMakeHost(targetPlayerId: string) {
    setError("");
    try {
      await transferHost(targetPlayerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to transfer host");
    }
  }

  async function handleRemovePlayer(targetPlayerId: string) {
    setError("");
    try {
      await removePlayer(targetPlayerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove player");
    }
  }

  async function handleEditSelf(name: string, characterId: string) {
    const id = localStorage.getItem("playerId");
    if (!id) return;
    await updatePlayer(id, { name, characterId });
  }

  return (
    <div className="min-h-screen flex flex-col p-6">
      <div className="max-w-md mx-auto w-full">
        <h1 className="text-2xl font-bold text-center mb-1">LOBBY</h1>
        <p className="text-gray-400 text-center mb-6 text-sm">
          {gameSession.bayId} · {gameSession.players.length} player(s)
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Host tabs */}
        {isHost && (
          <div className="flex mb-4 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("players")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "players"
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Players
            </button>
            <button
              onClick={() => setActiveTab("games")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "games"
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Games
            </button>
          </div>
        )}

        {/* Content */}
        {(!isHost || activeTab === "players") && (
          <div>
            <PlayerList
              players={gameSession.players}
              currentPlayerId={playerId}
              onRemove={isHost ? handleRemovePlayer : undefined}
              onMakeHost={isHost ? handleMakeHost : undefined}
              onEditSelf={handleEditSelf}
            />
          </div>
        )}

        {isHost && activeTab === "games" && (
          <GameSelector
            selectedGameType={gameSession.gameType}
            onSelect={handleSelectGame}
          />
        )}

        {/* Status / Actions */}
        <div className="mt-6">
          {isHost ? (
            <>
              {!gameSession.gameType && (
                <p className="text-yellow-400 text-center text-sm mb-3">
                  Select a game mode in the Games tab
                </p>
              )}
              {gameSession.gameType && readyCount < 2 && (
                <p className="text-yellow-400 text-center text-sm mb-3">
                  Need at least 2 ready players to start
                </p>
              )}
              <button
                onClick={handleStart}
                disabled={!canStart}
                className="w-full py-3 rounded-lg font-semibold text-lg transition-all bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Game
              </button>
            </>
          ) : (
            <div className="text-center text-gray-400 py-4">
              {!gameSession.gameType
                ? "Waiting for host to choose a game..."
                : "Ready! Waiting for host to start..."}
            </div>
          )}

          <button
            onClick={handleLeave}
            className="w-full mt-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-400/50 transition-all"
          >
            Leave Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
