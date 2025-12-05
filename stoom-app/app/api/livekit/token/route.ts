import { NextRequest, NextResponse } from "next/server"
import { AccessToken } from "livekit-server-sdk"
import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await currentUser()
    const body = await request.json()
    const { roomName } = body

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
    await prisma.user.upsert({
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

    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: participantName,
      ttl: "6h",
      metadata: JSON.stringify({
        imageUrl: user?.imageUrl || null,
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
