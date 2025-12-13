const express = require('express');
const router = express.Router();
const Appointment = require('../models/appointment.model');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};

// Create new appointment
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { doctorId, doctorName, serviceId, serviceName, appointmentDate, appointmentTime, amount, notes } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!doctorId || !doctorName || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID, doctor name, date, and time are required'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create appointment
    const appointment = new Appointment({
      userId,
      doctorId,
      doctorName,
      serviceId: serviceId || '',
      serviceName: serviceName || '',
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      amount: amount || 0,
      notes: notes || '',
      status: 'pending',
      paymentStatus: 'pending'
    });

    await appointment.save();

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      appointment
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating appointment',
      error: error.message
    });
  }
});

// Get all appointments for logged-in user
router.get('/my-appointments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const appointments = await Appointment.find({ userId })
      .sort({ appointmentDate: -1, appointmentTime: -1 });

    res.status(200).json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
});

// Update appointment payment status
router.patch('/:appointmentId/payment', authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.userId;

    const appointment = await Appointment.findOne({ 
      _id: appointmentId, 
      userId 
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    appointment.paymentStatus = 'paid';
    appointment.status = 'confirmed';
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      appointment
    });
  } catch (error) {
    console.error('Payment update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment',
      error: error.message
    });
  }
});

module.exports = router;


