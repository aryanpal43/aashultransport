import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Admin doesn't have a profile in the database
    if (session.user.role === "admin") {
      return NextResponse.json({
        name: session.user.name,
        email: session.user.email,
        role: "admin",
      })
    }

    const user = await db.collection("users").findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      mobile: user.mobile,
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ message: "An error occurred while fetching profile" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { name, mobile } = await req.json()

    // Validate input
    if (!name) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Admin profile update is not supported
    if (session.user.role === "admin") {
      return NextResponse.json({
        message: "Admin profile updated",
        name,
      })
    }

    const user = await db.collection("users").findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Update user
    await db.collection("users").updateOne({ _id: user._id }, { $set: { name, mobile } })

    return NextResponse.json({
      message: "Profile updated successfully",
      name,
      mobile,
    })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ message: "An error occurred while updating profile" }, { status: 500 })
  }
}
