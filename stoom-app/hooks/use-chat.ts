"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Room, RoomEvent } from "livekit-client";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
}

interface ChatPayload {
  type: "chat";
  message: string;
  senderName: string;
  timestamp: number;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function useChat(room: Room | null): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messageIdCounter = useRef(0);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!room || !message.trim()) return;

      const payload: ChatPayload = {
        type: "chat",
        message: message.trim(),
        senderName: room.localParticipant.name || room.localParticipant.identity,
        timestamp: Date.now(),
      };

      const data = encoder.encode(JSON.stringify(payload));
      await room.localParticipant.publishData(data, { reliable: true });

      // Add message to local state
      const newMessage: ChatMessage = {
        id: `local-${++messageIdCounter.current}`,
        senderId: room.localParticipant.identity,
        senderName: payload.senderName,
        message: payload.message,
        timestamp: payload.timestamp,
      };

      setMessages((prev) => [...prev, newMessage]);
    },
    [room]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    if (!room) {
      return;
    }

    const handleDataReceived = (
      payload: Uint8Array,
      participant: { identity: string; name?: string } | undefined
    ) => {
      try {
        const data = JSON.parse(decoder.decode(payload)) as ChatPayload;

        if (data.type === "chat" && participant) {
          const newMessage: ChatMessage = {
            id: `remote-${++messageIdCounter.current}`,
            senderId: participant.identity,
            senderName: data.senderName || participant.name || participant.identity,
            message: data.message,
            timestamp: data.timestamp,
          };

          setMessages((prev) => [...prev, newMessage]);
        }
      } catch {
        // Ignore non-JSON or invalid messages
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  return {
    messages,
    sendMessage,
    clearMessages,
  };
}
