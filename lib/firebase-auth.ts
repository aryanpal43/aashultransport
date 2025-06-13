import { signInWithPopup, signOut as firebaseSignOut } from "firebase/auth"
import { auth, googleProvider } from "@/lib/firebase"
import { signIn } from "next-auth/react"

export async function signOutFirebase() {
  try {
    return await firebaseSignOut(auth)
  } catch (error) {
    console.error("Firebase sign out error:", error)
    throw error
  }
}
