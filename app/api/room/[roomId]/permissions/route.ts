import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import type { UpdatePermissionsRequest, PermissionLevel } from "@/lib/collaboration-types"

/**
 * Validate permission level value
 */
function isValidPermissionLevel(value: unknown): value is PermissionLevel {
  return value === 'open' || value === 'restricted' || value === 'disabled'
}

/**
 * PATCH /api/room/[roomId]/permissions
 * Update whiteboard/notes permissions and allowed users for a room
 * 
 * Requirements: 8.6, 8.7
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { roomId } = await params

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find the room by code (or id if it's a valid ObjectID)
    const isValidObjectId = /^[a-f\d]{24}$/i.test(roomId)
    const room = await prisma.room.findFirst({
      where: isValidObjectId
        ? { OR: [{ code: roomId }, { id: roomId }] }
        : { code: roomId },
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }


    // Check if user is the owner or co-host
    const isOwner = room.ownerId === dbUser.id
    const participant = await prisma.roomParticipant.findUnique({
      where: {
        userId_roomId: {
          userId: dbUser.id,
          roomId: room.id,
        },
      },
    })
    const isCoHost = participant?.role === "CO_HOST"
    
    if (!isOwner && !isCoHost) {
      return NextResponse.json(
        { error: "Only the room owner or co-hosts can update permissions" },
        { status: 403 }
      )
    }

    // Parse request body
    const body: UpdatePermissionsRequest = await request.json()
    const { 
      whiteboardPermission, 
      notesPermission, 
      whiteboardAllowedUsers, 
      notesAllowedUsers 
    } = body

    // Validate permission levels if provided
    if (whiteboardPermission !== undefined && !isValidPermissionLevel(whiteboardPermission)) {
      return NextResponse.json(
        { error: "Invalid whiteboardPermission value. Must be 'open', 'restricted', or 'disabled'" },
        { status: 400 }
      )
    }

    if (notesPermission !== undefined && !isValidPermissionLevel(notesPermission)) {
      return NextResponse.json(
        { error: "Invalid notesPermission value. Must be 'open', 'restricted', or 'disabled'" },
        { status: 400 }
      )
    }

    // Validate allowed users arrays if provided
    if (whiteboardAllowedUsers !== undefined && !Array.isArray(whiteboardAllowedUsers)) {
      return NextResponse.json(
        { error: "whiteboardAllowedUsers must be an array" },
        { status: 400 }
      )
    }

    if (notesAllowedUsers !== undefined && !Array.isArray(notesAllowedUsers)) {
      return NextResponse.json(
        { error: "notesAllowedUsers must be an array" },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: {
      whiteboardPermission?: string
      notesPermission?: string
      whiteboardAllowedUsers?: string[]
      notesAllowedUsers?: string[]
    } = {}

    if (whiteboardPermission !== undefined) {
      updateData.whiteboardPermission = whiteboardPermission
    }

    if (notesPermission !== undefined) {
      updateData.notesPermission = notesPermission
    }

    if (whiteboardAllowedUsers !== undefined) {
      updateData.whiteboardAllowedUsers = whiteboardAllowedUsers
    }

    if (notesAllowedUsers !== undefined) {
      updateData.notesAllowedUsers = notesAllowedUsers
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 }
      )
    }

    // Update the room permissions
    const updatedRoom = await prisma.room.update({
      where: { id: room.id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      permissions: {
        whiteboardPermission: updatedRoom.whiteboardPermission,
        notesPermission: updatedRoom.notesPermission,
        whiteboardAllowedUsers: updatedRoom.whiteboardAllowedUsers,
        notesAllowedUsers: updatedRoom.notesAllowedUsers,
      },
    })
  } catch (error) {
    console.error("Error updating room permissions:", error)
    return NextResponse.json(
      { error: "Failed to update room permissions" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/room/[roomId]/permissions
 * Get current permissions for a room
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

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find the room by code (or id if it's a valid ObjectID)
    const isValidObjectId = /^[a-f\d]{24}$/i.test(roomId)
    const room = await prisma.room.findFirst({
      where: isValidObjectId
        ? { OR: [{ code: roomId }, { id: roomId }] }
        : { code: roomId },
      include: {
        participants: true,
      },
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // Check if user has access (owner or participant)
    const isOwner = room.ownerId === dbUser.id
    const isParticipant = room.participants.some((p) => p.userId === dbUser.id)

    if (!isOwner && !isParticipant) {
      return NextResponse.json(
        { error: "You don't have access to this room" },
        { status: 403 }
      )
    }

    return NextResponse.json({
      permissions: {
        whiteboardPermission: room.whiteboardPermission,
        notesPermission: room.notesPermission,
        whiteboardAllowedUsers: room.whiteboardAllowedUsers,
        notesAllowedUsers: room.notesAllowedUsers,
      },
      isOwner,
    })
  } catch (error) {
    console.error("Error fetching room permissions:", error)
    return NextResponse.json(
      { error: "Failed to fetch room permissions" },
      { status: 500 }
    )
  }
}
