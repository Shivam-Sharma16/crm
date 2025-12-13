const express = require('express')
const cors = require('cors')
const connectDB = require('./db/db')
const authRoutes = require('./routes/auth.routes')
const appointmentRoutes = require('./routes/appointment.routes')

const app = express()

// Connect to database
connectDB()

// Middleware
// server/src/app.js

app.use(cors({
    origin: [
        "http://localhost:5173",                // Local Vite
        "https://crm-ebon-two.vercel.app"       // Production Vercel (NO trailing slash /)
    ],
    credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/appointments', appointmentRoutes)

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' })
})

module.exports = app