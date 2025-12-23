import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * Helper to check if string is valid MongoDB ObjectID
 */
function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

/**
 * PUT /api/room/[roomId]/password
 * Update room password (host only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;
    const body = await request.json();
    const { password } = body;

    // Get the requesting user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the room by code or ID
    const room = await prisma.room.findFirst({
      where: isValidObjectId(roomId)
        ? { OR: [{ code: roomId }, { id: roomId }] }
        : { code: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if requester is the host (Requirement 3.8)
    const isHost = room.ownerId === dbUser.id;

    if (!isHost) {
      return NextResponse.json(
        { error: "Only the host can manage room passwords" },
        { status: 403 }
      );
    }

    // Validate password if provided
    // password can be null to remove password, or a string to set/change
    if (password !== null && password !== undefined) {
      if (typeof password !== "string") {
        return NextResponse.json(
          { error: "Password must be a string" },
          { status: 400 }
        );
      }

      if (password.length < 4) {
        return NextResponse.json(
          { error: "Password must be at least 4 characters" },
          { status: 400 }
        );
      }
    }

    // Hash the password if provided, or set to null to remove
    let hashedPassword: string | null = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // Update room password in database (Requirement 3.5)
    await prisma.room.update({
      where: { id: room.id },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      success: true,
      hasPassword: !!hashedPassword,
      message: hashedPassword
        ? "Password has been set successfully"
        : "Password has been removed",
    });
  } catch (error) {
    console.error("Error updating room password:", error);
    return NextResponse.json(
      { error: "Failed to update room password" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/room/[roomId]/password
 * Check if room has a password (for UI display)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;

    // Get the requesting user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the room by code or ID
    const room = await prisma.room.findFirst({
      where: isValidObjectId(roomId)
        ? { OR: [{ code: roomId }, { id: roomId }] }
        : { code: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if requester is the host
    const isHost = room.ownerId === dbUser.id;

    return NextResponse.json({
      hasPassword: !!room.password,
      isHost,
    });
  } catch (error) {
    console.error("Error checking room password:", error);
    return NextResponse.json(
      { error: "Failed to check room password" },
      { status: 500 }
    );
  }
}
