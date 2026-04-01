import type { GameSession, Player, EndGamePayload } from "./types";

const BASE_URL =
  import.meta.env.VITE_CONTROLLER_URL ||
  `${window.location.protocol}//${window.location.hostname}:3001`;

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function getGameSession(): Promise<GameSession> {
  return request<GameSession>("/api/game-session");
}

export function registerPlayer(): Promise<Player> {
  return request<Player>("/api/players", { method: "POST" });
}

export function updatePlayer(
  playerId: string,
  data: { name: string; characterId: string }
): Promise<Player> {
  return request<Player>(`/api/players/${playerId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function removePlayer(playerId: string): Promise<{ success: boolean }> {
  return request(`/api/players/${playerId}`, { method: "DELETE" });
}

export function transferHost(playerId: string): Promise<{ success: boolean }> {
  return request(`/api/players/${playerId}/host`, { method: "PUT" });
}

export function setHotSeat(value: boolean): Promise<{ success: boolean }> {
  return request("/api/game/settings", {
    method: "PUT",
    body: JSON.stringify({ hotSeat: value }),
  });
}

export function selectGame(gameType: string): Promise<{ success: boolean }> {
  return request("/api/game/select", {
    method: "PUT",
    body: JSON.stringify({ gameType }),
  });
}

export function startGame(): Promise<{ success: boolean }> {
  return request("/api/game/start", { method: "POST" });
}

export function endGame(payload: EndGamePayload): Promise<{ success: boolean }> {
  return request("/api/game/end", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function resetGame(): Promise<{ success: boolean }> {
  return request("/api/game/reset", { method: "POST" });
}

export function fullResetGame(): Promise<{ success: boolean }> {
  return request("/api/game/full-reset", { method: "POST" });
}

export function getWsUrl(): string {
  const base =
    import.meta.env.VITE_CONTROLLER_URL ||
    `${window.location.hostname}:3001`;
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  // Strip any protocol from base if present
  const host = base.replace(/^https?:\/\//, "");
  return `${wsProtocol}//${host}`;
}
