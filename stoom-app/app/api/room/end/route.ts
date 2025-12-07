import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { RoomStatus } from "@/app/generated/prisma";
import type { TLStoreSnapshot } from "tldraw";

/**
 * Request body for ending a room
 */
interface EndRoomRequest {
  roomId: string;
  whiteboardSnapshot?: TLStoreSnapshot;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: EndRoomRequest = await request.json();
    const { roomId, whiteboardSnapshot } = body;

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the room by code
    const room = await prisma.room.findUnique({
      where: { code: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if user is the owner or a co-host
    const isOwner = room.ownerId === user.id;
    
    // Check if user is a co-host via RoomParticipant role
    const participant = await prisma.roomParticipant.findUnique({
      where: {
        userId_roomId: {
          userId: user.id,
          roomId: room.id,
        },
      },
    });
    const isCoHost = participant?.role === "CO_HOST";
    
    if (!isOwner && !isCoHost) {
      return NextResponse.json(
        { error: "Only the room owner or co-hosts can end the meeting" },
        { status: 403 }
      );
    }

    // Update room: set status to ENDED and save whiteboard if provided
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      status: RoomStatus.ENDED,
      isActive: false,
      endedAt: new Date(),
    };
    
    if (whiteboardSnapshot) {
      updateData.whiteboardSnapshot = whiteboardSnapshot;
    }
    
    const updatedRoom = await prisma.room.update({
      where: { id: room.id },
      data: updateData,
    });

    // Update all participants' leftAt timestamp
    await prisma.roomParticipant.updateMany({
      where: {
        roomId: room.id,
        leftAt: null,
      },
      data: {
        leftAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      room: {
        id: updatedRoom.id,
        code: updatedRoom.code,
        status: updatedRoom.status,
        endedAt: updatedRoom.endedAt,
      },
    });
  } catch (error) {
    console.error("Error ending room:", error);
    return NextResponse.json({ error: "Failed to end room" }, { status: 500 });
  }
}
