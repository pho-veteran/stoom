import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { RoomStatus } from "@/app/generated/prisma"
import { checkLiveKitRoom } from "@/lib/livekit-server"

// How long a room can be ACTIVE without LiveKit room existing before cleanup (ms)
const STALE_ROOM_THRESHOLD = 5 * 60 * 1000 // 5 minutes
// How long a WAITING room can exist without becoming ACTIVE before cleanup (ms)
const WAITING_ROOM_THRESHOLD = 30 * 60 * 1000 // 30 minutes

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const roomCode = searchParams.get("code")

    if (!roomCode) {
      return NextResponse.json({ error: "Room code is required" }, { status: 400 })
    }

    // Find the room
    const room = await prisma.room.findUnique({
      where: { code: roomCode },
      include: {
        owner: {
          select: { id: true, clerkId: true, name: true },
        },
      },
    })

    if (!room) {
      return NextResponse.json(
        { error: "Room not found", code: "ROOM_NOT_FOUND" },
        { status: 404 }
      )
    }

    if (room.status === RoomStatus.ENDED) {
      return NextResponse.json(
        { error: "This meeting has ended", code: "ROOM_ENDED" },
        { status: 410 }
      )
    }

    if (!room.isActive) {
      return NextResponse.json(
        { error: "This room is no longer active", code: "ROOM_INACTIVE" },
        { status: 410 }
      )
    }

    // Stale room cleanup: Check if LiveKit room actually exists
    const liveKitRoom = await checkLiveKitRoom(room.code)

    // Case 1: Room is ACTIVE but LiveKit room doesn't exist
    if (room.status === RoomStatus.ACTIVE && room.startedAt && !liveKitRoom.exists) {
      const timeSinceStart = Date.now() - new Date(room.startedAt).getTime()

      if (timeSinceStart > STALE_ROOM_THRESHOLD) {
        // Stale ACTIVE room detected - clean it up
        await prisma.room.update({
          where: { id: room.id },
          data: {
            status: RoomStatus.ENDED,
            isActive: false,
            endedAt: new Date(),
          },
        })

        // Mark all participants as left
        await prisma.roomParticipant.updateMany({
          where: { roomId: room.id, leftAt: null },
          data: { leftAt: new Date() },
        })

        console.log(`[Stale Room Cleanup] Room ${room.code} marked as ENDED (ACTIVE but LiveKit room not found)`)

        return NextResponse.json(
          { error: "This meeting has ended", code: "ROOM_ENDED" },
          { status: 410 }
        )
      }
    }

    // Case 2: Room is WAITING and LiveKit room doesn't exist (never started or everyone left)
    if (room.status === RoomStatus.WAITING && !liveKitRoom.exists) {
      const timeSinceCreated = Date.now() - new Date(room.createdAt).getTime()

      // If room has been WAITING for too long, mark as ended
      if (timeSinceCreated > WAITING_ROOM_THRESHOLD) {
        await prisma.room.update({
          where: { id: room.id },
          data: {
            status: RoomStatus.ENDED,
            isActive: false,
            endedAt: new Date(),
          },
        })

        console.log(`[Stale Room Cleanup] Room ${room.code} marked as ENDED (WAITING too long, never started)`)

        return NextResponse.json(
          { error: "This meeting has ended", code: "ROOM_ENDED" },
          { status: 410 }
        )
      }
    }

    // Case 3: Room is WAITING but LiveKit room exists with 0 participants (everyone left)
    // This handles the case where webhooks aren't working
    if (room.status === RoomStatus.WAITING && liveKitRoom.exists && liveKitRoom.numParticipants === 0) {
      // Check if room was created more than 5 minutes ago
      const timeSinceCreated = Date.now() - new Date(room.createdAt).getTime()

      if (timeSinceCreated > STALE_ROOM_THRESHOLD) {
        await prisma.room.update({
          where: { id: room.id },
          data: {
            status: RoomStatus.ENDED,
            isActive: false,
            endedAt: new Date(),
          },
        })

        console.log(`[Stale Room Cleanup] Room ${room.code} marked as ENDED (WAITING with 0 participants)`)

        return NextResponse.json(
          { error: "This meeting has ended", code: "ROOM_ENDED" },
          { status: 410 }
        )
      }
    }

    // Check if current user is the host
    const isHost = room.owner.clerkId === userId

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        code: room.code,
        name: room.name,
        status: room.status,
        isHost,
        hasPassword: !!room.password,
        maxParticipants: room.maxParticipants,
      },
    })
  } catch (error) {
    console.error("Error validating room:", error)
    return NextResponse.json(
      { error: "Failed to validate room" },
      { status: 500 }
    )
  }
}
