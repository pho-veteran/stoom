"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { PreJoin } from "@/components/room/pre-join";
import { RoomContent } from "@/components/room/room-content";
import { Loader2, AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

interface MediaSettings {
  micEnabled: boolean;
  videoEnabled: boolean;
}

interface RoomInfo {
  id: string;
  code: string;
  name: string;
  status: string;
  isHost: boolean;
  hasPassword: boolean;
}

type RoomState = "loading" | "valid" | "not_found" | "ended" | "error";

export default function RoomPage({ params }: RoomPageProps) {
  const router = useRouter();
  const [roomId, setRoomId] = useState<string>("");
  const [hasJoined, setHasJoined] = useState(false);
  const [roomState, setRoomState] = useState<RoomState>("loading");
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [mediaSettings, setMediaSettings] = useState<MediaSettings>({
    micEnabled: true,
    videoEnabled: true,
  });

  useEffect(() => {
    params.then((p) => setRoomId(p.roomId));
  }, [params]);

  // Validate room when roomId is available
  useEffect(() => {
    if (!roomId) return;

    const validateRoom = async () => {
      try {
        const response = await axios.get(`/api/room/validate?code=${roomId}`);
        setRoomInfo(response.data.room);
        setRoomState("valid");
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const code = error.response?.data?.code;
          const message = error.response?.data?.error || "Failed to join room";
          
          if (code === "ROOM_NOT_FOUND") {
            setRoomState("not_found");
            setErrorMessage("This room doesn't exist. Please check the room code and try again.");
          } else if (code === "ROOM_ENDED" || code === "ROOM_INACTIVE") {
            setRoomState("ended");
            setErrorMessage("This meeting has ended. You can no longer join this room.");
          } else {
            setRoomState("error");
            setErrorMessage(message);
          }
        } else {
          setRoomState("error");
          setErrorMessage("An unexpected error occurred");
        }
      }
    };

    validateRoom();
  }, [roomId]);

  const handleJoin = (settings: MediaSettings) => {
    setMediaSettings(settings);
    setHasJoined(true);
  };

  // Loading state
  if (roomState === "loading") {
    return (
      <div className="relative flex h-screen w-screen items-center justify-center bg-linear-to-br from-slate-50 via-white to-violet-50/30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[32px_32px]" />
        <div className="relative z-10 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-100 mx-auto border border-violet-200">
            <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
          </div>
          <p className="text-xl font-semibold text-slate-900">Checking room...</p>
          <p className="text-sm text-slate-500 mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  // Error states (not found, ended, or generic error)
  if (roomState !== "valid") {
    return (
      <div className="relative flex h-screen w-screen items-center justify-center bg-linear-to-br from-slate-50 via-white to-violet-50/30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[32px_32px]" />
        <div className="relative z-10 text-center max-w-md px-6">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-100 mx-auto border border-red-200">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
          <p className="text-xl font-semibold text-slate-900">
            {roomState === "not_found" && "Room Not Found"}
            {roomState === "ended" && "Meeting Ended"}
            {roomState === "error" && "Unable to Join"}
          </p>
          <p className="text-sm text-slate-500 mt-2">{errorMessage}</p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="mt-6 gap-2"
          >
            <Home className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <PreJoin
        roomId={roomId}
        roomName={roomInfo?.name}
        hasPassword={roomInfo?.hasPassword}
        isHost={roomInfo?.isHost}
        onJoin={handleJoin}
      />
    );
  }

  return (
    <RoomContent
      roomId={roomId}
      initialMicEnabled={mediaSettings.micEnabled}
      initialVideoEnabled={mediaSettings.videoEnabled}
      isHost={roomInfo?.isHost}
    />
  );
}


