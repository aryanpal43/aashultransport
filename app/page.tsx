import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MapPin, Shield, Clock } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 border-b bg-white/0 dark:bg-transport-orange/50 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-transport-orange/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="relative h-8 w-8">
              <Image src="/logo.png" alt="Aashul Transport" fill className="object-contain" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-transport-orange to-transport-orange-light bg-clip-text text-transparent dark:bg-none dark:text-white">
              Aashul Transport
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/login">
              <Button
                variant="outline"
                className="border-transport-orange text-transport-orange hover:bg-transport-orange hover:text-white"
              >
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-black border-transport-orange text-transport-orange hover:bg-transport-orange hover:text-black">Register</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 transport-gradient-subtle">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-8">
              <div className="relative h-24 w-24 mx-auto mb-6">
                <Image src="/logo.png" alt="Aashul Transport" fill className="object-contain road-animation" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-transport-orange to-transport-orange-light bg-clip-text text-transparent">
                Track and Rent Vehicles
              </span>
              <br />
              <span className="text-foreground">in Real-Time</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              Aashul Transport provides advanced vehicle tracking and rental services using cutting-edge GPS technology.
              Experience seamless fleet management and real-time monitoring.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/login?role=user">
                <Button size="lg" className="w-full sm:w-auto transport-gradient hover:opacity-90">
                  Login as User
                </Button>
              </Link>
              <Link href="/login?role=admin">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-transport-orange text-transport-orange hover:bg-transport-orange hover:text-white"
                >
                  Login as Admin
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">
              <span className="bg-gradient-to-r from-transport-orange to-transport-orange-light bg-clip-text text-transparent">
                Core Features
              </span>
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card rounded-lg p-6 shadow-sm border border-transport-orange/20 hover:border-transport-orange/40 transition-colors">
                <div className="transport-gradient p-3 rounded-full w-fit mb-4">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Real-Time GPS Tracking</h3>
                <p className="text-muted-foreground">
                  Track your rented vehicles in real-time with our advanced GPS technology. Know exactly where your
                  vehicle is at all times with precise location updates.
                </p>
              </div>
              <div className="bg-card rounded-lg p-6 shadow-sm border border-transport-orange/20 hover:border-transport-orange/40 transition-colors">
                <div className="transport-gradient p-3 rounded-full w-fit mb-4">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Flexible Rentals</h3>
                <p className="text-muted-foreground">
                  Rent vehicles for as long as you need. Our flexible rental system allows you to choose the perfect
                  vehicle for your transportation requirements.
                </p>
              </div>
              <div className="bg-card rounded-lg p-6 shadow-sm border border-transport-orange/20 hover:border-transport-orange/40 transition-colors">
                <div className="transport-gradient p-3 rounded-full w-fit mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Secure Authentication</h3>
                <p className="text-muted-foreground">
                  Our platform offers secure authentication options including Google OAuth and traditional
                  email/password login with advanced security features.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 transport-gradient-subtle">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">
              <span className="bg-gradient-to-r from-transport-orange to-transport-orange-light bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="transport-gradient text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  1
                </div>
                <h3 className="text-xl font-bold mb-2">Register an Account</h3>
                <p className="text-muted-foreground">
                  Create an account using your email, mobile number, or Google account for quick access.
                </p>
              </div>
              <div className="text-center">
                <div className="transport-gradient text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  2
                </div>
                <h3 className="text-xl font-bold mb-2">Get a Vehicle Assigned</h3>
                <p className="text-muted-foreground">
                  Our admin team will assign a suitable vehicle to your account based on your transportation needs.
                </p>
              </div>
              <div className="text-center">
                <div className="transport-gradient text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  3
                </div>
                <h3 className="text-xl font-bold mb-2">Track in Real-Time</h3>
                <p className="text-muted-foreground">
                  Use our application to track your assigned vehicle in real-time on an interactive map interface.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-card border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="relative h-6 w-6">
              <Image src="/logo.png" alt="Aashul Transport" fill className="object-contain" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-transport-orange to-transport-orange-light bg-clip-text text-transparent">
              Aashul Transport
            </span>
          </div>
          <p className="text-muted-foreground">© {new Date().getFullYear()} Aashul Transport. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
