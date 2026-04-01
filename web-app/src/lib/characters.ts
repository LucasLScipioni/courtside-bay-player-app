export const CHARACTERS = [
  { id: "char_01", name: "Blaze", emoji: "🔥" },
  { id: "char_02", name: "Frost", emoji: "❄️" },
  { id: "char_03", name: "Thunder", emoji: "⚡" },
  { id: "char_04", name: "Shadow", emoji: "🌑" },
  { id: "char_05", name: "Viper", emoji: "🐍" },
  { id: "char_06", name: "Nova", emoji: "✨" },
];

export function getCharacterName(id: string): string {
  return CHARACTERS.find((c) => c.id === id)?.name || id;
}

export function getCharacterEmoji(id: string): string {
  return CHARACTERS.find((c) => c.id === id)?.emoji || "❓";
}
