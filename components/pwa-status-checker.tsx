"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"

export function PWAStatusChecker() {
  const [isOnline, setIsOnline] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Check if app is running as PWA
    const isPWA = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true

    if (isPWA) {
      // PWA-specific functionality
      console.log("Running as PWA")
    }

    // Handle online/offline status
    const handleOnline = () => {
      setIsOnline(true)
      if (isPWA) {
        toast({
          title: "Back Online",
          description: "Your connection has been restored.",
        })
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      if (isPWA) {
        toast({
          title: "Offline Mode",
          description: "You're now offline. Some features may be limited.",
          variant: "destructive",
        })
      }
    }

    // Handle app updates
    const handleAppUpdate = () => {
      if (isPWA) {
        toast({
          title: "App Updated",
          description: "Aashul Transport has been updated to the latest version.",
        })
      }
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    window.addEventListener("appinstalled", handleAppUpdate)

    // Check initial online status
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("appinstalled", handleAppUpdate)
    }
  }, [toast])

  return null // This component doesn't render anything
}
