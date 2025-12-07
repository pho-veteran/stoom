import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

/**
 * Helper to check if string is valid MongoDB ObjectID
 */
function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id)
}

/**
 * POST /api/room/[roomId]/cohost
 * Grant co-host role to a participant (host only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { roomId } = await params
    const { targetUserId } = await request.json()

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 })
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find the room by code (or id if valid ObjectID)
    const room = await prisma.room.findFirst({
      where: isValidObjectId(roomId)
        ? { OR: [{ code: roomId }, { id: roomId }] }
        : { code: roomId },
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // Only the owner can grant co-host
    if (room.ownerId !== dbUser.id) {
      return NextResponse.json(
        { error: "Only the room owner can grant co-host privileges" },
        { status: 403 }
      )
    }

    // Find the target user by clerkId (identity)
    const targetUser = await prisma.user.findUnique({
      where: { clerkId: targetUserId },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 })
    }

    // Update the participant's role to CO_HOST
    const updatedParticipant = await prisma.roomParticipant.update({
      where: {
        userId_roomId: {
          userId: targetUser.id,
          roomId: room.id,
        },
      },
      data: {
        role: "CO_HOST",
      },
    })

    return NextResponse.json({
      success: true,
      participant: {
        userId: targetUserId,
        role: updatedParticipant.role,
      },
    })
  } catch (error) {
    console.error("Error granting co-host:", error)
    return NextResponse.json(
      { error: "Failed to grant co-host privileges" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/room/[roomId]/cohost
 * Revoke co-host role from a participant (host only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { roomId } = await params
    const { targetUserId } = await request.json()

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 })
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find the room by code (or id if valid ObjectID)
    const room = await prisma.room.findFirst({
      where: isValidObjectId(roomId)
        ? { OR: [{ code: roomId }, { id: roomId }] }
        : { code: roomId },
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // Only the owner can revoke co-host
    if (room.ownerId !== dbUser.id) {
      return NextResponse.json(
        { error: "Only the room owner can revoke co-host privileges" },
        { status: 403 }
      )
    }

    // Find the target user by clerkId (identity)
    const targetUser = await prisma.user.findUnique({
      where: { clerkId: targetUserId },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 })
    }

    // Update the participant's role back to PARTICIPANT
    const updatedParticipant = await prisma.roomParticipant.update({
      where: {
        userId_roomId: {
          userId: targetUser.id,
          roomId: room.id,
        },
      },
      data: {
        role: "PARTICIPANT",
      },
    })

    return NextResponse.json({
      success: true,
      participant: {
        userId: targetUserId,
        role: updatedParticipant.role,
      },
    })
  } catch (error) {
    console.error("Error revoking co-host:", error)
    return NextResponse.json(
      { error: "Failed to revoke co-host privileges" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/room/[roomId]/cohost
 * Get list of co-hosts for a room
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { roomId } = await params

    // Find the room by code (or id if valid ObjectID)
    const room = await prisma.room.findFirst({
      where: isValidObjectId(roomId)
        ? { OR: [{ code: roomId }, { id: roomId }] }
        : { code: roomId },
      include: {
        participants: {
          where: {
            role: "CO_HOST",
          },
          include: {
            user: true,
          },
        },
      },
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    const coHosts = room.participants.map((p) => p.user.clerkId)

    return NextResponse.json({
      coHosts,
    })
  } catch (error) {
    console.error("Error fetching co-hosts:", error)
    return NextResponse.json(
      { error: "Failed to fetch co-hosts" },
      { status: 500 }
    )
  }
}
