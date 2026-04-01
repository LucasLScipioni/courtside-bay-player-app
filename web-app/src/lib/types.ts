export interface Player {
  playerId: string;
  name: string;
  characterId: string;
  order: number;
  isHost: boolean;
  ready: boolean;
  wins: number;
  winStreak: number;
}

export interface PlayerResult {
  playerId: string;
  position: number;
  makes: number;
  misses: number;
}

export interface GameSession {
  gameId: string;
  gameType: string;
  gameState: "lobby" | "running" | "finished";
  bayId: string;
  gameWinner: string | null;
  noContest: boolean;
  hotSeat: boolean;
  results: PlayerResult[];
  players: Player[];
}

export interface EndGamePayload {
  noContest: boolean;
  results: PlayerResult[];
}
