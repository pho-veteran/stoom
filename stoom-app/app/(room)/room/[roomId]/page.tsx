"use client";

import { useState, useEffect } from "react";
import { PreJoin } from "@/components/room/pre-join";
import { RoomContent } from "@/components/room/room-content";

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const [roomId, setRoomId] = useState<string>("");
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    params.then((p) => setRoomId(p.roomId));
  }, [params]);

  if (!hasJoined) {
    return <PreJoin roomId={roomId} onJoin={() => setHasJoined(true)} />;
  }

  return <RoomContent roomId={roomId} />;
}


