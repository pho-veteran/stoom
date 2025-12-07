import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Helper to get room by code or ID
 */
async function getRoom(roomIdOrCode: string) {
  if (/^[a-f\d]{24}$/i.test(roomIdOrCode)) {
    return prisma.room.findUnique({ where: { id: roomIdOrCode } });
  }
  return prisma.room.findUnique({ where: { code: roomIdOrCode } });
}

/**
 * GET /api/room/[roomId]/participants
 * Get all participants who have joined this room from the database
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId: roomIdOrCode } = await params;

    const room = await getRoom(roomIdOrCode);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Get all participants for this room with user details
    const participants = await prisma.roomParticipant.findMany({
      where: { roomId: room.id },
      include: {
        user: {
          select: {
            id: true,
            clerkId: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    // Transform to a simpler format
    const participantList = participants.map((p) => ({
      odId: p.user.id,
      identity: p.user.clerkId, // Use clerkId as identity (matches LiveKit)
      name: p.user.name || p.user.email || "Unknown",
      email: p.user.email,
      imageUrl: p.user.imageUrl,
      role: p.role,
      joinedAt: p.joinedAt,
      leftAt: p.leftAt,
      isActive: p.leftAt === null,
    }));

    return NextResponse.json({ participants: participantList });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { error: "Failed to fetch participants" },
      { status: 500 }
    );
  }
}
