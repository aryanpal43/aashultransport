import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get vehicle by ID - ensure params.id is a string
    const id = params.id
    const vehicle = await db.collection("vehicles").findOne({ _id: new ObjectId(id) })

    if (!vehicle) {
      return NextResponse.json({ message: "Vehicle not found" }, { status: 404 })
    }

    return NextResponse.json({ vehicle })
  } catch (error) {
    console.error("Fetch vehicle error:", error)
    return NextResponse.json({ message: "An error occurred while fetching the vehicle" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    let { name, type, model, registrationNumber, status } = await req.json()

    // Validate input
    if (!name || !type || !model || !registrationNumber || !status) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Enforce uppercase for registration number
    registrationNumber = registrationNumber.toUpperCase()

    // Registration number format: e.g., UK07DD4444
    const regNumPattern = /^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/
    if (!regNumPattern.test(registrationNumber)) {
      return NextResponse.json(
        { message: "Registration number format is invalid. Example: UK07DD4444" },
        { status: 400 },
      )
    }

    const { db } = await connectToDatabase()

    // Check if vehicle exists
    const id = params.id
    const vehicle = await db.collection("vehicles").findOne({ _id: new ObjectId(id) })

    if (!vehicle) {
      return NextResponse.json({ message: "Vehicle not found" }, { status: 404 })
    }

    // Check if another vehicle has the same registration number
    const existingVehicle = await db.collection("vehicles").findOne({
      registrationNumber,
      _id: { $ne: new ObjectId(id) },
    })

    if (existingVehicle) {
      return NextResponse.json(
        { message: "Another vehicle with this registration number already exists" },
        { status: 409 },
      )
    }

    // Update vehicle
    await db.collection("vehicles").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name,
          type,
          model,
          registrationNumber,
          status,
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({
      message: "Vehicle updated successfully",
    })
  } catch (error) {
    console.error("Update vehicle error:", error)
    return NextResponse.json({ message: "An error occurred while updating the vehicle" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Check if vehicle exists
    const id = params.id
    const vehicle = await db.collection("vehicles").findOne({ _id: new ObjectId(id) })

    if (!vehicle) {
      return NextResponse.json({ message: "Vehicle not found" }, { status: 404 })
    }

    // Delete vehicle
    await db.collection("vehicles").deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      message: "Vehicle deleted successfully",
    })
  } catch (error) {
    console.error("Delete vehicle error:", error)
    return NextResponse.json({ message: "An error occurred while deleting the vehicle" }, { status: 500 })
  }
}
