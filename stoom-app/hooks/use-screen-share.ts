"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Room,
  RoomEvent,
  Track,
  Participant,
  TrackPublication,
} from "livekit-client";

export interface ScreenShareInfo {
  participant: Participant;
  track: TrackPublication;
}

export interface UseScreenShareReturn {
  isSharing: boolean;
  currentSharer: ScreenShareInfo | null;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  error: Error | null;
}

export function useScreenShare(room: Room | null): UseScreenShareReturn {
  const [isSharing, setIsSharing] = useState(false);
  const [currentSharer, setCurrentSharer] = useState<ScreenShareInfo | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const findScreenShareTrack = useCallback((): ScreenShareInfo | null => {
    if (!room) return null;

    // Check local participant
    const localScreenShare = room.localParticipant.getTrackPublication(
      Track.Source.ScreenShare
    );
    if (localScreenShare?.track) {
      return {
        participant: room.localParticipant,
        track: localScreenShare,
      };
    }

    // Check remote participants
    for (const participant of room.remoteParticipants.values()) {
      const screenShare = participant.getTrackPublication(Track.Source.ScreenShare);
      if (screenShare?.track) {
        return {
          participant,
          track: screenShare,
        };
      }
    }

    return null;
  }, [room]);

  const updateScreenShareState = useCallback(() => {
    const sharer = findScreenShareTrack();
    setCurrentSharer(sharer);
    setIsSharing(sharer?.participant === room?.localParticipant);
  }, [room, findScreenShareTrack]);

  const startScreenShare = useCallback(async () => {
    if (!room) {
      setError(new Error("Not connected to a room"));
      return;
    }

    try {
      setError(null);
      await room.localParticipant.setScreenShareEnabled(true);
      setIsSharing(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to start screen share");
      setError(error);
      throw error;
    }
  }, [room]);

  const stopScreenShare = useCallback(async () => {
    if (!room) return;

    try {
      setError(null);
      await room.localParticipant.setScreenShareEnabled(false);
      setIsSharing(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to stop screen share");
      setError(error);
    }
  }, [room]);

  useEffect(() => {
    if (!room) {
      return;
    }

    const handleTrackSubscribed = (track: Track) => {
      if (track.source === Track.Source.ScreenShare) {
        updateScreenShareState();
      }
    };

    const handleTrackUnsubscribed = (track: Track) => {
      if (track.source === Track.Source.ScreenShare) {
        updateScreenShareState();
      }
    };

    const handleLocalTrackPublished = () => {
      updateScreenShareState();
    };

    const handleLocalTrackUnpublished = () => {
      updateScreenShareState();
    };

    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
    room.on(RoomEvent.LocalTrackPublished, handleLocalTrackPublished);
    room.on(RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished);

    // Initial state via microtask to avoid lint warning
    queueMicrotask(() => updateScreenShareState());

    return () => {
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
      room.off(RoomEvent.LocalTrackPublished, handleLocalTrackPublished);
      room.off(RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished);
      // Reset on cleanup
      setCurrentSharer(null);
      setIsSharing(false);
    };
  }, [room, updateScreenShareState]);

  return {
    isSharing,
    currentSharer,
    startScreenShare,
    stopScreenShare,
    error,
  };
}
