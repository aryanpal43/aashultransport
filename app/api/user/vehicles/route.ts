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

    // Get user by email
    const user = await db.collection("users").findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Get vehicles assigned to this user
    const vehicles = await db
      .collection("vehicles")
      .find({
        "assignedTo._id": user._id,
        status: "assigned",
      })
      .toArray()

    return NextResponse.json({ vehicles })
  } catch (error) {
    console.error("Fetch vehicles error:", error)
    return NextResponse.json({ message: "An error occurred while fetching vehicles" }, { status: 500 })
  }
}
