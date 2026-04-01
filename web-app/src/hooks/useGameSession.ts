import { useEffect, useRef, useState, useCallback } from "react";
import type { GameSession } from "../lib/types";
import { getWsUrl } from "../lib/api";

const RECONNECT_DELAY = 2000;

export function useGameSession() {
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function connect() {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      const ws = new WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log("[WS] Connected");
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "GAME_SESSION") {
            setGameSession(msg.data);
          }
        } catch {
          // ignore invalid messages
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        console.log("[WS] Disconnected, reconnecting...");
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, []);

  const sendShotEvent = useCallback((shotResult: "MAKE" | "MISS") => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "SHOT_EVENT",
          data: {
            gameId: gameSession?.gameId || "",
            shotResult,
          },
        })
      );
    }
  }, [gameSession?.gameId]);

  const playerId = localStorage.getItem("playerId");
  const myPlayer = gameSession?.players.find((p) => p.playerId === playerId) || null;

  return { gameSession, isConnected, myPlayer, sendShotEvent };
}
