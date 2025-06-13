"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input" // Added Input import
import { useToast } from "@/components/ui/use-toast"
import { Car, MapPin, Loader2, Search } from "lucide-react" // Added Search icon
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { VehicleMap } from "@/components/vehicle-map"
import { EmptyPlaceholder } from "@/components/empty-placeholder"

interface Vehicle {
  _id: string
  name: string
  type: string
  model: string
  registrationNumber: string
  status: "available" | "assigned" | "maintenance"
  assignedTo?: string
  lastLocation?: {
    latitude: number
    longitude: number
    timestamp: string
  }
}

export default function UserDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]) // New state for filtered vehicles
  const [searchQuery, setSearchQuery] = useState("") // New state for search query
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [trackingVehicleId, setTrackingVehicleId] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }

    if (status === "authenticated") {
      fetchAssignedVehicles()
    }
  }, [status, router])

  // Filter vehicles when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredVehicles(vehicles)
    } else {
      const filtered = vehicles.filter((vehicle) =>
        vehicle.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredVehicles(filtered)
    }
  }, [searchQuery, vehicles])

  const fetchAssignedVehicles = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/user/vehicles")
      const data = await response.json()

      if (response.ok) {
        setVehicles(data.vehicles)
        setFilteredVehicles(data.vehicles) // Initialize filtered vehicles with all vehicles
      } else {
        throw new Error(data.message || "Failed to fetch vehicles")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load assigned vehicles",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTrackVehicle = async (vehicle: Vehicle) => {
    setTrackingVehicleId(vehicle._id)

    try {
      // Pre-load Google Maps API if not already loaded
      if (!window.google) {
        toast({
          title: "Loading map",
          description: "Please wait while we load the map...",
        })

        // Wait a moment for Google Maps to load
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      setSelectedVehicle(vehicle)
      setShowMap(true)
    } catch (error) {
      console.error("Error opening map:", error)
      toast({
        title: "Map loading error",
        description: "Failed to load map. Please try again.",
        variant: "destructive",
      })
    } finally {
      setTrackingVehicleId(null)
    }
  }

  const closeMap = () => {
    setShowMap(false)
    setSelectedVehicle(null)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const getVehicleIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "car":
        return <Car className="h-6 w-6" />
      case "bike":
        return <Car className="h-6 w-6" />
      case "van":
        return <Car className="h-6 w-6" />
      default:
        return <Car className="h-6 w-6" />
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <DashboardShell>
        <DashboardHeader heading="Dashboard" text="View and track your assigned vehicles" />
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Dashboard" text="View and track your assigned vehicles" />

      {vehicles.length === 0 ? (
        <EmptyPlaceholder>
          <EmptyPlaceholder.Icon>
            <Car />
          </EmptyPlaceholder.Icon>
          <EmptyPlaceholder.Title>No vehicles assigned</EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>You don't have any vehicles assigned to you yet.</EmptyPlaceholder.Description>
        </EmptyPlaceholder>
      ) : (
        <>
          {/* Search input */}
          <div className="max-w-md mx-auto mb-6">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by registration number..."
                className="pl-8"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {filteredVehicles.length === 0 ? (
            <EmptyPlaceholder>
              <EmptyPlaceholder.Icon>
                <Search />
              </EmptyPlaceholder.Icon>
              <EmptyPlaceholder.Title>No matching vehicles</EmptyPlaceholder.Title>
              <EmptyPlaceholder.Description>
                No vehicles found matching "{searchQuery}". Try a different search term.
              </EmptyPlaceholder.Description>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            </EmptyPlaceholder>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
              {filteredVehicles.map((vehicle) => (
                <Card key={vehicle._id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">{vehicle.name}</CardTitle>
                        <CardDescription>{vehicle.model}</CardDescription>
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        {getVehicleIcon(vehicle.type)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Registration</span>
                        <span className="font-medium">{vehicle.registrationNumber}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Type</span>
                        <span className="font-medium capitalize">{vehicle.type}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant={vehicle.status === "assigned" ? "default" : "outline"}>{vehicle.status}</Badge>
                      </div>
                      {vehicle.lastLocation && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Last Updated</span>
                          <span className="font-medium">
                            {new Date(vehicle.lastLocation.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => handleTrackVehicle(vehicle)}
                      disabled={trackingVehicleId === vehicle._id}
                    >
                      {trackingVehicleId === vehicle._id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading Map...
                        </>
                      ) : (
                        <>
                          <MapPin className="mr-2 h-4 w-4" />
                          Track Vehicle
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {showMap && selectedVehicle && <VehicleMap vehicle={selectedVehicle} onClose={closeMap} />}
    </DashboardShell>
  )
}
