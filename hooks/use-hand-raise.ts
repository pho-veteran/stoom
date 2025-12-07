"use client";

/**
 * useHandRaise Hook
 * 
 * Manages hand raise state for meeting participants using LiveKit data channels.
 * Provides real-time synchronization of hand raise states across all participants.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.2, 2.4, 2.5, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 6.1, 6.3, 7.3, 7.4
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { Room, RoomEvent, DataPacket_Kind } from "livekit-client";
import { toast } from "sonner";
import type {
  HandRaiseState,
  HandRaiseMessage,
} from "../lib/hand-raise-types";
import {
  deserializeHandRaiseMessage,
  serializeHandRaiseMessage,
  createRaiseHandMessage,
  createLowerHandMessage,
  createHostLowerHandMessage,
  createLowerAllHandsMessage,
  createSyncRequestMessage,
  createSyncResponseMessage,
} from "../lib/hand-raise-types";

/**
 * Data channel topic for hand raise messages
 */
const HAND_RAISE_TOPIC = "hand-raise";

/**
 * Options for the useHandRaise hook
 */
export interface UseHandRaiseOptions {
  roomId: string;
  participantId: string;
  participantName: string;
  isHost: boolean;
  room: Room | null;
}

/**
 * Return type for the useHandRaise hook
 */
export interface UseHandRaiseReturn {
  // State
  isHandRaised: boolean;
  handRaiseQueue: HandRaiseState[];
  handRaiseCount: number;
  
  // Actions
  toggleHandRaise: () => void;
  lowerParticipantHand: (participantId: string) => void;
  lowerAllHands: () => void;
  
  // Status
  isConnected: boolean;
  
  // Accessibility
  screenReaderAnnouncement: string;
}

/**
 * Hook for managing hand raise state in a meeting
 * 
 * Requirements: 1.1, 1.2, 2.2, 2.4
 */
export function useHandRaise(options: UseHandRaiseOptions): UseHandRaiseReturn {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { roomId, participantId, participantName, isHost, room } = options;

  // In-memory hand raise state map
  const [handRaiseMap, setHandRaiseMap] = useState<Map<string, HandRaiseState>>(
    new Map()
  );

  // Screen reader announcement state
  const [screenReaderAnnouncement, setScreenReaderAnnouncement] = useState<string>("");

  // Derive connection state from room presence
  const isConnected = room !== null;

  // Derive current participant's hand raise state
  const isHandRaised = handRaiseMap.has(participantId);

  // Derive ordered queue from map (sorted by raisedAt timestamp)
  // Requirements: 2.2
  const handRaiseQueue = useMemo(() => {
    const queue = Array.from(handRaiseMap.values());
    // Sort by timestamp ascending (earliest first), then by participantId for deterministic ordering
    queue.sort((a, b) => {
      if (a.raisedAt !== b.raisedAt) {
        return a.raisedAt - b.raisedAt;
      }
      return a.participantId.localeCompare(b.participantId);
    });
    return queue;
  }, [handRaiseMap]);

  // Derive count of raised hands
  // Requirements: 2.4
  const handRaiseCount = handRaiseQueue.length;

  /**
   * Broadcast a hand raise message to all participants
   * Requirements: 7.4
   */
  const broadcastMessage = useCallback(
    async (message: HandRaiseMessage) => {
      if (!room) {
        // Requirements: 7.4 - Network error feedback
        toast.error("Unable to send hand raise action - not connected to meeting");
        return;
      }

      try {
        const data = serializeHandRaiseMessage(message);
        await room.localParticipant.publishData(data, {
          reliable: true,
          topic: HAND_RAISE_TOPIC,
        });
      } catch (error) {
        console.error("Failed to broadcast hand raise message:", error);
        // Requirements: 7.4 - Network error feedback
        toast.error("Failed to send hand raise action - network error");
      }
    },
    [room]
  );

  /**
   * Toggle hand raise state for current participant
   * Requirements: 1.1, 1.3, 1.4, 1.5, 7.1, 7.2
   */
  const toggleHandRaise = useCallback(() => {
    if (!room) return;

    if (isHandRaised) {
      // Lower hand
      // Requirements: 1.3, 1.5, 7.2
      setHandRaiseMap((prev) => {
        const next = new Map(prev);
        next.delete(participantId);
        return next;
      });

      // Screen reader announcement
      setScreenReaderAnnouncement("Your hand has been lowered");

      const message = createLowerHandMessage(participantId, participantId);
      broadcastMessage(message);
    } else {
      // Raise hand
      // Requirements: 1.1, 1.2, 1.4, 7.1
      const timestamp = Date.now();
      const state: HandRaiseState = {
        participantId,
        participantName,
        raisedAt: timestamp,
      };

      setHandRaiseMap((prev) => {
        const next = new Map(prev);
        next.set(participantId, state);
        return next;
      });

      // Screen reader announcement
      setScreenReaderAnnouncement("Your hand has been raised");

      const message = createRaiseHandMessage(
        participantId,
        participantName,
        participantId
      );
      broadcastMessage(message);
    }
  }, [
    room,
    isHandRaised,
    participantId,
    participantName,
    broadcastMessage,
  ]);

  /**
   * Lower a specific participant's hand (host/co-host only)
   * Requirements: 3.1, 3.2, 3.3
   */
  const lowerParticipantHand = useCallback(
    (targetParticipantId: string) => {
      if (!room || !isHost) return;

      // Remove from local state
      setHandRaiseMap((prev) => {
        const next = new Map(prev);
        next.delete(targetParticipantId);
        return next;
      });

      // Broadcast host lower message
      const message = createHostLowerHandMessage(targetParticipantId, participantId);
      broadcastMessage(message);
    },
    [room, isHost, participantId, broadcastMessage]
  );

  /**
   * Lower all raised hands (host/co-host only)
   * Requirements: 4.1, 4.2, 4.3
   */
  const lowerAllHands = useCallback(() => {
    if (!room || !isHost) return;

    // Clear all hand raise state
    setHandRaiseMap(new Map());

    // Broadcast lower-all message
    const message = createLowerAllHandsMessage(participantId);
    broadcastMessage(message);
  }, [room, isHost, participantId, broadcastMessage]);

  /**
   * Handle incoming hand raise messages
   * Requirements: 1.4, 1.5, 2.5, 3.3, 4.3, 7.3
   */
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (
      payload: Uint8Array,
      participant: { identity: string } | undefined,
      _kind?: DataPacket_Kind,
      topic?: string
    ) => {
      // Only process hand raise messages
      if (topic !== HAND_RAISE_TOPIC) return;

      // Ignore messages from self (we already updated local state)
      if (participant?.identity === participantId) return;

      try {
        const message = deserializeHandRaiseMessage(payload);

        // Process message based on action
        if (message.action === "raise") {
          // Add participant to queue
          const state: HandRaiseState = {
            participantId: message.payload.participantId,
            participantName: message.payload.participantName || "Unknown",
            raisedAt: message.payload.timestamp,
          };

          setHandRaiseMap((prev) => {
            const next = new Map(prev);
            next.set(message.payload.participantId, state);
            return next;
          });

          // Requirements: 2.5 - Show notification to hosts/co-hosts only
          if (isHost) {
            toast.info(`${message.payload.participantName || "A participant"} raised their hand`);
          }
        } else if (message.action === "lower") {
          // Remove participant from queue
          setHandRaiseMap((prev) => {
            const next = new Map(prev);
            next.delete(message.payload.participantId);
            return next;
          });

          // Requirements: 7.3 - Show notification to affected participant when host lowers their hand
          // Check if this is a host-initiated lower (targetParticipantId is set and sender is different)
          if (
            message.payload.targetParticipantId === participantId &&
            message.payload.senderId !== participantId
          ) {
            toast.info("Your hand was lowered by the host");
            // Screen reader announcement
            setScreenReaderAnnouncement("Your hand was lowered by the host");
          }
        } else if (message.action === "lower-all") {
          // Clear all hand raise state
          setHandRaiseMap(new Map());
        } else if (message.action === "sync-request") {
          // Another participant is requesting current state - respond with our state
          // Only respond if we have hand raise state to share
          setHandRaiseMap((currentMap) => {
            if (currentMap.size > 0) {
              const states = Array.from(currentMap.values());
              const responseMessage = createSyncResponseMessage(participantId, states);
              broadcastMessage(responseMessage);
            }
            return currentMap;
          });
        } else if (message.action === "sync-response") {
          // Received sync response - merge with current state
          if (message.payload.handRaiseStates && Array.isArray(message.payload.handRaiseStates)) {
            setHandRaiseMap((prev) => {
              const next = new Map(prev);
              for (const state of message.payload.handRaiseStates!) {
                // Only add if not already present (avoid overwriting with stale data)
                if (!next.has(state.participantId)) {
                  next.set(state.participantId, state);
                }
              }
              return next;
            });
          }
        }
      } catch (error) {
        console.error("Failed to process hand raise message:", error);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, participantId, isHost, broadcastMessage]);

  /**
   * Request sync when joining or reconnecting to the room
   * Sends a sync-request message to get current hand raise state from other participants
   */
  useEffect(() => {
    if (!room) return;

    // Send sync request when room is connected
    const sendSyncRequest = () => {
      // Small delay to ensure other participants are ready to respond
      setTimeout(() => {
        if (room.state === "connected") {
          const syncMessage = createSyncRequestMessage(participantId);
          broadcastMessage(syncMessage);
        }
      }, 500);
    };

    // Send sync request on initial connection if already connected
    if (room.state === "connected") {
      sendSyncRequest();
    }

    // Listen for Connected event (for fresh joins)
    const handleConnected = () => {
      sendSyncRequest();
    };

    // Also send sync request on reconnection
    const handleReconnected = () => {
      sendSyncRequest();
    };

    room.on(RoomEvent.Connected, handleConnected);
    room.on(RoomEvent.Reconnected, handleReconnected);

    return () => {
      room.off(RoomEvent.Connected, handleConnected);
      room.off(RoomEvent.Reconnected, handleReconnected);
    };
  }, [room, participantId, broadcastMessage]);

  /**
   * Clean up hand raise state when participant leaves
   * Requirements: 6.1
   */
  useEffect(() => {
    if (!room) return;

    const handleParticipantDisconnected = (participant: { identity: string }) => {
      setHandRaiseMap((prev) => {
        const next = new Map(prev);
        next.delete(participant.identity);
        return next;
      });
    };

    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);

    return () => {
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    };
  }, [room]);

  /**
   * Clean up all hand raise state when meeting ends
   * Requirements: 6.3
   */
  useEffect(() => {
    if (!room) return;

    const handleDisconnected = () => {
      setHandRaiseMap(new Map());
    };

    room.on(RoomEvent.Disconnected, handleDisconnected);

    return () => {
      room.off(RoomEvent.Disconnected, handleDisconnected);
    };
  }, [room]);

  return {
    isHandRaised,
    handRaiseQueue,
    handRaiseCount,
    toggleHandRaise,
    lowerParticipantHand,
    lowerAllHands,
    isConnected,
    screenReaderAnnouncement,
  };
}
