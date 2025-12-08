import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, password, whiteboardPermission } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Room name is required" }, { status: 400 })
    }

    // Validate password if provided (minimum 4 characters)
    if (password && password.length < 4) {
      return NextResponse.json(
        { error: "Password must be at least 4 characters" },
        { status: 400 }
      )
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      // Create user if doesn't exist (first time)
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: `${userId}@temp.com`, // Will be updated by webhook
          name: "User",
        },
      })
    }

    // Generate unique room code
    const generateCode = () => Math.random().toString(36).substring(2, 8)
    let code = generateCode()
    
    // Ensure code is unique
    let existingRoom = await prisma.room.findUnique({ where: { code } })
    while (existingRoom) {
      code = generateCode()
      existingRoom = await prisma.room.findUnique({ where: { code } })
    }

    // Hash password if provided
    let hashedPassword: string | null = null
    if (password) {
      const salt = await bcrypt.genSalt(10)
      hashedPassword = await bcrypt.hash(password, salt)
    }

    // Create room
    const room = await prisma.room.create({
      data: {
        code,
        name: name.trim(),
        password: hashedPassword,
        ownerId: user.id,
        whiteboardPermission: whiteboardPermission || "open",
      },
    })

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        code: room.code,
        name: room.name,
      },
    })
  } catch (error) {
    console.error("Error creating room:", error)
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    )
  }
}
