"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Download, Smartphone } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check if running in standalone mode (PWA is installed)
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true)
        return true
      }

      // Check if user agent indicates installed PWA
      if (window.navigator.standalone === true) {
        setIsInstalled(true)
        return true
      }

      return false
    }

    // Check if user has previously dismissed the prompt
    const checkDismissed = () => {
      const dismissed = localStorage.getItem("pwa-install-dismissed")
      const dismissedDate = localStorage.getItem("pwa-install-dismissed-date")

      if (dismissed && dismissedDate) {
        const dismissedTime = new Date(dismissedDate).getTime()
        const currentTime = new Date().getTime()
        const daysSinceDismissed = (currentTime - dismissedTime) / (1000 * 60 * 60 * 24)

        // Show prompt again after 7 days
        return daysSinceDismissed < 7
      }

      return false
    }

    // Detect iOS
    const detectIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
      setIsIOS(isIOSDevice)
      return isIOSDevice
    }

    const installed = checkIfInstalled()
    const dismissed = checkDismissed()
    const iosDevice = detectIOS()

    if (!installed && !dismissed) {
      // For iOS devices, show custom prompt
      if (iosDevice) {
        setShowPrompt(true)
      }
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const beforeInstallEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(beforeInstallEvent)

      if (!installed && !dismissed) {
        setShowPrompt(true)
      }
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
      localStorage.removeItem("pwa-install-dismissed")
      localStorage.removeItem("pwa-install-dismissed-date")

      toast({
        title: "App Installed!",
        description: "Aashul Transport has been installed successfully.",
      })
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [toast])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android/Chrome installation
      try {
        await deferredPrompt.prompt()
        const choiceResult = await deferredPrompt.userChoice

        if (choiceResult.outcome === "accepted") {
          setIsInstalled(true)
          setShowPrompt(false)
          toast({
            title: "Installing...",
            description: "Aashul Transport is being installed on your device.",
          })
        } else {
          handleDismiss()
        }

        setDeferredPrompt(null)
      } catch (error) {
        console.error("Error during installation:", error)
        toast({
          title: "Installation Error",
          description: "Failed to install the app. Please try again.",
          variant: "destructive",
        })
      }
    } else if (isIOS) {
      // iOS installation instructions
      toast({
        title: "Install on iOS",
        description: "Tap the Share button and select 'Add to Home Screen'",
      })
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("pwa-install-dismissed", "true")
    localStorage.setItem("pwa-install-dismissed-date", new Date().toISOString())
  }

  const handleNotNow = () => {
    setShowPrompt(false)
    // Don't set dismissed flag, just hide for this session
  }

  if (isInstalled || !showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card className="border-transport-orange/20 bg-card/95 backdrop-blur-sm shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="transport-gradient p-2 rounded-lg">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Install Aashul Transport</CardTitle>
                <CardDescription className="text-sm">Get quick access to vehicle tracking</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {isIOS ? (
                <>
                  Tap <strong>Share</strong> → <strong>Add to Home Screen</strong> to install
                </>
              ) : (
                "Install our app for faster access and offline features"
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleInstallClick} className="flex-1 transport-gradient hover:opacity-90" size="sm">
                <Download className="h-4 w-4 mr-2" />
                {isIOS ? "Install Guide" : "Install"}
              </Button>
              <Button variant="outline" onClick={handleNotNow} className="border-transport-orange/30" size="sm">
                Not Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
