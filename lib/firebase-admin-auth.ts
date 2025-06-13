import { connectToDatabase } from "./mongodb"

// Sync Google OAuth user with MongoDB
export async function syncUserWithMongoDB(user: any, userData: any = {}) {
  const { db } = await connectToDatabase()

  // Check if user already exists in MongoDB
  const existingUser = await db.collection("users").findOne({ email: user.email })

  if (existingUser) {
    // Update existing user
    await db.collection("users").updateOne(
      { email: user.email },
      {
        $set: {
          name: user.name || userData.name,
          updatedAt: new Date(),
          ...userData,
        },
      },
    )
    return existingUser._id
  } else {
    // Create new user
    const result = await db.collection("users").insertOne({
      name: user.name || userData.name,
      email: user.email,
      mobile: user.mobile || userData.mobile,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...userData,
    })
    return result.insertedId
  }
}