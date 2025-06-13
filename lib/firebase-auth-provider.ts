import type { OAuthConfig } from "next-auth/providers"

export interface FirebaseGoogleCredentials {
  idToken?: string
  accessToken?: string
  email?: string
  name?: string
  image?: string
}

export default function FirebaseGoogleProvider(): OAuthConfig<FirebaseGoogleCredentials> {
  return {
    id: "firebase-google",
    name: "Firebase Google",
    type: "oauth",
    wellKnown: "https://accounts.google.com/.well-known/openid-configuration",
    authorization: { params: { scope: "openid email profile" } },
    idToken: true,
    checks: ["pkce", "state"],
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
      }
    },
    credentials: {
      idToken: { label: "ID Token", type: "text" },
      accessToken: { label: "Access Token", type: "text" },
      email: { label: "Email", type: "text" },
      name: { label: "Name", type: "text" },
      image: { label: "Image", type: "text" },
    },
    async authorize(credentials) {
      if (!credentials) return null

      return {
        id: credentials.email || "",
        email: credentials.email,
        name: credentials.name,
        image: credentials.image,
      }
    },
  }
}
