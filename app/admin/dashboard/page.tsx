"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Car, MapPin, Plus, Pencil, Trash2, Loader2, UserPlus, Search } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { VehicleMap } from "@/components/vehicle-map"
import { EmptyPlaceholder } from "@/components/empty-placeholder"
import { UserDropdown } from "@/components/user-dropdown"

interface Vehicle {
  _id: string
  name: string
  type: string
  model: string
  registrationNumber: string
  status: "available" | "assigned" | "maintenance"
  assignedTo?: {
    _id: string
    name: string
    email: string
    mobile: string
  }
  lastLocation?: {
    latitude: number
    longitude: number
    timestamp: string
  }
}

interface User {
  _id: string
  name: string
  email: string
  mobile: string
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [trackingVehicleId, setTrackingVehicleId] = useState<string | null>(null)

  // Vehicle form state
  const [showVehicleForm, setShowVehicleForm] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [vehicleFormData, setVehicleFormData] = useState({
    _id: "",
    name: "",
    type: "car",
    model: "",
    registrationNumber: "",
    status: "available",
  })

  // Assignment form state
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [assignFormData, setAssignFormData] = useState({
    vehicleId: "",
    selectedUserId: "",
  })
  const [isAssigning, setIsAssigning] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?role=admin")
    }

    if (status === "authenticated") {
      if (session?.user?.role !== "admin") {
        router.push("/dashboard")
        return
      }

      fetchVehicles()
      fetchUsers()
    }
  }, [status, session, router])

  // Filter vehicles when search query or active tab changes
  useEffect(() => {
    let filtered = vehicles

    // First filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter((vehicle) => vehicle.status === activeTab)
    }

    // Then filter by search query
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter((vehicle) =>
        vehicle.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredVehicles(filtered)
  }, [searchQuery, vehicles, activeTab])

  const fetchVehicles = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/vehicles")
      const data = await response.json()

      if (response.ok) {
        setVehicles(data.vehicles)
        setFilteredVehicles(data.vehicles)
      } else {
        throw new Error(data.message || "Failed to fetch vehicles")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load vehicles",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      const data = await response.json()

      if (response.ok) {
        setUsers(data.users)
      } else {
        throw new Error(data.message || "Failed to fetch users")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load users",
        variant: "destructive",
      })
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

  const handleAddVehicle = () => {
    setIsEditMode(false)
    setVehicleFormData({
      _id: "",
      name: "",
      type: "car",
      model: "",
      registrationNumber: "",
      status: "available",
    })
    setShowVehicleForm(true)
  }

  const handleEditVehicle = (vehicle: Vehicle) => {
    setIsEditMode(true)
    setVehicleFormData({
      _id: vehicle._id,
      name: vehicle.name,
      type: vehicle.type,
      model: vehicle.model,
      registrationNumber: vehicle.registrationNumber,
      status: vehicle.status,
    })
    setShowVehicleForm(true)
  }

const handleRegistrationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setVehicleFormData({
    ...vehicleFormData,
    registrationNumber: e.target.value.toUpperCase(),
  })
}

  const handleVehicleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVehicleFormData({
      ...vehicleFormData,
      [e.target.name]: e.target.value,
    })
  }

  const handleVehicleTypeChange = (value: string) => {
    setVehicleFormData({
      ...vehicleFormData,
      type: value,
    })
  }

  const handleVehicleStatusChange = (value: string) => {
    setVehicleFormData({
      ...vehicleFormData,
      status: value,
    })
  }

  const handleVehicleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = isEditMode ? `/api/admin/vehicles/${vehicleFormData._id}` : "/api/admin/vehicles"
      const method = isEditMode ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(vehicleFormData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to save vehicle")
      }

      toast({
        title: isEditMode ? "Vehicle Updated" : "Vehicle Added",
        description: isEditMode
          ? "The vehicle has been updated successfully."
          : "A new vehicle has been added successfully.",
      })

      setShowVehicleForm(false)
      fetchVehicles()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/vehicles/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete vehicle")
      }

      toast({
        title: "Vehicle Deleted",
        description: "The vehicle has been deleted successfully.",
      })

      fetchVehicles()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const handleAssignVehicle = (vehicleId: string) => {
    setAssignFormData({
      vehicleId,
      selectedUserId: "",
    })
    setShowAssignForm(true)
  }

  const handleAssignFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!assignFormData.selectedUserId) {
      toast({
        title: "Error",
        description: "Please select a user to assign the vehicle to.",
        variant: "destructive",
      })
      return
    }

    setIsAssigning(true)

    try {
      const selectedUser = users.find((user) => user._id === assignFormData.selectedUserId)

      const response = await fetch("/api/admin/assign-vehicle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicleId: assignFormData.vehicleId,
          userMobile: selectedUser?.mobile,
          userEmail: selectedUser?.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to assign vehicle")
      }

      toast({
        title: "Vehicle Assigned",
        description: `Vehicle assigned to ${selectedUser?.name} successfully.`,
      })

      setShowAssignForm(false)
      setAssignFormData({ vehicleId: "", selectedUserId: "" })
      fetchVehicles()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  const handleWorkDone = async (vehicleId: string) => {
    try {
      const response = await fetch("/api/admin/unassign-vehicle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vehicleId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to mark work as done")
      }

      toast({
        title: "Work Done",
        description: "The vehicle has been unassigned successfully.",
      })

      fetchVehicles()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
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
        <DashboardHeader heading="Admin Dashboard" text="Manage your vehicles and users" />
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Admin Dashboard"
        text="Manage your vehicles and users"
      >
        <Button onClick={handleAddVehicle}>
          <Plus className="mr-2 h-4 w-4" />
          Add Vehicle
        </Button>
      </DashboardHeader>

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

      <Tabs
        defaultValue="all"
        className="space-y-4"
        onValueChange={handleTabChange}
      >
        <TabsList>
          <TabsTrigger value="all">All Vehicles</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="assigned">Assigned</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {vehicles.length === 0 ? (
            <EmptyPlaceholder>
              <EmptyPlaceholder.Icon>
                <Car />
              </EmptyPlaceholder.Icon>
              <EmptyPlaceholder.Title>No vehicles found</EmptyPlaceholder.Title>
              <EmptyPlaceholder.Description>
                You don't have any vehicles yet. Add one to get started.
              </EmptyPlaceholder.Description>
              <Button onClick={handleAddVehicle}>
                <Plus className="mr-2 h-4 w-4" />
                Add Vehicle
              </Button>
            </EmptyPlaceholder>
          ) : filteredVehicles.length === 0 ? (
            <EmptyPlaceholder>
              <EmptyPlaceholder.Icon>
                <Search />
              </EmptyPlaceholder.Icon>
              <EmptyPlaceholder.Title>
                No matching vehicles
              </EmptyPlaceholder.Title>
              <EmptyPlaceholder.Description>
                No vehicles found matching "{searchQuery}". Try a different
                search term.
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
                        <CardTitle className="text-xl">
                          {vehicle.name}
                        </CardTitle>
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
                        <span className="text-muted-foreground">
                          Registration
                        </span>
                        <span className="font-medium">
                          {vehicle.registrationNumber}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Type</span>
                        <span className="font-medium capitalize">
                          {vehicle.type}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <Badge
                          variant={
                            vehicle.status === "available"
                              ? "outline"
                              : vehicle.status === "assigned"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {vehicle.status}
                        </Badge>
                      </div>
                      {vehicle.assignedTo && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Assigned To
                          </span>
                          <span className="font-medium">
                            {vehicle.assignedTo.name}
                          </span>
                        </div>
                      )}
                      {vehicle.lastLocation && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Last Updated
                          </span>
                          <span className="font-medium">
                            {new Date(
                              vehicle.lastLocation.timestamp
                            ).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    <div className="flex w-full gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleTrackVehicle(vehicle)}
                        disabled={trackingVehicleId === vehicle._id}
                      >
                        {trackingVehicleId === vehicle._id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <MapPin className="mr-2 h-4 w-4" />
                        )}
                        Track
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditVehicle(vehicle)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDeleteVehicle(vehicle._id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>

                    {vehicle.status === "available" ? (
                      <Button
                        className="w-full"
                        onClick={() => handleAssignVehicle(vehicle._id)}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Assign to User
                      </Button>
                    ) : vehicle.status === "assigned" ? (
                      <Button
                        className="w-full"
                        variant="secondary"
                        onClick={() => handleWorkDone(vehicle._id)}
                      >
                        Work Done
                      </Button>
                    ) : null}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Other tab contents would be similar - keeping them for completeness */}
        <TabsContent value="available" className="space-y-4">
          {/* Similar content structure for available vehicles */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
            {filteredVehicles.map((vehicle) => (
              <Card key={vehicle._id}>
                {/* Same card structure as above */}
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
                      <span className="text-muted-foreground">
                        Registration
                      </span>
                      <span className="font-medium">
                        {vehicle.registrationNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium capitalize">
                        {vehicle.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="outline">{vehicle.status}</Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <div className="flex w-full gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleTrackVehicle(vehicle)}
                      disabled={trackingVehicleId === vehicle._id}
                    >
                      {trackingVehicleId === vehicle._id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <MapPin className="mr-2 h-4 w-4" />
                      )}
                      Track
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditVehicle(vehicle)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDeleteVehicle(vehicle._id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleAssignVehicle(vehicle._id)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign to User
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assigned" className="space-y-4">
          {/* Similar content for assigned vehicles */}
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
                      <span className="text-muted-foreground">
                        Registration
                      </span>
                      <span className="font-medium">
                        {vehicle.registrationNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium capitalize">
                        {vehicle.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="default">{vehicle.status}</Badge>
                    </div>
                    {vehicle.assignedTo && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Assigned To
                        </span>
                        <span className="font-medium">
                          {vehicle.assignedTo.name}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <div className="flex w-full gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleTrackVehicle(vehicle)}
                      disabled={trackingVehicleId === vehicle._id}
                    >
                      {trackingVehicleId === vehicle._id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <MapPin className="mr-2 h-4 w-4" />
                      )}
                      Track
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditVehicle(vehicle)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDeleteVehicle(vehicle._id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={() => handleWorkDone(vehicle._id)}
                  >
                    Work Done
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          {/* Similar content for maintenance vehicles */}
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
                      <span className="text-muted-foreground">
                        Registration
                      </span>
                      <span className="font-medium">
                        {vehicle.registrationNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium capitalize">
                        {vehicle.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="secondary">{vehicle.status}</Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <div className="flex w-full gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleTrackVehicle(vehicle)}
                      disabled={trackingVehicleId === vehicle._id}
                    >
                      {trackingVehicleId === vehicle._id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <MapPin className="mr-2 h-4 w-4" />
                      )}
                      Track
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditVehicle(vehicle)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDeleteVehicle(vehicle._id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Vehicle Form Dialog */}
      <Dialog open={showVehicleForm} onOpenChange={setShowVehicleForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Vehicle" : "Add New Vehicle"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update the vehicle details below."
                : "Fill in the details to add a new vehicle."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVehicleFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={vehicleFormData.name}
                  onChange={handleVehicleFormChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Select
                  value={vehicleFormData.type}
                  onValueChange={handleVehicleTypeChange}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="bike">Bike</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="model" className="text-right">
                  Model
                </Label>
                <Input
                  id="model"
                  name="model"
                  value={vehicleFormData.model}
                  onChange={handleVehicleFormChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="registrationNumber" className="text-right">
                  Registration
                </Label>
                <Input
                  id="registrationNumber"
                  name="registrationNumber"
                  value={vehicleFormData.registrationNumber}
                  onChange={handleRegistrationChange}
                  className="col-span-3 uppercase"
                  required
                  maxLength={10}
                  pattern="[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}"
                  title="Format Example: UK07DQ4444"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={vehicleFormData.status}
                  onValueChange={handleVehicleStatusChange}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Vehicle Dialog with New Dropdown */}
      <Dialog open={showAssignForm} onOpenChange={setShowAssignForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Vehicle to User</DialogTitle>
            <DialogDescription>
              Search and select a user to assign the vehicle to.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Select User</Label>
                <div className="col-span-3">
                  <UserDropdown
                    users={users}
                    selectedUserId={assignFormData.selectedUserId}
                    onUserSelect={(userId) =>
                      setAssignFormData({
                        ...assignFormData,
                        selectedUserId: userId,
                      })
                    }
                    placeholder="Search by name, email, or mobile..."
                    disabled={isAssigning}
                  />
                </div>
              </div>
              {assignFormData.selectedUserId && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">Selected User</Label>
                  <div className="col-span-3">
                    {(() => {
                      const user = users.find(
                        (user) => user._id === assignFormData.selectedUserId
                      );
                      return user ? (
                        <div className="p-3 bg-muted rounded-md">
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.mobile}
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={isAssigning || !assignFormData.selectedUserId}
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Assign Vehicle"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {showMap && selectedVehicle && (
        <VehicleMap vehicle={selectedVehicle} onClose={closeMap} />
      )}
    </DashboardShell>
  );
}
