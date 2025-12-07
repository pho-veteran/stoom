"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Room,
  RoomEvent,
  Participant,
  LocalParticipant,
  Track,
} from "livekit-client";

export interface ParticipantInfo {
  identity: string;
  name: string;
  imageUrl: string | null;
  isSpeaking: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isLocal: boolean;
  participant: Participant;
}

export interface UseParticipantsReturn {
  participants: ParticipantInfo[];
  activeSpeaker: ParticipantInfo | null;
  participantCount: number;
}

export function useParticipants(room: Room | null): UseParticipantsReturn {
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<ParticipantInfo | null>(null);

  const getParticipantInfo = useCallback((participant: Participant): ParticipantInfo => {
    const audioPublication = participant.getTrackPublication(Track.Source.Microphone);
    const videoPublication = participant.getTrackPublication(Track.Source.Camera);

    // Parse metadata to get imageUrl
    let imageUrl: string | null = null;
    try {
      if (participant.metadata) {
        const metadata = JSON.parse(participant.metadata);
        imageUrl = metadata.imageUrl || null;
      }
    } catch {
      // Ignore JSON parse errors
    }

    return {
      identity: participant.identity,
      name: participant.name || participant.identity,
      imageUrl,
      isSpeaking: participant.isSpeaking,
      isAudioEnabled: !!audioPublication?.track && !audioPublication.isMuted,
      isVideoEnabled: !!videoPublication?.track && !videoPublication.isMuted,
      isLocal: participant instanceof LocalParticipant,
      participant,
    };
  }, []);

  const updateParticipants = useCallback(() => {
    if (!room) {
      setParticipants([]);
      return;
    }

    const allParticipants: ParticipantInfo[] = [];

    // Add local participant first
    if (room.localParticipant) {
      allParticipants.push(getParticipantInfo(room.localParticipant));
    }

    // Add remote participants
    room.remoteParticipants.forEach((participant) => {
      allParticipants.push(getParticipantInfo(participant));
    });

    setParticipants(allParticipants);
  }, [room, getParticipantInfo]);

  // Reset state when room changes
  useEffect(() => {
    if (!room) {
      return;
    }

    const handleParticipantConnected = () => updateParticipants();
    const handleParticipantDisconnected = () => updateParticipants();
    const handleTrackSubscribed = () => updateParticipants();
    const handleTrackUnsubscribed = () => updateParticipants();
    const handleTrackMuted = () => updateParticipants();
    const handleTrackUnmuted = () => updateParticipants();
    const handleLocalTrackPublished = () => updateParticipants();
    const handleLocalTrackUnpublished = () => updateParticipants();

    const handleActiveSpeakerChanged = (speakers: Participant[]) => {
      if (speakers.length > 0) {
        setActiveSpeaker(getParticipantInfo(speakers[0]));
      } else {
        setActiveSpeaker(null);
      }
      updateParticipants();
    };

    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
    room.on(RoomEvent.TrackMuted, handleTrackMuted);
    room.on(RoomEvent.TrackUnmuted, handleTrackUnmuted);
    room.on(RoomEvent.LocalTrackPublished, handleLocalTrackPublished);
    room.on(RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished);
    room.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakerChanged);

    // Initial update via microtask to avoid lint warning
    queueMicrotask(() => updateParticipants());

    return () => {
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
      room.off(RoomEvent.TrackMuted, handleTrackMuted);
      room.off(RoomEvent.TrackUnmuted, handleTrackUnmuted);
      room.off(RoomEvent.LocalTrackPublished, handleLocalTrackPublished);
      room.off(RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished);
      room.off(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakerChanged);
      // Reset on cleanup
      setParticipants([]);
      setActiveSpeaker(null);
    };
  }, [room, updateParticipants, getParticipantInfo]);

  return {
    participants,
    activeSpeaker,
    participantCount: participants.length,
  };
}
