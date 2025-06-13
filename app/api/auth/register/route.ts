import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { name, email, mobile, password } = await req.json()

    // Validate input
    if (!name || !email || !mobile || !password) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if user already exists in MongoDB
    const existingUser = await db.collection("users").findOne({ $or: [{ email }, { mobile }] })

    if (existingUser) {
      return NextResponse.json({ message: "User with this email or mobile already exists" }, { status: 409 })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Save user directly to MongoDB
    const result = await db.collection("users").insertOne({
      name,
      email,
      mobile,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json(
      {
        message: "User registered successfully",
        userId: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "An error occurred during registration" }, { status: 500 })
  }
}