"use client";

import { useState, useCallback, useRef } from "react";
import { Room } from "livekit-client";

export interface UseLiveKitRoomReturn {
  room: Room | null;
  token: string | null;
  serverUrl: string;
  isConnecting: boolean;
  error: Error | null;
  connect: (roomName: string) => Promise<void>;
  disconnect: () => void;
}

async function fetchToken(roomName: string): Promise<string> {
  const response = await fetch("/api/livekit/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomName }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch token");
  }

  const data = await response.json();
  return data.token;
}

export function useLiveKitRoom(): UseLiveKitRoomReturn {
  const [room, setRoom] = useState<Room | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const roomRef = useRef<Room | null>(null);

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "ws://localhost:7880";

  const connect = useCallback(async (roomName: string) => {
    try {
      setError(null);
      setIsConnecting(true);

      const newToken = await fetchToken(roomName);
      setToken(newToken);
      setIsConnecting(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to connect");
      setError(error);
      setIsConnecting(false);
      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    setToken(null);
    setRoom(null);
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
  }, []);

  return {
    room,
    token,
    serverUrl,
    isConnecting,
    error,
    connect,
    disconnect,
  };
}
