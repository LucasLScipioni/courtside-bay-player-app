import { useState } from "react";
import type { Player } from "../lib/types";
import { getCharacterEmoji, getCharacterName } from "../lib/characters";
import CharacterGrid from "./CharacterGrid";

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string | null;
  onRemove?: (playerId: string) => void;
  onMakeHost?: (playerId: string) => void;
  onEditSelf?: (name: string, characterId: string) => Promise<void>;
}

export default function PlayerList({
  players,
  currentPlayerId,
  onRemove,
  onMakeHost,
  onEditSelf,
}: PlayerListProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [editName, setEditName] = useState("");
  const [editCharacterId, setEditCharacterId] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  function hasActions(player: Player) {
    const isOwn = player.playerId === currentPlayerId;
    if (isOwn) return !!onEditSelf;
    return !!(onRemove || onMakeHost);
  }

  function openModal(player: Player) {
    if (!hasActions(player)) return;
    setSelectedPlayer(player);
    setEditName(player.name);
    setEditCharacterId(player.characterId);
    setModalError("");
  }

  function closeModal() {
    setSelectedPlayer(null);
    setModalError("");
  }

  async function handleSaveEdit() {
    if (!selectedPlayer || !onEditSelf || !editName.trim() || !editCharacterId) return;
    setSaving(true);
    setModalError("");
    try {
      await onEditSelf(editName.trim(), editCharacterId);
      closeModal();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (players.length === 0) {
    return <p className="text-gray-500 text-center py-4">No players yet...</p>;
  }

  const isOwnSelected = selectedPlayer?.playerId === currentPlayerId;

  return (
    <>
      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.playerId}
            onClick={() => openModal(player)}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              player.playerId === currentPlayerId
                ? "bg-orange-500/20 border border-orange-500/50"
                : "bg-gray-800"
            } ${hasActions(player) ? "cursor-pointer active:brightness-110" : ""}`}
          >
            <div className="text-2xl">
              {player.characterId ? getCharacterEmoji(player.characterId) : "⏳"}
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
            <div className="flex items-center gap-2 shrink-0">
              {player.ready ? (
                <span className="text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
                  Ready
                </span>
              ) : (
                <span className="text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">
                  Pending
                </span>
              )}
              {hasActions(player) && (
                <span className="text-gray-500 text-base leading-none select-none">⋮</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Player header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="text-3xl">
                {selectedPlayer.characterId
                  ? getCharacterEmoji(selectedPlayer.characterId)
                  : "⏳"}
              </div>
              <div>
                <div className="font-semibold">
                  {selectedPlayer.name || "Registering..."}
                </div>
                <div className="text-xs text-gray-400">
                  {selectedPlayer.characterId
                    ? getCharacterName(selectedPlayer.characterId)
                    : "No character"}
                </div>
              </div>
            </div>

            {modalError && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg p-3 mb-4 text-sm">
                {modalError}
              </div>
            )}

            {/* Own player: edit form */}
            {isOwnSelected && onEditSelf && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={20}
                    className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Character</label>
                  <CharacterGrid selected={editCharacterId} onSelect={setEditCharacterId} />
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={closeModal}
                    className="flex-1 py-2.5 rounded-lg text-sm border border-gray-700 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={!editName.trim() || !editCharacterId || saving}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            )}

            {/* Other player: management actions */}
            {!isOwnSelected && (
              <div className="space-y-2">
                {onMakeHost && !selectedPlayer.isHost && (
                  <button
                    onClick={() => { onMakeHost(selectedPlayer.playerId); closeModal(); }}
                    className="w-full py-3 rounded-lg text-sm font-medium bg-gray-800 border border-gray-700 hover:bg-yellow-500/10 hover:border-yellow-400/50 hover:text-yellow-400 transition-all text-left px-4"
                  >
                    Make Host
                  </button>
                )}
                {onRemove && (
                  <button
                    onClick={() => { onRemove(selectedPlayer.playerId); closeModal(); }}
                    className="w-full py-3 rounded-lg text-sm font-medium bg-gray-800 border border-gray-700 hover:bg-red-500/10 hover:border-red-400/50 hover:text-red-400 transition-all text-left px-4"
                  >
                    Remove from lobby
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className="w-full py-2 text-sm text-gray-500 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
