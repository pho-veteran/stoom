"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Room, RoomEvent } from "livekit-client";
import axios from "axios";

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
  messageId?: string; // For deduplication
}

export interface UseChatReturn {
  messages: ChatMessage[];
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  loadMessages: () => Promise<void>;
  isLoading: boolean;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function useChat(room: Room | null, roomId?: string): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messageIdCounter = useRef(0);
  const loadedRef = useRef(false);
  const processedMessageIds = useRef(new Set<string>());

  // Load existing messages from database
  const loadMessages = useCallback(async () => {
    if (!roomId || loadedRef.current) return;

    setIsLoading(true);
    try {
      const response = await axios.get(`/api/chat?roomId=${roomId}`);
      const dbMessages = response.data.messages.map(
        (m: { id: string; content: string; createdAt: string; user: { clerkId: string; name: string } }) => {
          // Track loaded message IDs to prevent duplicates
          processedMessageIds.current.add(m.id);
          return {
            id: m.id,
            senderId: m.user.clerkId,
            senderName: m.user.name || "Unknown",
            message: m.content,
            timestamp: new Date(m.createdAt).getTime(),
          };
        }
      );
      setMessages(dbMessages);
      loadedRef.current = true;
    } catch (error) {
      console.error("Error loading chat messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  // Load messages on mount
  useEffect(() => {
    if (roomId && !loadedRef.current) {
      loadMessages();
    }
  }, [roomId, loadMessages]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!room || !message.trim()) return;

      const trimmedMessage = message.trim();
      const localMessageId = `local-${Date.now()}-${++messageIdCounter.current}`;
      
      const payload: ChatPayload = {
        type: "chat",
        message: trimmedMessage,
        senderName: room.localParticipant.name || room.localParticipant.identity,
        timestamp: Date.now(),
        messageId: localMessageId,
      };

      // Add to local state immediately for responsive UI
      const newMessage: ChatMessage = {
        id: localMessageId,
        senderId: room.localParticipant.identity,
        senderName: payload.senderName,
        message: payload.message,
        timestamp: payload.timestamp,
      };
      
      // Mark as processed to prevent duplicate from DataChannel echo
      processedMessageIds.current.add(localMessageId);
      setMessages((prev) => [...prev, newMessage]);

      // Persist to database (don't wait for it)
      if (roomId) {
        axios
          .post("/api/chat", { roomId, message: trimmedMessage })
          .then((response) => {
            // Update the message ID with the database ID for consistency
            const dbId = response.data.id;
            processedMessageIds.current.add(dbId);
            setMessages((prev) =>
              prev.map((m) => (m.id === localMessageId ? { ...m, id: dbId } : m))
            );
          })
          .catch((error) => {
            console.error("Error persisting chat message:", error);
            // Message is still shown locally even if persist fails
          });
      }

      // Broadcast via LiveKit DataChannel for real-time delivery to others
      try {
        const data = encoder.encode(JSON.stringify(payload));
        await room.localParticipant.publishData(data, { reliable: true });
      } catch (error) {
        console.error("Failed to broadcast message via DataChannel:", error);
        // Message is already in local state and persisted, so don't throw
      }
    },
    [room, roomId]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    loadedRef.current = false;
    processedMessageIds.current.clear();
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
          // Skip if this is our own message (already added locally)
          if (data.messageId && processedMessageIds.current.has(data.messageId)) {
            return;
          }

          const newMessageId = data.messageId || `remote-${++messageIdCounter.current}`;
          
          // Mark as processed
          processedMessageIds.current.add(newMessageId);

          const newMessage: ChatMessage = {
            id: newMessageId,
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
    loadMessages,
    isLoading,
  };
}
