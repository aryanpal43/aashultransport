import NextAuth from "next-auth"
import FirebaseGoogleProvider from "@/lib/firebase-auth-provider"
import CredentialsProvider from "next-auth/providers/credentials"
import { connectToDatabase } from "@/lib/mongodb"
import { compare } from "bcryptjs"
import { syncUserWithMongoDB } from "@/lib/firebase-admin-auth"

export const authOptions = {
  providers: [
    FirebaseGoogleProvider(),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        mobile: { label: "Mobile", type: "text" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials) return null

        const { db } = await connectToDatabase()

        // Admin login (static credentials)
        if (credentials.role === "admin") {
          if (credentials.email === process.env.ADMIN_EMAIL && credentials.password === process.env.ADMIN_PASSWORD) {
            return {
              id: "admin",
              name: "Admin",
              email: process.env.ADMIN_EMAIL,
              role: "admin",
            }
          }
          throw new Error("Invalid admin credentials")
        }

        // User login
        let user

        if (credentials.email) {
          user = await db.collection("users").findOne({ email: credentials.email })
        } else if (credentials.mobile) {
          user = await db.collection("users").findOne({ mobile: credentials.mobile })
        }

        if (!user) {
          throw new Error("User not found")
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error("Invalid password")
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: "user",
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Set token fields from user on login
      if (user) {
        token.id = user.id
        token.role = user.role || "user"
        if (user.mobile) {
          token.mobile = user.mobile
        }
      }
      // Sync user with MongoDB if Google login
      if (account && account.provider === "firebase-google" && user) {
        await syncUserWithMongoDB(user)
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        if (token.mobile) {
          session.user.mobile = token.mobile as string
        }
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url
      // For localhost development
      if (url.includes("localhost")) return url
      return baseUrl
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
