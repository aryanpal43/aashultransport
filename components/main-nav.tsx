"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import Image from "next/image"

export function MainNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isAdmin = session?.user?.role === "admin"

  const routes = [
    {
      href: isAdmin ? "/admin/dashboard" : "/dashboard",
      label: "Dashboard",
      active: pathname === (isAdmin ? "/admin/dashboard" : "/dashboard"),
    },
    {
      href: "/profile",
      label: "Profile",
      active: pathname === "/profile",
    },
  ]

  return (
    <div className="flex gap-6 md:gap-10">
      <Link href="/" className="flex items-center space-x-3">
        <div className="relative h-8 w-8">
          <Image src="/logo.png" alt="Aashul Transport" fill className="object-contain" />
        </div>
        <span className="hidden font-bold text-lg sm:inline-block bg-gradient-to-r from-transport-orange to-transport-orange-light bg-clip-text text-transparent">
          Aashul Transport
        </span>
      </Link>
      <nav className="flex gap-6">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center text-sm font-medium transition-colors hover:text-transport-orange",
              route.active ? "text-transport-orange" : "text-foreground/60",
            )}
          >
            {route.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
