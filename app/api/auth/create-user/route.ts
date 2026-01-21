import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const { id, email, username } = await request.json()

    if (!id || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 200 })
    }

    // Create user in our database
    await prisma.user.create({
      data: {
        id,
        email,
        username: username || null,
      }
    })

    return NextResponse.json({ message: "User created successfully" }, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
