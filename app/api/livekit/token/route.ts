import { NextRequest, NextResponse } from "next/server"
import { AccessToken } from "livekit-server-sdk"
import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await currentUser()
    const body = await request.json()
    const { roomName, password } = body

    if (!roomName) {
      return NextResponse.json({ error: "Room name is required" }, { status: 400 })
    }

    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: "LiveKit configuration missing" }, { status: 500 })
    }

    const participantName = user?.firstName
      ? `${user.firstName} ${user.lastName || ""}`.trim()
      : user?.emailAddresses?.[0]?.emailAddress || "Anonymous"

    const email = user?.emailAddresses?.[0]?.emailAddress || `${userId}@temp.com`

    // Ensure user exists in database (upsert)
    const dbUser = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        name: participantName,
        email: email,
        imageUrl: user?.imageUrl,
      },
      create: {
        clerkId: userId,
        email: email,
        name: participantName,
        imageUrl: user?.imageUrl,
      },
    })

    // Get the room by code
    const room = await prisma.room.findUnique({
      where: { code: roomName },
    })

    // Validate password if room has one
    // Host is exempt from password check
    if (room && room.password) {
      const isHost = room.ownerId === dbUser.id
      
      if (!isHost) {
        // Non-host must provide correct password
        if (!password) {
          return NextResponse.json(
            { error: "Password required", code: "PASSWORD_REQUIRED" },
            { status: 401 }
          )
        }
        
        const isValidPassword = await bcrypt.compare(password, room.password)
        if (!isValidPassword) {
          return NextResponse.json(
            { error: "Incorrect password", code: "INVALID_PASSWORD" },
            { status: 401 }
          )
        }
      }
    }

    // Determine participant role
    let participantRole: "HOST" | "CO_HOST" | "PARTICIPANT" = "PARTICIPANT"
    
    if (room) {
      // Create or update participant record when token is generated
      // This ensures participants are recorded even if webhooks fail
      const isHost = room.ownerId === dbUser.id
      
      // Check if user is already a co-host
      const existingParticipant = await prisma.roomParticipant.findUnique({
        where: {
          userId_roomId: {
            userId: dbUser.id,
            roomId: room.id,
          },
        },
      })
      
      if (isHost) {
        participantRole = "HOST"
      } else if (existingParticipant?.role === "CO_HOST") {
        participantRole = "CO_HOST"
      }
      
      await prisma.roomParticipant.upsert({
        where: {
          userId_roomId: {
            userId: dbUser.id,
            roomId: room.id,
          },
        },
        update: {
          // Reset leftAt if rejoining
          leftAt: null,
          joinedAt: new Date(),
        },
        create: {
          userId: dbUser.id,
          roomId: room.id,
          role: isHost ? "HOST" : "PARTICIPANT",
        },
      })

      // Update room status to ACTIVE when first participant joins
      if (room.status === "WAITING") {
        await prisma.room.update({
          where: { id: room.id },
          data: {
            status: "ACTIVE",
            startedAt: new Date(),
          },
        })
      }
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: participantName,
      ttl: "6h",
      metadata: JSON.stringify({
        imageUrl: user?.imageUrl || null,
        role: participantRole,
      }),
    })

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })

    const token = await at.toJwt()

    return NextResponse.json({ token })
  } catch (error) {
    console.error("Error generating LiveKit token:", error)
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 })
  }
}
