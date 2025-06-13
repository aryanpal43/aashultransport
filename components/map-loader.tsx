"use client"

import type React from "react"

import { useEffect, useState } from "react"

interface MapLoaderProps {
  onLoad: () => void
  children: React.ReactNode
}

export function MapLoader({ onLoad, children }: MapLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsLoaded(true)
        onLoad()
      } else {
        // Retry after a short delay
        setTimeout(checkGoogleMaps, 100)
      }
    }

    // Start checking for Google Maps
    checkGoogleMaps()

    // Set a timeout to show error if maps don't load
    const timeout = setTimeout(() => {
      if (!isLoaded) {
        setError("Failed to load Google Maps. Please refresh the page.")
      }
    }, 10000)

    return () => clearTimeout(timeout)
  }, [onLoad, isLoaded])

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-destructive">Map Loading Error</div>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-transport-orange mx-auto"></div>
          <p className="mt-4 text-lg font-medium">Loading map...</p>
          <p className="text-sm text-muted-foreground">Please wait while we initialize the map</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
