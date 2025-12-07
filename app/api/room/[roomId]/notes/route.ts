import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Helper to get room by code or ID
 */
async function getRoom(roomIdOrCode: string) {
  // If it looks like a MongoDB ObjectID (24 hex chars), find by id
  if (/^[a-f\d]{24}$/i.test(roomIdOrCode)) {
    return prisma.room.findUnique({ where: { id: roomIdOrCode } });
  }
  // Otherwise, find by room code
  return prisma.room.findUnique({ where: { code: roomIdOrCode } });
}

/**
 * POST /api/room/[roomId]/notes
 * Save personal notes for a user in a room
 * Notes are personal per-user (not collaborative)
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
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const room = await getRoom(roomIdOrCode);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Upsert the user's personal notes for this room
    await prisma.roomNote.upsert({
      where: {
        roomId_clerkUserId: {
          roomId: room.id,
          clerkUserId,
        },
      },
      update: {
        content,
        updatedAt: new Date(),
      },
      create: {
        roomId: room.id,
        clerkUserId,
        content,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving notes:", error);
    return NextResponse.json({ error: "Failed to save notes" }, { status: 500 });
  }
}

/**
 * GET /api/room/[roomId]/notes
 * Get personal notes for a user in a room
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

    const note = await prisma.roomNote.findUnique({
      where: {
        roomId_clerkUserId: {
          roomId: room.id,
          clerkUserId,
        },
      },
    });

    return NextResponse.json({ content: note?.content || null });
  } catch (error) {
    console.error("Error getting notes:", error);
    return NextResponse.json({ error: "Failed to get notes" }, { status: 500 });
  }
}
