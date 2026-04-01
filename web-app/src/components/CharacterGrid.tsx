import { CHARACTERS } from "../lib/characters";

interface CharacterGridProps {
  selected: string;
  onSelect: (id: string) => void;
  takenCharacters?: string[];
}

export default function CharacterGrid({
  selected,
  onSelect,
}: CharacterGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {CHARACTERS.map((char) => (
        <button
          key={char.id}
          type="button"
          onClick={() => onSelect(char.id)}
          className={`p-4 rounded-lg border-2 text-center transition-all ${
            selected === char.id
              ? "border-orange-500 bg-orange-500/20"
              : "border-gray-700 bg-gray-800 hover:border-gray-500"
          }`}
        >
          <div className="text-3xl mb-1">{char.emoji}</div>
          <div className="text-sm font-medium">{char.name}</div>
        </button>
      ))}
    </div>
  );
}
