import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { vehicleId, userMobile, userEmail } = await req.json()

    // Validate input: vehicleId and at least one user identifier (mobile OR email)
    if (!vehicleId || (!userMobile && !userEmail)) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if vehicle exists
    const vehicle = await db.collection("vehicles").findOne({ _id: new ObjectId(vehicleId) })

    if (!vehicle) {
      return NextResponse.json({ message: "Vehicle not found" }, { status: 404 })
    }

    // Check if vehicle is available
    if (vehicle.status !== "available") {
      return NextResponse.json({ message: "Vehicle is not available for assignment" }, { status: 400 })
    }

    // Find user by mobile OR email
    let user = null
    if (userMobile) {
      user = await db.collection("users").findOne({ mobile: userMobile })
    }
    if (!user && userEmail) {
      user = await db.collection("users").findOne({ email: userEmail })
    }

    if (!user) {
      return NextResponse.json({ message: "User not found with provided details" }, { status: 404 })
    }

    // Assign vehicle to user
    await db.collection("vehicles").updateOne(
      { _id: new ObjectId(vehicleId) },
      {
        $set: {
          status: "assigned",
          assignedTo: {
            _id: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
          },
          assignedAt: new Date(),
        },
      },
    )

    return NextResponse.json({
      message: "Vehicle assigned successfully",
    })
  } catch (error) {
    console.error("Assign vehicle error:", error)
    return NextResponse.json({ message: "An error occurred while assigning the vehicle" }, { status: 500 })
  }
}