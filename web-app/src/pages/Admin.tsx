import { useState } from "react";
import { useGameSession } from "../hooks/useGameSession";
import { endGame, resetGame, fullResetGame, startGame, selectGame } from "../lib/api";
import type { PlayerResult } from "../lib/types";

export default function Admin() {
  const { gameSession, isConnected, sendShotEvent } = useGameSession();
  const [noContest, setNoContest] = useState(false);
  const [endGameResults, setEndGameResults] = useState<
    { playerId: string; makes: number; misses: number }[]
  >([]);
  const [error, setError] = useState("");

  // Sync endGameResults when gameSession players change
  const syncResults = () => {
    if (!gameSession) return;
    setEndGameResults(
      gameSession.players.map((p) => ({
        playerId: p.playerId,
        makes: 0,
        misses: 0,
      }))
    );
  };

  // Initialize results when entering running state
  if (
    gameSession?.gameState === "running" &&
    endGameResults.length === 0 &&
    gameSession.players.length > 0
  ) {
    syncResults();
  }

  function updateResult(
    playerId: string,
    field: "makes" | "misses",
    value: number
  ) {
    setEndGameResults((prev) =>
      prev.map((r) => (r.playerId === playerId ? { ...r, [field]: value } : r))
    );
  }

  function moveResult(index: number, direction: "up" | "down") {
    const newResults = [...endGameResults];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newResults.length) return;
    [newResults[index], newResults[swapIndex]] = [
      newResults[swapIndex],
      newResults[index],
    ];
    setEndGameResults(newResults);
  }

  async function handleEndGame() {
    setError("");
    try {
      if (noContest) {
        await endGame({ noContest: true, results: [] });
      } else {
        const results: PlayerResult[] = endGameResults.map((r, i) => ({
          playerId: r.playerId,
          position: i + 1,
          makes: r.makes,
          misses: r.misses,
        }));
        await endGame({ noContest: false, results });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end game");
    }
  }

  async function handleQuickStart() {
    setError("");
    try {
      if (!gameSession?.gameType) {
        await selectGame("knockout");
      }
      await startGame();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  if (!gameSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Connecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-400" : "bg-red-400"
              }`}
            />
            <span className="text-xs text-gray-400">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* State badge */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Game State</span>
            <span
              className={`text-sm font-medium px-2 py-1 rounded ${
                gameSession.gameState === "lobby"
                  ? "bg-blue-500/20 text-blue-400"
                  : gameSession.gameState === "running"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              {gameSession.gameState.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Game Type</span>
            <span className="text-sm">{gameSession.gameType || "(none)"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Players</span>
            <span className="text-sm">
              {gameSession.players.filter((p) => p.ready).length}/
              {gameSession.players.length} ready
            </span>
          </div>
        </div>

        {/* Quick actions for lobby */}
        {gameSession.gameState === "lobby" && (
          <div className="mb-4">
            <button
              onClick={handleQuickStart}
              disabled={gameSession.players.filter((p) => p.ready).length < 2}
              className="w-full py-2 rounded-lg font-semibold bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-2"
            >
              Quick Start (Knockout)
            </button>
          </div>
        )}

        {/* Shot Override */}
        {gameSession.gameState === "running" && (
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <h2 className="font-semibold mb-3">Shot Override</h2>
            <div className="flex gap-3">
              <button
                onClick={() => sendShotEvent("MAKE")}
                className="flex-1 py-3 rounded-lg font-bold text-lg bg-green-600 hover:bg-green-700 transition-all"
              >
                ✅ MAKE
              </button>
              <button
                onClick={() => sendShotEvent("MISS")}
                className="flex-1 py-3 rounded-lg font-bold text-lg bg-red-600 hover:bg-red-700 transition-all"
              >
                ❌ MISS
              </button>
            </div>
          </div>
        )}

        {/* End Game Builder */}
        {gameSession.gameState === "running" && (
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <h2 className="font-semibold mb-3">End Game Builder</h2>

            {/* No Contest toggle */}
            <label className="flex items-center gap-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={noContest}
                onChange={(e) => setNoContest(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <span className="text-sm">
                No Contest{" "}
                <span className="text-gray-500">
                  (no wins/losses recorded)
                </span>
              </span>
            </label>

            {!noContest && (
              <div className="space-y-2 mb-4">
                <p className="text-xs text-gray-400 mb-2">
                  Drag order = finish position (top = 1st place). Set makes &
                  misses for each player.
                </p>
                {endGameResults.map((result, index) => {
                  const player = gameSession.players.find(
                    (p) => p.playerId === result.playerId
                  );
                  return (
                    <div
                      key={result.playerId}
                      className="flex items-center gap-2 bg-gray-700 rounded-lg p-2"
                    >
                      <span className="text-sm font-bold w-6 text-center">
                        #{index + 1}
                      </span>
                      <span className="flex-1 text-sm truncate">
                        {player?.name || result.playerId}
                      </span>
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-gray-400">M:</label>
                        <input
                          type="number"
                          min={0}
                          value={result.makes}
                          onChange={(e) =>
                            updateResult(
                              result.playerId,
                              "makes",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-12 p-1 text-center text-sm bg-gray-600 rounded"
                        />
                        <label className="text-xs text-gray-400 ml-1">X:</label>
                        <input
                          type="number"
                          min={0}
                          value={result.misses}
                          onChange={(e) =>
                            updateResult(
                              result.playerId,
                              "misses",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-12 p-1 text-center text-sm bg-gray-600 rounded"
                        />
                      </div>
                      <div className="flex flex-col">
                        <button
                          onClick={() => moveResult(index, "up")}
                          disabled={index === 0}
                          className="text-xs px-1 hover:text-white text-gray-500 disabled:opacity-20"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveResult(index, "down")}
                          disabled={index === endGameResults.length - 1}
                          className="text-xs px-1 hover:text-white text-gray-500 disabled:opacity-20"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={handleEndGame}
              className="w-full py-2 rounded-lg font-semibold bg-yellow-600 hover:bg-yellow-700 transition-all"
            >
              {noContest ? "End Game (No Contest)" : "End Game with Results"}
            </button>
          </div>
        )}

        {/* Reset buttons */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <h2 className="font-semibold mb-3">Reset</h2>
          <div className="flex gap-3">
            <button
              onClick={() => resetGame().catch(() => {})}
              className="flex-1 py-2 rounded-lg text-sm bg-orange-600 hover:bg-orange-700 transition-all"
            >
              Reset to Lobby
            </button>
            <button
              onClick={() => fullResetGame().catch(() => {})}
              className="flex-1 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-700 transition-all"
            >
              Full Reset
            </button>
          </div>
        </div>

        {/* Debug: raw GameSession */}
        <details className="bg-gray-800 rounded-lg p-4">
          <summary className="font-semibold cursor-pointer text-sm">
            Debug: GameSession JSON
          </summary>
          <pre className="mt-3 text-xs text-gray-400 overflow-x-auto">
            {JSON.stringify(gameSession, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}
