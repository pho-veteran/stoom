"use client";

import { ReactNode, useState, useEffect } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";

interface LiveKitRoomWrapperProps {
  token: string;
  serverUrl: string;
  initialAudioEnabled?: boolean;
  initialVideoEnabled?: boolean;
  onDisconnected?: () => void;
  children: ReactNode;
}

export function LiveKitRoomWrapper({
  token,
  serverUrl,
  initialAudioEnabled = true,
  initialVideoEnabled = true,
  onDisconnected,
  children,
}: LiveKitRoomWrapperProps) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      video={initialVideoEnabled}
      audio={initialAudioEnabled}
      onDisconnected={onDisconnected}
      options={{
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          simulcast: true,
        },
      }}
    >
      <RoomAudioRenderer />
      {children}
    </LiveKitRoom>
  );
}

// Custom hook to get room controls using official LiveKit hooks
export function useRoomControls() {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const participants = useParticipants();

  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false);
  const [meetingEndedBy, setMeetingEndedBy] = useState<string | null>(null);
  const [wasKicked, setWasKicked] = useState(false);
  const [kickedBy, setKickedBy] = useState<string | null>(null);

  // Find who is currently screen sharing
  const currentScreenSharer = participants.find(
    (p) => p.isScreenShareEnabled && !p.isLocal
  );

  useEffect(() => {
    if (!localParticipant) return;

    const updateState = () => {
      setIsMicEnabled(localParticipant.isMicrophoneEnabled);
      setIsCameraEnabled(localParticipant.isCameraEnabled);
      setIsScreenShareEnabled(localParticipant.isScreenShareEnabled);
    };

    updateState();

    localParticipant.on("trackMuted", updateState);
    localParticipant.on("trackUnmuted", updateState);
    localParticipant.on("localTrackPublished", updateState);
    localParticipant.on("localTrackUnpublished", updateState);

    return () => {
      localParticipant.off("trackMuted", updateState);
      localParticipant.off("trackUnmuted", updateState);
      localParticipant.off("localTrackPublished", updateState);
      localParticipant.off("localTrackUnpublished", updateState);
    };
  }, [localParticipant]);

  // Listen for data messages from other participants
  useEffect(() => {
    if (!room || !localParticipant) return;

    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const decoder = new TextDecoder();
        const message = JSON.parse(decoder.decode(payload));

        if (message.type === "STOP_SCREEN_SHARE" && localParticipant.isScreenShareEnabled) {
          // Another participant wants to take over screen share
          localParticipant.setScreenShareEnabled(false);
        }

        if (message.type === "ROOM_ENDED") {
          // Host ended the meeting - show overlay
          const hostName = participants.find(
            (p) => p.identity === message.endedBy
          )?.name || message.endedBy;
          setMeetingEndedBy(hostName || "Host");
        }

        if (message.type === "PARTICIPANT_KICKED") {
          // Check if this message is for the current user
          if (message.kickedIdentity === localParticipant?.identity) {
            const kickerName = participants.find(
              (p) => p.identity === message.kickedBy
            )?.name || message.kickedBy;
            setWasKicked(true);
            setKickedBy(kickerName || "Host");
            // Disconnect from the room
            room?.disconnect();
          }
        }
      } catch {
        // Ignore non-JSON messages (could be chat messages)
      }
    };

    room.on("dataReceived", handleDataReceived);

    return () => {
      room.off("dataReceived", handleDataReceived);
    };
  }, [room, localParticipant, participants]);

  const toggleMicrophone = async () => {
    if (!localParticipant) return;
    await localParticipant.setMicrophoneEnabled(!isMicEnabled);
  };

  const toggleCamera = async () => {
    if (!localParticipant) return;
    await localParticipant.setCameraEnabled(!isCameraEnabled);
  };

  const toggleScreenShare = async () => {
    if (!localParticipant) return;
    await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
  };

  const startScreenShare = async () => {
    if (!localParticipant || !room) return;
    
    // If someone else is screen sharing, send them a message to stop
    if (currentScreenSharer) {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify({
        type: "STOP_SCREEN_SHARE",
        requestedBy: localParticipant.identity,
      }));
      await room.localParticipant.publishData(data, {
        reliable: true,
        destinationIdentities: [currentScreenSharer.identity],
      });
      // Small delay to allow the other participant to stop
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    await localParticipant.setScreenShareEnabled(true);
  };

  const stopScreenShare = async () => {
    if (!localParticipant) return;
    await localParticipant.setScreenShareEnabled(false);
  };

  // Broadcast room ended message to all participants
  const broadcastRoomEnded = async () => {
    if (!room) return;
    const encoder = new TextEncoder();
    const data = encoder.encode(
      JSON.stringify({
        type: "ROOM_ENDED",
        endedBy: localParticipant?.identity,
      })
    );
    await room.localParticipant.publishData(data, { reliable: true });
  };

  return {
    localParticipant,
    room,
    isMicEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
    currentScreenSharer,
    meetingEndedBy,
    wasKicked,
    kickedBy,
    toggleMicrophone,
    toggleCamera,
    toggleScreenShare,
    startScreenShare,
    stopScreenShare,
    broadcastRoomEnded,
  };
}

// Hook to get all participants with their tracks
export function useRoomParticipants() {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();

  return {
    participants,
    localParticipant,
    participantCount: participants.length,
  };
}

// Hook to get video tracks for display
export function useVideoTracks() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], {
    onlySubscribed: false,
  });

  const cameraTracks = tracks.filter(
    (track) => track.source === Track.Source.Camera
  );
  const screenShareTracks = tracks.filter(
    (track) => track.source === Track.Source.ScreenShare
  );

  return {
    cameraTracks,
    screenShareTracks,
    allTracks: tracks,
  };
}
