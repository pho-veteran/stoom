import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!dbUser) {
      return NextResponse.json({ sessions: [] })
    }

    // Get all rooms where user is owner or participant
    const rooms = await prisma.room.findMany({
      where: {
        OR: [
          { ownerId: dbUser.id },
          { participants: { some: { userId: dbUser.id } } },
        ],
      },
      include: {
        owner: true,
        participants: true,
        chatMessages: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const sessions = rooms.map((room) => ({
      id: room.id,
      code: room.code,
      name: room.name,
      status: room.status,
      createdAt: room.createdAt.toISOString(),
      startedAt: room.startedAt?.toISOString() || null,
      endedAt: room.endedAt?.toISOString() || null,
      participantCount: room.participants.length,
      messageCount: room.chatMessages.length,
      isOwner: room.ownerId === dbUser.id,
    }))

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    )
  }
}
