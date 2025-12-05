import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { RoomStatus } from "@/app/generated/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { roomId } = body;

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

    // Find the room
    const room = await prisma.room.findUnique({
      where: { code: roomId },
      include: { participants: true },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if user is the owner
    if (room.ownerId !== user.id) {
      return NextResponse.json(
        { error: "Only the room owner can end the meeting" },
        { status: 403 }
      );
    }

    // Update room status to ENDED
    const updatedRoom = await prisma.room.update({
      where: { id: room.id },
      data: {
        status: RoomStatus.ENDED,
        isActive: false,
        endedAt: new Date(),
      },
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
    return NextResponse.json(
      { error: "Failed to end room" },
      { status: 500 }
    );
  }
}
