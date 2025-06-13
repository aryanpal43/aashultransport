import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get all users
    const users = await db
      .collection("users")
      .find({})
      .project({ password: 0 }) // Exclude password
      .toArray()

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Fetch users error:", error)
    return NextResponse.json({ message: "An error occurred while fetching users" }, { status: 500 })
  }
}
