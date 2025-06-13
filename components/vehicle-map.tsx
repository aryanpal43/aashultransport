"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Navigation, LocateFixed, Loader2, MapPin, Clock } from "lucide-react"
import { io, type Socket } from "socket.io-client"
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, DirectionsRenderer } from "@react-google-maps/api"
import { useToast } from "@/components/ui/use-toast"

interface Vehicle {
  _id: string
  name: string
  type: string
  model: string
  registrationNumber: string
  status: string
  lastLocation?: {
    latitude: number
    longitude: number
    timestamp: string
  }
}

interface VehicleMapProps {
  vehicle: Vehicle
  onClose: () => void
}

// Map container style
const containerStyle = {
  width: "100%",
  height: "100%",
}

// Google Maps libraries to load
const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places", "geometry"]

export function VehicleMap({ vehicle, onClose }: VehicleMapProps) {
  const { toast } = useToast()
  const [vehiclePosition, setVehiclePosition] = useState<google.maps.LatLngLiteral | null>(
    vehicle.lastLocation ? { lat: vehicle.lastLocation.latitude, lng: vehicle.lastLocation.longitude } : null,
  )
  const [userPosition, setUserPosition] = useState<google.maps.LatLngLiteral | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>(
    vehicle.lastLocation ? new Date(vehicle.lastLocation.timestamp).toLocaleTimeString() : "-",
  )
  const [showVehicleInfo, setShowVehicleInfo] = useState(false)
  const [showUserInfo, setShowUserInfo] = useState(false)
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)
  const [isLoadingDirections, setIsLoadingDirections] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [distance, setDistance] = useState<string | null>(null)
  const [duration, setDuration] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>(
    vehicle.lastLocation
      ? { lat: vehicle.lastLocation.latitude, lng: vehicle.lastLocation.longitude }
      : { lat: 28.6139, lng: 77.209 }, // Default to Delhi
  )

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  })

  const socketRef = useRef<Socket | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const watchPositionId = useRef<number | null>(null)


  // Calculate route between user and vehicle
  const calculateRoute = useCallback(
    async (userPos: google.maps.LatLngLiteral, vehiclePos: google.maps.LatLngLiteral) => {
      if (!isLoaded || !window.google) {
        console.log("Google Maps not loaded yet")
        return
      }

      setIsLoadingDirections(true)
      console.log("Calculating route from:", userPos, "to:", vehiclePos)

      try {
        const directionsService = new google.maps.DirectionsService()

        const request: google.maps.DirectionsRequest = {
          origin: userPos,
          destination: vehiclePos,
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false,
        }

        const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          directionsService.route(request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              resolve(result)
            } else {
              reject(new Error(`Directions request failed: ${status}`))
            }
          })
        })

        console.log("Directions result:", result)
        setDirections(result)

        // Extract distance and duration from the first route
        if (result.routes && result.routes[0] && result.routes[0].legs && result.routes[0].legs[0]) {
          const leg = result.routes[0].legs[0]
          const distanceText = leg.distance?.text || "Unknown"
          const durationText = leg.duration?.text || "Unknown"

          setDistance(distanceText)
          setDuration(durationText)

          console.log("Route calculated:", { distance: distanceText, duration: durationText })

          toast({
            title: "Route Calculated",
            description: `Distance: ${distanceText}, Est. Time: ${durationText}`,
          })

          // Adjust map bounds to show both markers and route
          if (mapRef.current && result.routes[0].bounds) {
            mapRef.current.fitBounds(result.routes[0].bounds)
          }
        }
      } catch (error) {
        console.error("Direction service failed:", error)
        setDirections(null)
        setDistance(null)
        setDuration(null)

        toast({
          title: "Route Calculation Failed",
          description: "Could not calculate route. Please check your internet connection and try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingDirections(false)
      }
    },
    [isLoaded, toast],
  )

  // Add a new function to fetch the latest vehicle location from the database
  // Add this after the openInGoogleMaps function and before the loadError check

  const fetchLatestVehicleLocation = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/vehicles/${vehicle._id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch vehicle data")
      }

      const data = await response.json()
      if (data.vehicle && data.vehicle.lastLocation) {
        const newVehiclePosition = {
          lat: data.vehicle.lastLocation.latitude,
          lng: data.vehicle.lastLocation.longitude,
        }

        // Only update if position has changed
        if (
          !vehiclePosition ||
          newVehiclePosition.lat !== vehiclePosition.lat ||
          newVehiclePosition.lng !== vehiclePosition.lng
        ) {
          setVehiclePosition(newVehiclePosition)
          setLastUpdated(new Date().toLocaleTimeString())

          // Recalculate route if user position is available
          if (userPosition) {
            calculateRoute(userPosition, newVehiclePosition)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching latest vehicle location:", error)
    }
  }, [vehicle._id, vehiclePosition, userPosition, calculateRoute])

  // Connect to Socket.IO for real-time vehicle updates
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SOCKET_URL) {
      console.warn("Socket URL not configured")
      return
    }

    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL)

    // Subscribe to vehicle location updates
    socketRef.current.emit("subscribe", {
      vehicleId: vehicle.registrationNumber,
    })

    socketRef.current.on("locationUpdate", (data) => {
      console.log("Location update received:", data)
      if (data.vehicleId === vehicle.registrationNumber) {
        const newVehiclePosition = { lat: data.latitude, lng: data.longitude }
        setVehiclePosition(newVehiclePosition)

        // Update the timestamp with the current time
        const currentTime = new Date().toLocaleTimeString()
        setLastUpdated(currentTime)

        // Recalculate route if user position is available
        if (userPosition) {
          calculateRoute(userPosition, newVehiclePosition)
        }
      }
    })

    socketRef.current.on("connect", () => {
      console.log("Socket connected")
    })

    socketRef.current.on("disconnect", () => {
      console.log("Socket disconnected")
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("unsubscribe", {
          vehicleId: vehicle.registrationNumber,
        })
        socketRef.current.disconnect()
      }

      // Clear the watch position when component unmounts
      if (watchPositionId.current !== null) {
        navigator.geolocation.clearWatch(watchPositionId.current)
        watchPositionId.current = null
      }
    }
  }, [vehicle.registrationNumber, userPosition, calculateRoute])

  // Get user's current location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser does not support geolocation.",
        variant: "destructive",
      })
      return
    }

    setIsGettingLocation(true)

    // Clear any existing watch
    if (watchPositionId.current !== null) {
      navigator.geolocation.clearWatch(watchPositionId.current)
      watchPositionId.current = null
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0, // Always get fresh position
    }

    // Start watching position instead of getting it once
    watchPositionId.current = navigator.geolocation.watchPosition(
      (position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }

        console.log("User location updated:", userPos)
        setUserPosition(userPos)
        setIsGettingLocation(false)

        // Calculate route if vehicle position is available
        if (vehiclePosition) {
          calculateRoute(userPos, vehiclePosition)
        }

        // Center map to show both user and vehicle
        if (mapRef.current && vehiclePosition) {
          const bounds = new google.maps.LatLngBounds()
          bounds.extend(userPos)
          bounds.extend(vehiclePosition)
          mapRef.current.fitBounds(bounds)
        }

        // Only show toast on first location acquisition
        if (!userPosition) {
          toast({
            title: "Location Found",
            description: "Your location is now being tracked in real-time.",
          })
        }
      },
      (error) => {
        console.error("Geolocation error:", error)
        setIsGettingLocation(false)
        let errorMessage = "Failed to get your location."

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable."
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again."
            break
        }

        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive",
        })
      },
      options,
    )
  }, [vehiclePosition, toast, calculateRoute, userPosition])

  // Auto-get user location when map loads
  useEffect(() => {
    if (isLoaded && vehiclePosition && !userPosition) {
      // Auto-request location after a short delay
      const timer = setTimeout(() => {
        getUserLocation()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isLoaded, vehiclePosition, userPosition, getUserLocation])

  // Add a new useEffect for periodic refreshing
  // Add this after the useEffect for auto-getting user location

  // Set up periodic refresh of vehicle location
  useEffect(() => {
    if (isLoaded) {
      // Initial fetch
      fetchLatestVehicleLocation()

      // Set up interval for periodic refresh (every 3 seconds)
      const intervalId = setInterval(() => {
        fetchLatestVehicleLocation()
      }, 1000)

      // Clean up interval on unmount
      return () => clearInterval(intervalId)
    }
  }, [isLoaded, fetchLatestVehicleLocation])

  // Map event handlers
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
    console.log("Map loaded")
  }, [])

  const onMapClick = useCallback(() => {
    setShowVehicleInfo(false)
    setShowUserInfo(false)
  }, [])

  const onVehicleMarkerClick = useCallback(() => {
    setShowVehicleInfo(true)
    setShowUserInfo(false)
  }, [])

  const onUserMarkerClick = useCallback(() => {
    setShowUserInfo(true)
    setShowVehicleInfo(false)
  }, [])

  // Clear route
  const clearRoute = useCallback(() => {
    setDirections(null)
    setDistance(null)
    setDuration(null)
    toast({
      title: "Route Cleared",
      description: "The route has been removed from the map.",
    })
  }, [toast])

  // Open in Google Maps
  const openInGoogleMaps = useCallback(() => {
    if (vehiclePosition) {
      const url = userPosition
        ? `https://www.google.com/maps/dir/${userPosition.lat},${userPosition.lng}/${vehiclePosition.lat},${vehiclePosition.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${vehiclePosition.lat},${vehiclePosition.lng}`

      window.open(url, "_blank")
    }
  }, [userPosition, vehiclePosition])

  if (loadError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="w-full max-w-4xl h-[80vh] flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold text-destructive">Error Loading Map</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-lg text-destructive">Failed to load Google Maps</p>
              <p className="text-muted-foreground mt-2">Please check your internet connection and API key.</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-6xl h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xl font-bold">Tracking {vehicle.name}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {vehicle.registrationNumber}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Last updated:</span>
              <Badge variant="secondary">{lastUpdated}</Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 relative">
          {!isLoaded ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Loader2 className="animate-spin h-12 w-12 text-transport-orange mx-auto mb-4" />
                <p className="text-lg font-medium">Loading map...</p>
                <p className="text-sm text-muted-foreground">Please wait while we initialize Google Maps</p>
              </div>
            </div>
          ) : vehiclePosition ? (
            <>
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={mapCenter}
                zoom={13}
                onLoad={onMapLoad}
                onClick={onMapClick}
                options={{
                  fullscreenControl: false,
                  mapTypeControl: true,
                  streetViewControl: true,
                  zoomControl: true,
                  mapTypeControlOptions: {
                    position: google.maps.ControlPosition.TOP_RIGHT,
                  },
                }}
              >
                {/* Vehicle marker */}
                <Marker
                  position={vehiclePosition}
                  onClick={onVehicleMarkerClick}
                  icon={{
                    url: "/vehicle-marker.png",
                    scaledSize: new google.maps.Size(40, 40),
                    anchor: new google.maps.Point(20, 40),
                  }}
                  title={`${vehicle.name} - ${vehicle.registrationNumber}`}
                >
                  {showVehicleInfo && (
                    <InfoWindow onCloseClick={() => setShowVehicleInfo(false)}>
                      <div className="p-2 min-w-[200px]">
                        <h3 className="font-bold text-lg">{vehicle.name}</h3>
                        <p className="text-sm text-gray-600">{vehicle.model}</p>
                        <p className="text-sm font-medium">{vehicle.registrationNumber}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Status: <span className="capitalize">{vehicle.status}</span>
                        </p>
                        <p className="text-xs text-gray-500">Last update: {lastUpdated}</p>
                      </div>
                    </InfoWindow>
                  )}
                </Marker>

                {/* User location marker */}
                {userPosition && (
                  <Marker
                    position={userPosition}
                    onClick={onUserMarkerClick}
                    icon={{
                      url: "/user-marker.png",
                      scaledSize: new google.maps.Size(30, 30),
                      anchor: new google.maps.Point(15, 30),
                    }}
                    title="Your Location"
                  >
                    {showUserInfo && (
                      <InfoWindow onCloseClick={() => setShowUserInfo(false)}>
                        <div className="p-2">
                          <h3 className="font-bold">Your Location</h3>
                          <p className="text-sm text-gray-600">Current position</p>
                        </div>
                      </InfoWindow>
                    )}
                  </Marker>
                )}

                {/* Directions renderer */}
                {directions && (
                  <DirectionsRenderer
                    directions={directions}
                    options={{
                      suppressMarkers: true, // We use custom markers
                      polylineOptions: {
                        strokeColor: "#FF8C00",
                        strokeWeight: 4,
                        strokeOpacity: 0.8,
                      },
                    }}
                  />
                )}
              </GoogleMap>

              {/* Control buttons overlay */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className={`shadow-md bg-black/90 backdrop-blur-sm ${userPosition ? "text-green-600" : ""}`}
                  onClick={getUserLocation}
                >
                  {isGettingLocation ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : userPosition ? (
                    <LocateFixed className="h-4 w-4 mr-2 text-green-600" />
                  ) : (
                    <LocateFixed className="h-4 w-4 mr-2" />
                  )}
                  {isGettingLocation
                    ? "Getting Location..."
                    : userPosition
                      ? "Location Tracking Active"
                      : "Enable Location Tracking"}
                </Button>

                {directions && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shadow-md bg-white/90 backdrop-blur-sm text-transport-orange"
                    onClick={clearRoute}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Route
                  </Button>
                )}
              </div>

              {/* Route information panel */}
              {(distance || duration || isLoadingDirections) && (
                <div className="absolute bottom-4 left-4 right-4">
                  <Card className="bg-card/95 backdrop-blur-sm shadow-lg border-transport-orange/20">
                    <CardContent className="p-4">
                      {isLoadingDirections ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin text-transport-orange" />
                          <span className="text-sm font-medium">Calculating route...</span>
                        </div>
                      ) : distance && duration ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-transport-orange" />
                              <div className="text-center">
                                <p className="text-xs font-medium text-muted-foreground">Distance</p>
                                <p className="text-lg font-bold text-transport-orange">{distance}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-transport-orange" />
                              <div className="text-center">
                                <p className="text-xs font-medium text-muted-foreground">Est. Time</p>
                                <p className="text-lg font-bold text-transport-orange">{duration}</p>
                              </div>
                            </div>
                          </div>
                          <Button size="sm" className="transport-gradient hover:opacity-90" onClick={openInGoogleMaps}>
                            <Navigation className="h-4 w-4 mr-2" />
                            Navigate
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center text-sm text-muted-foreground">
                          {userPosition
                            ? "Waiting for route calculation..."
                            : "Allow location access for real-time tracking"}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Location Data</h3>
                <p className="text-sm text-muted-foreground mt-2">This vehicle doesn't have any location data yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Location updates will appear here when available.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
