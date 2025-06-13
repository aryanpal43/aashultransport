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

    const { vehicleId } = await req.json()

    // Validate input
    if (!vehicleId) {
      return NextResponse.json({ message: "Vehicle ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if vehicle exists
    const vehicle = await db.collection("vehicles").findOne({ _id: new ObjectId(vehicleId) })

    if (!vehicle) {
      return NextResponse.json({ message: "Vehicle not found" }, { status: 404 })
    }

    // Check if vehicle is assigned
    if (vehicle.status !== "assigned") {
      return NextResponse.json({ message: "Vehicle is not currently assigned" }, { status: 400 })
    }

    // Unassign vehicle
    await db.collection("vehicles").updateOne(
      { _id: new ObjectId(vehicleId) },
      {
        $set: {
          status: "available",
        },
        $unset: {
          assignedTo: "",
          assignedAt: "",
        },
      },
    )

    return NextResponse.json({
      message: "Vehicle unassigned successfully",
    })
  } catch (error) {
    console.error("Unassign vehicle error:", error)
    return NextResponse.json({ message: "An error occurred while unassigning the vehicle" }, { status: 500 })
  }
}
