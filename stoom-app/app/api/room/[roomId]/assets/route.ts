import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

/**
 * Helper to get room by code or ID
 */
async function getRoom(roomIdOrCode: string) {
  // Check if it's a valid MongoDB ObjectID (24 hex chars)
  if (/^[a-f\d]{24}$/i.test(roomIdOrCode)) {
    return prisma.room.findUnique({
      where: { id: roomIdOrCode },
      include: { participants: true },
    });
  }
  // Otherwise treat as room code
  return prisma.room.findUnique({
    where: { code: roomIdOrCode },
    include: { participants: true },
  });
}

/**
 * POST /api/room/[roomId]/assets
 * Upload an asset (image) for the whiteboard
 * Returns a URL that can be used by all participants
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

    const { roomId: roomIdOrCode } = await params;

    // Verify room exists and user has access
    const room = await getRoom(roomIdOrCode);

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isParticipant =
      room.ownerId === dbUser.id ||
      room.participants.some((p) => p.userId === dbUser.id);

    if (!isParticipant) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 });
    }

    // Get the file from form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "png";
    const filename = `${randomUUID()}.${ext}`;

    // Create uploads directory if it doesn't exist (use room.id for consistency)
    const uploadsDir = join(process.cwd(), "public", "uploads", "whiteboard", room.id);
    await mkdir(uploadsDir, { recursive: true });

    // Write file
    const filepath = join(uploadsDir, filename);
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    // Return the public URL
    const url = `/uploads/whiteboard/${room.id}/${filename}`;

    return NextResponse.json({ url, filename });
  } catch (error) {
    console.error("Error uploading asset:", error);
    return NextResponse.json({ error: "Failed to upload asset" }, { status: 500 });
  }
}
