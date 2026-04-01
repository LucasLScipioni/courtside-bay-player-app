import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGameSession } from "../hooks/useGameSession";

export default function Game() {
  const navigate = useNavigate();
  const { gameSession } = useGameSession();

  const playerId = localStorage.getItem("playerId");

  useEffect(() => {
    if (!playerId) {
      navigate("/", { replace: true });
      return;
    }
    if (!gameSession) return;

    if (gameSession.gameState === "finished") {
      navigate("/results", { replace: true });
    } else if (gameSession.gameState === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [gameSession, playerId, navigate]);

  if (!gameSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center">
        <div className="text-6xl mb-6">🏀</div>
        <h1 className="text-3xl font-bold mb-2">Game In Progress</h1>
        <p className="text-gray-400 mb-2">
          {gameSession.gameType.toUpperCase()}
        </p>
        <p className="text-gray-500 text-sm">
          Watch the big screen for the action!
        </p>
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-sm">Live</span>
        </div>
      </div>
    </div>
  );
}
