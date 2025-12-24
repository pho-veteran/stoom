"use client";

/**
 * useCollaborationSync Hook
 * 
 * Provides real-time synchronization for whiteboard and notes collaboration
 * using LiveKit data channels.
 */

import { useCallback, useEffect, useRef } from "react";
import { Room, RoomEvent, DataPacket_Kind } from "livekit-client";
import type { TLStoreSnapshot, TLRecord } from "tldraw";
import type { JSONContent } from "@tiptap/react";
import type { Step } from "@tiptap/pm/transform";
import {
  serializeMessage,
  deserializeMessage,
  routeMessage,
  type CollaborationMessage,
  type WhiteboardSyncMessage,
  type NotesSyncMessage,
  type PresenceMessage,
  type SaveStatusMessage,
  type LocalPresence,
  type ParticipantPresence,
  type UseCollaborationSyncOptions,
  type UseCollaborationSyncReturn,
} from "../lib/collaboration-types";

/**
 * Data channel topic for collaboration messages
 */
const COLLABORATION_TOPIC = "collaboration";

/**
 * Presence timeout in milliseconds (3 seconds as per requirements)
 */
const PRESENCE_TIMEOUT_MS = 3000;

/**
 * Hook for managing real-time collaboration synchronization
 */
export function useCollaborationSync(
  room: Room | null,
  options: UseCollaborationSyncOptions
): UseCollaborationSyncReturn {
  const {
    roomId,
    onWhiteboardUpdate,
    onNotesUpdate,
    onPresenceUpdate,
    onPermissionUpdate,
    onSaveStatus,
  } = options;

  const presenceMapRef = useRef<Map<string, ParticipantPresence>>(new Map());
  const presenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Derive connection state from room presence
  const isConnected = room !== null;


  /**
   * Broadcast a collaboration message to all participants
   */
  const broadcastMessage = useCallback(
    async (message: CollaborationMessage) => {
      if (!room) return;

      try {
        const data = serializeMessage(message);
        await room.localParticipant.publishData(data, {
          reliable: true,
          topic: COLLABORATION_TOPIC,
        });
      } catch (error) {
        console.error("Failed to broadcast collaboration message:", error);
      }
    },
    [room]
  );

  /**
   * Send whiteboard update to all participants
   */
  const sendWhiteboardUpdate = useCallback(
    (changes: TLRecord[], removedIds?: string[]) => {
      if (!room) return;

      const message: WhiteboardSyncMessage = {
        type: "whiteboard",
        action: "update",
        payload: {
          changes,
          removedIds,
          senderId: room.localParticipant.identity,
          timestamp: Date.now(),
        },
      };

      broadcastMessage(message);
    },
    [room, broadcastMessage]
  );

  /**
   * Send whiteboard snapshot (for sync responses)
   */
  const sendWhiteboardSnapshot = useCallback(
    (snapshot: TLStoreSnapshot) => {
      if (!room) return;

      const message: WhiteboardSyncMessage = {
        type: "whiteboard",
        action: "sync-response",
        payload: {
          snapshot,
          senderId: room.localParticipant.identity,
          timestamp: Date.now(),
        },
      };

      broadcastMessage(message);
    },
    [room, broadcastMessage]
  );

  /**
   * Send notes update to all participants
   */
  const sendNotesUpdate = useCallback(
    (operations: Step[]) => {
      if (!room) return;

      const message: NotesSyncMessage = {
        type: "notes",
        action: "update",
        payload: {
          operations,
          senderId: room.localParticipant.identity,
          timestamp: Date.now(),
        },
      };

      broadcastMessage(message);
    },
    [room, broadcastMessage]
  );

  /**
   * Send notes content (for sync responses)
   */
  const sendNotesContent = useCallback(
    (content: JSONContent) => {
      if (!room) return;

      const message: NotesSyncMessage = {
        type: "notes",
        action: "sync-response",
        payload: {
          content,
          senderId: room.localParticipant.identity,
          timestamp: Date.now(),
        },
      };

      broadcastMessage(message);
    },
    [room, broadcastMessage]
  );

  /**
   * Send presence update
   */
  const sendPresence = useCallback(
    (presence: LocalPresence) => {
      if (!room) return;

      const message: PresenceMessage = {
        type: "presence",
        payload: {
          participantId: room.localParticipant.identity,
          participantName: room.localParticipant.name || room.localParticipant.identity,
          feature: presence.feature,
          cursor: presence.cursor,
          selection: presence.selection,
          timestamp: Date.now(),
        },
      };

      broadcastMessage(message);
    },
    [room, broadcastMessage]
  );

  /**
   * Request sync from other participants
   */
  const requestSync = useCallback(
    (feature: "whiteboard" | "notes") => {
      if (!room) return;

      const message: CollaborationMessage = feature === "whiteboard"
        ? {
            type: "whiteboard",
            action: "sync-request",
            payload: {
              senderId: room.localParticipant.identity,
              timestamp: Date.now(),
            },
          }
        : {
            type: "notes",
            action: "sync-request",
            payload: {
              senderId: room.localParticipant.identity,
              timestamp: Date.now(),
            },
          };

      broadcastMessage(message);
    },
    [room, broadcastMessage]
  );

  /**
   * Send save status to all participants
   */
  const sendSaveStatus = useCallback(
    (feature: "whiteboard" | "notes", status: "saving" | "saved" | "error") => {
      if (!room) return;

      const message: SaveStatusMessage = {
        type: "save-status",
        payload: {
          feature,
          status,
          senderName: room.localParticipant.name || room.localParticipant.identity,
          senderId: room.localParticipant.identity,
          timestamp: Date.now(),
        },
      };

      broadcastMessage(message);
    },
    [room, broadcastMessage]
  );


  /**
   * Update presence map and notify listeners
   */
  const updatePresence = useCallback(
    (presence: ParticipantPresence) => {
      presenceMapRef.current.set(presence.participantId, presence);
      
      // Notify listeners with current presence list
      if (onPresenceUpdate) {
        const presenceList = Array.from(presenceMapRef.current.values());
        onPresenceUpdate(presenceList);
      }
    },
    [onPresenceUpdate]
  );

  /**
   * Clean up stale presence entries (older than PRESENCE_TIMEOUT_MS)
   */
  const cleanupStalePresence = useCallback(() => {
    const now = Date.now();
    let hasChanges = false;

    presenceMapRef.current.forEach((presence, participantId) => {
      if (now - presence.lastActive > PRESENCE_TIMEOUT_MS) {
        presenceMapRef.current.delete(participantId);
        hasChanges = true;
      }
    });

    if (hasChanges && onPresenceUpdate) {
      const presenceList = Array.from(presenceMapRef.current.values());
      onPresenceUpdate(presenceList);
    }
  }, [onPresenceUpdate]);

  // Store callbacks in refs to avoid effect re-runs and listener leaks
  const onWhiteboardUpdateRef = useRef(onWhiteboardUpdate);
  const onNotesUpdateRef = useRef(onNotesUpdate);
  const onPermissionUpdateRef = useRef(onPermissionUpdate);
  const onSaveStatusRef = useRef(onSaveStatus);
  
  useEffect(() => {
    onWhiteboardUpdateRef.current = onWhiteboardUpdate;
  }, [onWhiteboardUpdate]);
  
  useEffect(() => {
    onNotesUpdateRef.current = onNotesUpdate;
  }, [onNotesUpdate]);
  
  useEffect(() => {
    onPermissionUpdateRef.current = onPermissionUpdate;
  }, [onPermissionUpdate]);
  
  useEffect(() => {
    onSaveStatusRef.current = onSaveStatus;
  }, [onSaveStatus]);

  /**
   * Handle incoming data channel messages
   */
  useEffect(() => {
    if (!room) {
      return;
    }

    const handleDataReceived = (
      payload: Uint8Array,
      participant: { identity: string } | undefined,
      _kind?: DataPacket_Kind,
      topic?: string
    ) => {
      // Only process collaboration messages
      if (topic !== COLLABORATION_TOPIC) return;
      
      // Ignore messages from self
      if (participant?.identity === room.localParticipant.identity) return;

      try {
        const message = deserializeMessage(payload);

        // Route message to appropriate handler (using refs for stable callbacks)
        routeMessage(message, {
          onWhiteboard: (msg) => {
            onWhiteboardUpdateRef.current?.(msg);
          },
          onNotes: (msg) => {
            onNotesUpdateRef.current?.(msg);
          },
          onPresence: (msg) => {
            const presence: ParticipantPresence = {
              participantId: msg.payload.participantId,
              participantName: msg.payload.participantName,
              feature: msg.payload.feature,
              cursor: msg.payload.cursor,
              selection: msg.payload.selection,
              lastActive: msg.payload.timestamp,
            };
            updatePresence(presence);
          },
          onPermission: (msg) => {
            onPermissionUpdateRef.current?.(msg);
          },
          onSaveStatus: (msg) => {
            onSaveStatusRef.current?.(msg);
          },
        });
      } catch (error) {
        console.error("Failed to process collaboration message:", error);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    // Set up presence cleanup interval
    presenceTimeoutRef.current = setInterval(cleanupStalePresence, 1000);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
      if (presenceTimeoutRef.current) {
        clearInterval(presenceTimeoutRef.current);
        presenceTimeoutRef.current = null;
      }
    };
  }, [
    room,
    roomId,
    updatePresence,
    cleanupStalePresence,
  ]); // Removed callback deps - using refs instead to prevent listener leaks

  return {
    sendWhiteboardUpdate,
    sendWhiteboardSnapshot,
    sendNotesUpdate,
    sendNotesContent,
    sendPresence,
    sendSaveStatus,
    requestSync,
    isConnected,
  };
}
