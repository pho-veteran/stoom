import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { roomService, sendDataMessage } from "@/lib/livekit-server";

/**
 * POST /api/room/[roomId]/kick
 * Kick a participant from the room (host or co-host only)
 * Simply removes them from LiveKit - no DB updates needed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;
    const { participantIdentity } = await request.json();

    if (!participantIdentity) {
      return NextResponse.json(
        { error: "participantIdentity is required" },
        { status: 400 }
      );
    }

    // Get the requesting user to check if they're the host
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the room to verify host/co-host status
    const room = await prisma.room.findUnique({
      where: { code: roomId },
      include: {
        participants: {
          where: { user: { clerkId: userId } },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if requester is host or co-host
    const isHost = room.ownerId === dbUser.id;
    const isCoHost = room.participants[0]?.role === "CO_HOST";

    if (!isHost && !isCoHost) {
      return NextResponse.json(
        { error: "Only hosts and co-hosts can kick participants" },
        { status: 403 }
      );
    }

    // Prevent kicking yourself
    if (participantIdentity === userId) {
      return NextResponse.json(
        { error: "Cannot kick yourself" },
        { status: 400 }
      );
    }

    // Send kick notification before removing
    try {
      await sendDataMessage(
        room.code,
        {
          type: "PARTICIPANT_KICKED",
          kickedIdentity: participantIdentity,
          kickedBy: userId,
        },
        [participantIdentity]
      );
      // Brief delay for message delivery
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch {
      // Continue even if message fails
    }

    // Remove from LiveKit
    try {
      await roomService.removeParticipant(room.code, participantIdentity);
    } catch (livekitError) {
      // Log but don't fail - participant may have already left
      console.log("LiveKit removeParticipant error (may be already gone):", livekitError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error kicking participant:", error);
    return NextResponse.json(
      { error: "Failed to kick participant" },
      { status: 500 }
    );
  }
}
