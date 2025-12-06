import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get room with all related data
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        owner: true,
        participants: {
          include: { user: true },
          orderBy: { joinedAt: "asc" },
        },
        chatMessages: {
          include: { user: true },
          orderBy: { createdAt: "asc" },
        },
      },
    })

    if (!room) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Check if user has access (owner or participant)
    const isOwner = room.ownerId === dbUser.id
    const isParticipant = room.participants.some((p) => p.userId === dbUser.id)

    if (!isOwner && !isParticipant) {
      return NextResponse.json(
        { error: "You don't have access to this session" },
        { status: 403 }
      )
    }

    const sessionDetail = {
      id: room.id,
      code: room.code,
      name: room.name,
      description: room.description,
      status: room.status,
      createdAt: room.createdAt.toISOString(),
      startedAt: room.startedAt?.toISOString() || null,
      endedAt: room.endedAt?.toISOString() || null,
      owner: {
        name: room.owner.name || "Unknown",
        email: room.owner.email,
        imageUrl: room.owner.imageUrl,
      },
      participants: room.participants.map((p) => ({
        id: p.id,
        name: p.user.name || "Unknown",
        email: p.user.email,
        imageUrl: p.user.imageUrl,
        role: p.role,
        joinedAt: p.joinedAt.toISOString(),
        leftAt: p.leftAt?.toISOString() || null,
      })),
      messages: room.chatMessages.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        user: {
          name: m.user.name || "Unknown",
          imageUrl: m.user.imageUrl,
        },
      })),
      isOwner,
    }

    return NextResponse.json(sessionDetail)
  } catch (error) {
    console.error("Error fetching session:", error)
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    )
  }
}
