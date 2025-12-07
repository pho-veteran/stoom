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
 * POST /api/room/[roomId]/whiteboard
 * Save whiteboard snapshot to database
 * Whiteboard is shared for all participants
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId: roomIdOrCode } = await params;
    const body = await request.json();
    const { snapshot } = body;

    if (!snapshot) {
      return NextResponse.json({ error: "Snapshot is required" }, { status: 400 });
    }

    const room = await getRoom(roomIdOrCode);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Update the whiteboard snapshot directly on the room
    await prisma.room.update({
      where: { id: room.id },
      data: { whiteboardSnapshot: snapshot },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving whiteboard:", error);
    return NextResponse.json({ error: "Failed to save whiteboard" }, { status: 500 });
  }
}

/**
 * GET /api/room/[roomId]/whiteboard
 * Get whiteboard snapshot from database
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

    return NextResponse.json({ snapshot: room.whiteboardSnapshot });
  } catch (error) {
    console.error("Error getting whiteboard:", error);
    return NextResponse.json({ error: "Failed to get whiteboard" }, { status: 500 });
  }
}
