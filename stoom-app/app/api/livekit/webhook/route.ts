import { NextRequest, NextResponse } from "next/server"
import { WebhookReceiver } from "livekit-server-sdk"
import { prisma } from "@/lib/prisma"
import { RoomStatus } from "@/app/generated/prisma"

// LiveKit webhook receiver for validating webhook signatures
const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY || "devkey",
  process.env.LIVEKIT_API_SECRET || "secret"
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const authHeader = request.headers.get("Authorization")

    if (!authHeader) {
      console.error("Missing Authorization header")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate webhook signature
    let event
    try {
      event = await receiver.receive(body, authHeader)
    } catch (error) {
      console.error("Invalid webhook signature:", error)
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    console.log(`[LiveKit Webhook] Event: ${event.event}`, {
      room: event.room?.name,
      participant: event.participant?.identity,
    })

    // Handle different webhook events
    switch (event.event) {
      case "room_started":
        await handleRoomStarted(event.room?.name)
        break

      case "room_finished":
        await handleRoomFinished(event.room?.name)
        break

      case "participant_joined":
        await handleParticipantJoined(
          event.room?.name,
          event.participant?.identity,
          event.participant?.name
        )
        break

      case "participant_left":
        await handleParticipantLeft(event.room?.name, event.participant?.identity)
        break

      default:
        console.log(`[LiveKit Webhook] Unhandled event: ${event.event}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[LiveKit Webhook] Error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function handleRoomStarted(roomName?: string) {
  if (!roomName) return

  try {
    const room = await prisma.room.findUnique({
      where: { code: roomName },
    })

    if (room) {
      await prisma.room.update({
        where: { id: room.id },
        data: {
          status: RoomStatus.ACTIVE,
          startedAt: new Date(),
        },
      })
      console.log(`[LiveKit Webhook] Room ${roomName} started`)
    }
  } catch (error) {
    console.error(`[LiveKit Webhook] Error handling room_started:`, error)
  }
}

async function handleRoomFinished(roomName?: string) {
  if (!roomName) return

  try {
    const room = await prisma.room.findUnique({
      where: { code: roomName },
    })

    if (room && room.status !== RoomStatus.ENDED) {
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
        where: {
          roomId: room.id,
          leftAt: null,
        },
        data: {
          leftAt: new Date(),
        },
      })

      console.log(`[LiveKit Webhook] Room ${roomName} finished and marked as ENDED`)
    }
  } catch (error) {
    console.error(`[LiveKit Webhook] Error handling room_finished:`, error)
  }
}

async function handleParticipantJoined(
  roomName?: string,
  participantIdentity?: string,
  participantName?: string
) {
  if (!roomName || !participantIdentity) return

  try {
    const room = await prisma.room.findUnique({
      where: { code: roomName },
    })

    if (!room) return

    // Try to find user by clerkId (participantIdentity is the clerkId)
    const user = await prisma.user.findUnique({
      where: { clerkId: participantIdentity },
    })

    if (user) {
      // Check if participant record already exists
      const existingParticipant = await prisma.roomParticipant.findUnique({
        where: {
          userId_roomId: {
            userId: user.id,
            roomId: room.id,
          },
        },
      })

      if (existingParticipant) {
        // Update existing record (rejoin)
        await prisma.roomParticipant.update({
          where: { id: existingParticipant.id },
          data: {
            leftAt: null,
            joinedAt: new Date(),
          },
        })
      } else {
        // Create new participant record
        const isHost = room.ownerId === user.id
        await prisma.roomParticipant.create({
          data: {
            userId: user.id,
            roomId: room.id,
            role: isHost ? "HOST" : "PARTICIPANT",
          },
        })
      }

      console.log(`[LiveKit Webhook] Participant ${participantName || participantIdentity} joined room ${roomName}`)
    }
  } catch (error) {
    console.error(`[LiveKit Webhook] Error handling participant_joined:`, error)
  }
}

async function handleParticipantLeft(roomName?: string, participantIdentity?: string) {
  if (!roomName || !participantIdentity) return

  try {
    const room = await prisma.room.findUnique({
      where: { code: roomName },
    })

    if (!room) return

    const user = await prisma.user.findUnique({
      where: { clerkId: participantIdentity },
    })

    if (user) {
      await prisma.roomParticipant.updateMany({
        where: {
          userId: user.id,
          roomId: room.id,
          leftAt: null,
        },
        data: {
          leftAt: new Date(),
        },
      })

      console.log(`[LiveKit Webhook] Participant ${participantIdentity} left room ${roomName}`)
    }
  } catch (error) {
    console.error(`[LiveKit Webhook] Error handling participant_left:`, error)
  }
}
