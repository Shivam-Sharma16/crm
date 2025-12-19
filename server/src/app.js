// server/src/app.js
const express = require('express')
const cors = require('cors')
const connectDB = require('./db/db')

// Import Routes
const authRoutes = require('./routes/auth.routes')
const adminRoutes = require('./routes/admin.routes')
const appointmentRoutes = require('./routes/appointment.routes')
const doctorRoutes = require('./routes/doctor.routes') // Verify this import exists
const adminEntitiesRoutes = require('./routes/admin-entities.routes')
const publicRoutes = require('./routes/public.routes')
const uploadRoutes = require('./routes/upload.routes')

const app = express()

// Connect to database
connectDB()

// Middleware
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://crm-ebon-two.vercel.app"
    ],
    credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctor', doctorRoutes); // This mounts the routes at /api/doctor
app.use('/api/admin-entities', adminEntitiesRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/upload', uploadRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' })
})

module.exports = app