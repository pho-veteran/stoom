import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { SaveCollaborationRequest, GetCollaborationResponse } from "@/lib/collaboration-types";

/**
 * POST /api/sessions/[id]/collaboration
 * Save whiteboard snapshot for a room
 * Note: Personal notes are saved via /api/room/[roomId]/notes
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: roomId } = await params;

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse request body
    const body: SaveCollaborationRequest = await request.json();
    const { whiteboardSnapshot } = body;

    if (!whiteboardSnapshot) {
      return NextResponse.json(
        { error: "whiteboardSnapshot is required" },
        { status: 400 }
      );
    }

    // Find the room
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { participants: true },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if user has access (owner or participant)
    const isOwner = room.ownerId === dbUser.id;
    const isParticipant = room.participants.some((p) => p.userId === dbUser.id);

    if (!isOwner && !isParticipant) {
      return NextResponse.json(
        { error: "You don't have access to this room" },
        { status: 403 }
      );
    }

    // Update the room with whiteboard data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { whiteboardSnapshot };
    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      room: {
        id: updatedRoom.id,
        whiteboardSnapshot: updatedRoom.whiteboardSnapshot,
      },
    });
  } catch (error) {
    console.error("Error saving collaboration data:", error);
    return NextResponse.json(
      { error: "Failed to save collaboration data" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sessions/[id]/collaboration
 * Load whiteboard snapshot and user's notes for a room
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: roomId } = await params;

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the room with user's notes
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        participants: true,
        notes: {
          where: { clerkUserId: userId },
          take: 1,
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if user has access (owner or participant)
    const isOwner = room.ownerId === dbUser.id;
    const isParticipant = room.participants.some((p) => p.userId === dbUser.id);

    if (!isOwner && !isParticipant) {
      return NextResponse.json(
        { error: "You don't have access to this room" },
        { status: 403 }
      );
    }

    const response: GetCollaborationResponse = {
      whiteboardSnapshot: room.whiteboardSnapshot as unknown as GetCollaborationResponse["whiteboardSnapshot"],
      notesContent: (room.notes[0]?.content as unknown as GetCollaborationResponse["notesContent"]) || undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error loading collaboration data:", error);
    return NextResponse.json(
      { error: "Failed to load collaboration data" },
      { status: 500 }
    );
  }
}
