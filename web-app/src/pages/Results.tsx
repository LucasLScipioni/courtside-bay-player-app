import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGameSession } from "../hooks/useGameSession";
import { resetGame } from "../lib/api";
import { getCharacterEmoji } from "../lib/characters";

export default function Results() {
  const navigate = useNavigate();
  const { gameSession, myPlayer } = useGameSession();

  const playerId = localStorage.getItem("playerId");

  useEffect(() => {
    if (!playerId) {
      navigate("/", { replace: true });
      return;
    }
    if (!gameSession) return;

    if (gameSession.gameState === "lobby") {
      navigate("/lobby", { replace: true });
    } else if (gameSession.gameState === "running") {
      navigate("/game", { replace: true });
    }
  }, [gameSession, playerId, navigate]);

  if (!gameSession || gameSession.gameState !== "finished") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading results...</p>
      </div>
    );
  }

  const isHost = myPlayer?.isHost ?? false;

  async function handleReset() {
    try {
      await resetGame();
    } catch {
      // ignore
    }
  }

  // No Contest
  if (gameSession.noContest) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold mb-2">No Contest</h1>
          <p className="text-gray-400 mb-8">
            This game was declared no contest. No wins or losses recorded.
          </p>
          {isHost ? (
            <button
              onClick={handleReset}
              className="w-full py-3 rounded-lg font-semibold bg-orange-500 hover:bg-orange-600 transition-all"
            >
              Back to Lobby
            </button>
          ) : (
            <p className="text-gray-500 text-sm">
              Waiting for host to return to lobby...
            </p>
          )}
        </div>
      </div>
    );
  }

  // Normal results
  const results = [...gameSession.results].sort(
    (a, b) => a.position - b.position
  );

  const myResult = results.find((r) => r.playerId === playerId);
  const winner = gameSession.players.find(
    (p) => p.playerId === gameSession.gameWinner
  );

  return (
    <div className="min-h-screen flex flex-col p-6">
      <div className="max-w-md mx-auto w-full">
        {/* Winner banner */}
        {winner && (
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">
              {getCharacterEmoji(winner.characterId)}
            </div>
            <h1 className="text-2xl font-bold">🏆 {winner.name} wins!</h1>
            <p className="text-gray-400 text-sm mt-1">
              {winner.wins} total win(s)
              {winner.winStreak > 1 && ` · 🔥${winner.winStreak} streak`}
            </p>
          </div>
        )}

        {/* My position */}
        {myResult && (
          <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-4 mb-6 text-center">
            <p className="text-sm text-gray-300">You placed</p>
            <p className="text-4xl font-bold">
              #{myResult.position}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {myResult.makes} makes · {myResult.misses} misses
            </p>
          </div>
        )}

        {/* Leaderboard */}
        <h2 className="text-lg font-semibold mb-3">Leaderboard</h2>
        <div className="space-y-2">
          {results.map((result) => {
            const player = gameSession.players.find(
              (p) => p.playerId === result.playerId
            );
            if (!player) return null;

            const isMe = result.playerId === playerId;
            const isWinner = result.position === 1;

            return (
              <div
                key={result.playerId}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  isMe
                    ? "bg-orange-500/20 border border-orange-500/50"
                    : "bg-gray-800"
                }`}
              >
                <div className="text-xl font-bold w-8 text-center">
                  {isWinner ? "🏆" : `#${result.position}`}
                </div>
                <div className="text-xl">
                  {getCharacterEmoji(player.characterId)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{player.name}</div>
                  <div className="text-xs text-gray-400">
                    {result.makes} makes · {result.misses} misses
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-8">
          {isHost ? (
            <button
              onClick={handleReset}
              className="w-full py-3 rounded-lg font-semibold bg-orange-500 hover:bg-orange-600 transition-all"
            >
              Back to Lobby
            </button>
          ) : (
            <p className="text-gray-500 text-sm text-center">
              Waiting for host to return to lobby...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
