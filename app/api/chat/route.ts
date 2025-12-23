import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

// POST - Save a chat message
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { roomId, message } = body

    if (!roomId || !message) {
      return NextResponse.json(
        { error: "Room ID and message are required" },
        { status: 400 }
      )
    }

    // Get room by code
    const room = await prisma.room.findUnique({
      where: { code: roomId },
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // Check if room is in ACTIVE state
    if (room.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Chat is only available when the room is active" },
        { status: 403 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Save chat message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        content: message,
        userId: user.id,
        roomId: room.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    })

    return NextResponse.json({
      id: chatMessage.id,
      content: chatMessage.content,
      createdAt: chatMessage.createdAt,
      user: chatMessage.user,
    })
  } catch (error) {
    console.error("Error saving chat message:", error)
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 }
    )
  }
}

// GET - Get chat messages for a room
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get("roomId")

    if (!roomId) {
      return NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 }
      )
    }

    // Get room by code
    const room = await prisma.room.findUnique({
      where: { code: roomId },
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // Get chat messages
    const messages = await prisma.chatMessage.findMany({
      where: { roomId: room.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            clerkId: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt,
        user: {
          id: m.user.id,
          name: m.user.name,
          imageUrl: m.user.imageUrl,
          clerkId: m.user.clerkId,
        },
      })),
    })
  } catch (error) {
    console.error("Error fetching chat messages:", error)
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
}
