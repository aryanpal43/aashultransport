"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const role = searchParams.get("role") || "user"

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    mobile: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
        role,
      })

      if (result?.error) {
        toast({
          title: "Login Failed",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Login Successful",
          description: "Welcome to Aashul Transport!",
        })
        router.push(role === "admin" ? "/admin/dashboard" : "/dashboard")
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "An error occurred during login.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMobileLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        redirect: false,
        mobile: formData.mobile,
        password: formData.password,
        role,
      })

      if (result?.error) {
        toast({
          title: "Login Failed",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Login Successful",
          description: "Welcome to Aashul Transport!",
        })
        router.push(role === "admin" ? "/admin/dashboard" : "/dashboard")
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "An error occurred during login.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      await signIn("firebase-google", {
        callbackUrl: role === "admin" ? "/admin/dashboard" : "/dashboard",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen transport-gradient-subtle py-12 px-4 flex flex-col items-center justify-center">
      <Link
        href="/"
        className="absolute top-4 left-4 flex items-center text-muted-foreground hover:text-transport-orange transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Link>

      <div className="flex items-center mb-8">
        <div className="relative h-8 w-8 mr-3">
          <Image src="/logo.png" alt="Aashul Transport" fill className="object-contain" />
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-transport-orange to-transport-orange-light bg-clip-text text-transparent">
          Aashul Transport
        </h1>
      </div>

      <Card className="w-full max-w-md border-transport-orange/20">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            {role === "admin"
              ? "Login as an admin to manage vehicles and users."
              : "Login to track and manage your assigned vehicles."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="mobile">Mobile</TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="focus:ring-transport-orange focus:border-transport-orange"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/forgot-password" className="text-sm text-transport-orange hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="focus:ring-transport-orange focus:border-transport-orange"
                  />
                </div>
                <Button type="submit" className="w-full transport-gradient hover:opacity-90" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login with Email"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="mobile">
              <form onSubmit={handleMobileLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    placeholder="+1234567890"
                    required
                    value={formData.mobile}
                    onChange={handleChange}
                    className="focus:ring-transport-orange focus:border-transport-orange"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password-mobile">Password</Label>
                    <Link href="/forgot-password" className="text-sm text-transport-orange hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password-mobile"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="focus:ring-transport-orange focus:border-transport-orange"
                  />
                </div>
                <Button type="submit" className="w-full transport-gradient hover:opacity-90" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login with Mobile"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {role === "user" && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full border-transport-orange/30 hover:bg-transport-orange hover:text-white"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {role !== "admin" && (
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-transport-orange hover:underline">
                Register
              </Link>
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
