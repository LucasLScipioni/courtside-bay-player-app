import type { Player } from "../lib/types";
import { getCharacterEmoji, getCharacterName } from "../lib/characters";

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string | null;
}

export default function PlayerList({ players, currentPlayerId }: PlayerListProps) {
  if (players.length === 0) {
    return <p className="text-gray-500 text-center py-4">No players yet...</p>;
  }

  return (
    <div className="space-y-2">
      {players.map((player) => (
        <div
          key={player.playerId}
          className={`flex items-center gap-3 p-3 rounded-lg ${
            player.playerId === currentPlayerId
              ? "bg-orange-500/20 border border-orange-500/50"
              : "bg-gray-800"
          }`}
        >
          <div className="text-2xl">
            {player.characterId
              ? getCharacterEmoji(player.characterId)
              : "⏳"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">
                {player.name || "Registering..."}
              </span>
              {player.isHost && (
                <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded">
                  HOST
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400">
              {player.characterId
                ? getCharacterName(player.characterId)
                : "Choosing character..."}
              {player.wins > 0 && (
                <span className="ml-2">
                  🏆 {player.wins}W
                  {player.winStreak > 1 && ` · 🔥${player.winStreak} streak`}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            {player.ready ? (
              <span className="text-green-400 text-sm">Ready</span>
            ) : (
              <span className="text-yellow-400 text-sm">Pending</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
