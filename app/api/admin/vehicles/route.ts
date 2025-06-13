import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { connectToDatabase } from "@/lib/mongodb"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      const res = NextResponse.json({ message: "Unauthorized" }, { status: 401 })
      res.headers.set("Cache-Control", "no-store")
      return res
    }

    const { db } = await connectToDatabase()

    // Get all vehicles
    const vehicles = await db.collection("vehicles").find({}).toArray()

    const res = NextResponse.json({ vehicles })
    res.headers.set("Cache-Control", "no-store")
    return res
  } catch (error) {
    console.error("Fetch vehicles error:", error)
    const res = NextResponse.json({ message: "An error occurred while fetching vehicles" }, { status: 500 })
    res.headers.set("Cache-Control", "no-store")
    return res
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { name, type, model, registrationNumber, status } = await req.json()

    // Validate input
    if (!name || !type || !model || !registrationNumber || !status) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if vehicle with same registration number already exists
    const existingVehicle = await db.collection("vehicles").findOne({ registrationNumber })

    if (existingVehicle) {
      return NextResponse.json({ message: "Vehicle with this registration number already exists" }, { status: 409 })
    }

    // Create vehicle
    const result = await db.collection("vehicles").insertOne({
      name,
      type,
      model,
      registrationNumber,
      status,
      createdAt: new Date(),
      lastLocation: {
        latitude: 28.6139, // Default location (Delhi, India)
        longitude: 77.209,
        timestamp: new Date(),
      },
    })

    return NextResponse.json(
      {
        message: "Vehicle added successfully",
        vehicleId: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Add vehicle error:", error)
    return NextResponse.json({ message: "An error occurred while adding the vehicle" }, { status: 500 })
  }
}
