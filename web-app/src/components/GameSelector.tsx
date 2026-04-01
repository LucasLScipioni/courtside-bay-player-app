interface GameSelectorProps {
  selectedGameType: string;
  onSelect: (gameType: string) => void;
}

const GAMES = [
  { id: "knockout", name: "Knockout", description: "Last one standing wins", available: true },
  { id: "free-throw", name: "Free Throw", description: "Most makes in X shots", available: false },
  { id: "horse", name: "H.O.R.S.E", description: "Classic letter game", available: false },
];

export default function GameSelector({ selectedGameType, onSelect }: GameSelectorProps) {
  return (
    <div className="space-y-3">
      {GAMES.map((game) => (
        <button
          key={game.id}
          disabled={!game.available}
          onClick={() => onSelect(game.id)}
          className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
            !game.available
              ? "border-gray-800 bg-gray-900 opacity-50 cursor-not-allowed"
              : selectedGameType === game.id
                ? "border-orange-500 bg-orange-500/20"
                : "border-gray-700 bg-gray-800 hover:border-gray-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{game.name}</div>
              <div className="text-sm text-gray-400">{game.description}</div>
            </div>
            {!game.available && (
              <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">
                Coming Soon
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
