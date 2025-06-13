import { NextResponse } from "next/server"
import { admin } from "@/lib/firebase-admin"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json()

    if (!idToken) {
      return NextResponse.json({ message: "No token provided" }, { status: 400 })
    }

    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken)

    // Get user from Firebase
    const firebaseUser = await admin.auth().getUser(decodedToken.uid)

    // Get user from MongoDB to get role and other custom data
    const { db } = await connectToDatabase()
    const user = await db.collection("users").findOne({ email: firebaseUser.email })

    // Check if it's the admin email
    const isAdmin = firebaseUser.email === process.env.ADMIN_EMAIL

    return NextResponse.json({
      user: {
        id: user?._id || decodedToken.uid,
        name: firebaseUser.displayName || user?.name,
        email: firebaseUser.email,
        mobile: user?.mobile,
        role: isAdmin ? "admin" : "user",
        firebaseUid: decodedToken.uid,
      },
    })
  } catch (error) {
    console.error("Token verification error:", error)
    return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 })
  }
}
