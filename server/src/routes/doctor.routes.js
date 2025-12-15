const express = require('express');
const router = express.Router();
const Appointment = require('../models/appointment.model');
const User = require('../models/user.model');
const { verifyToken } = require('../middleware/auth.middleware');

const Doctor = require('../models/doctor.model');

// Route to get all doctors (public route) - returns detailed doctor profiles
router.get('/', async (req, res) => {
  try {
    const { serviceId } = req.query;
    
    // Add cache headers for better performance (5 minutes cache)
    res.set('Cache-Control', 'public, max-age=300');
    
    // Build query
    let query = {};
    
    // Filter by service if serviceId is provided
    if (serviceId) {
      query.services = { $in: [serviceId] };
    }
    
    // Find all doctors with populated user data
    // Use lean() and select() for better performance
    const doctors = await Doctor.find(query)
      .select('doctorId userId name email phone specialty experience education services availability successRate patientsCount image bio consultationFee')
      .populate('userId', 'name email phone role')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      doctors,
      count: doctors.length,
      cached: true
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctors',
      error: error.message
    });
  }
});

// Route to get all appointments for a doctor
router.get('/appointments', verifyToken, async (req, res) => {
  try {
    console.log('Doctor appointments request - User:', req.user);
    
    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only doctors can access this route.'
      });
    }

    // Get the doctor's user ID from the JWT token (middleware sets req.user.id)
    const doctorUserId = req.user.id || req.user.userId;
    
    if (!doctorUserId) {
      console.error('No doctor user ID found in request');
      return res.status(400).json({
        success: false,
        message: 'Invalid user information'
      });
    }
    
    console.log('Fetching appointments for doctor userId:', doctorUserId);
    
    // Verify the user is a doctor
    const doctor = await User.findById(doctorUserId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Find appointments by doctorUserId (this ensures only this doctor's appointments are shown)
    // Use lean() and select() for better performance
    const appointments = await Appointment.find({ 
      doctorUserId: doctorUserId
    })
    .select('userId doctorId doctorUserId doctorName serviceId serviceName appointmentDate appointmentTime status paymentStatus amount notes')
    .populate('userId', 'name email phone')
    .sort({ appointmentDate: 1, appointmentTime: 1 })
    .lean();

    console.log(`Found ${appointments.length} appointments for doctor ${doctor.name}`);

    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
});

module.exports = router;

