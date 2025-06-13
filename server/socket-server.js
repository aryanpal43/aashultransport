const express = require("express")
const http = require("http")
const https = require("https") // Add HTTPS module
const { Server } = require("socket.io")
const cors = require("cors")
const { MongoClient, ObjectId } = require("mongodb")

const app = express()
app.use(cors())
app.use(express.json()) // Parse JSON bodies

// MongoDB setup
const mongoUrl = process.env.MONGODB_URI || "mongodb+srv://princekanyal070:admin.garvish@garvish.af2qei4.mongodb.net/garvish?retryWrites=true&w=majority"
const dbName = process.env.MONGODB_DB || "garvish"
let db

// HTTPS endpoint configuration
const HTTPS_ENDPOINT = process.env.HTTPS_ENDPOINT || "https://api.aashultransport.com/api/gps"

// Function to forward data to HTTPS endpoint
function forwardToHttps(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data)
    const url = new URL(HTTPS_ENDPOINT)
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    const req = https.request(options, (res) => {
      let responseData = ''
      res.on('data', (chunk) => {
        responseData += chunk
      })
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data: responseData })
      })
    })

    req.on('error', (error) => {
      console.error('Error forwarding to HTTPS:', error)
      reject(error)
    })

    req.write(postData)
    req.end()
  })
}

MongoClient.connect(mongoUrl)
  .then(client => {
    db = client.db(dbName)
    console.log("Connected to MongoDB")
  })
  .catch(err => console.error("MongoDB connection error:", err))

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
})

// Store active connections
const activeConnections = new Map()

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id)

  // Handle subscription to vehicle updates
  socket.on("subscribe", ({ vehicleId }) => {
    console.log(`User ${socket.id} subscribed to vehicle ${vehicleId}`)

    // Add to active connections
    if (!activeConnections.has(vehicleId)) {
      activeConnections.set(vehicleId, new Set())
    }
    activeConnections.get(vehicleId).add(socket.id)

    // Join room for this vehicle
    socket.join(vehicleId)
  })

  // Handle unsubscription
  socket.on("unsubscribe", ({ vehicleId }) => {
    console.log(`User ${socket.id} unsubscribed from vehicle ${vehicleId}`)

    // Remove from active connections
    if (activeConnections.has(vehicleId)) {
      activeConnections.get(vehicleId).delete(socket.id)
      if (activeConnections.get(vehicleId).size === 0) {
        activeConnections.delete(vehicleId)
      }
    }

    // Leave room
    socket.leave(vehicleId)
  })

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)

    // Remove from all active connections
    for (const [vehicleId, connections] of activeConnections.entries()) {
      if (connections.has(socket.id)) {
        connections.delete(socket.id)
        if (connections.size === 0) {
          activeConnections.delete(vehicleId)
        }
      }
    }
  })
})

// Endpoint for ESP32 to send GPS data
app.post("/api/gps", async (req, res) => {
  const { vehicleId, latitude, longitude } = req.body
  if (!vehicleId || !latitude || !longitude) {
    return res.status(400).json({ error: "Missing data" })
  }
  if (!db) {
    console.error("Database not initialized yet")
    return res.status(500).json({ error: "Database not initialized" })
  }
  console.log("Received GPS:", vehicleId, latitude, longitude)

  // Update last location in the database
  try {
    await db.collection("vehicles").updateOne(
      { registrationNumber : vehicleId },
      {
        $set: {
          lastLocation: {
            latitude,
            longitude,
            timestamp: new Date(),
          },
        },
      }
    )
  } catch (err) {
    console.error("Failed to update last location in DB:", err)
  }

  // Forward to HTTPS endpoint
  try {
    const httpsResponse = await forwardToHttps({
      vehicleId,
      latitude,
      longitude,
      timestamp: new Date()
    })
    console.log("Forwarded to HTTPS, response:", httpsResponse.statusCode)
  } catch (err) {
    console.error("Failed to forward to HTTPS:", err)
    // Continue processing even if HTTPS forwarding fails
  }

  // Emit to all subscribers
  io.to(vehicleId).emit("locationUpdate", {
    vehicleId,
    latitude,
    longitude,
    timestamp: new Date(),
  })
  res.json({ status: "ok" })
})

const PORT = process.env.PORT || 3201
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`)
})