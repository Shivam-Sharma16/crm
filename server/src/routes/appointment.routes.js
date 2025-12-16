const express = require('express');
const router = express.Router();
const Appointment = require('../models/appointment.model');
const User = require('../models/user.model');
const Doctor = require('../models/doctor.model');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
    req.user = user;
    next();
  });
};

router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { doctorId, doctorName, serviceId, serviceName, appointmentDate, appointmentTime, amount, notes } = req.body;
    const userId = req.user.userId;

    if (!doctorId || !doctorName || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // 1. Find Doctor & Verify Availability
    let doctorDoc = await Doctor.findOne({ 
        $or: [{ _id: doctorId }, { doctorId: doctorId }] 
    });
    
    if (!doctorDoc) {
      // Fallback: try finding by name if ID failed (legacy support)
      const doctorUser = await User.findOne({ name: doctorName, role: 'doctor' });
      if (doctorUser) {
        doctorDoc = await Doctor.findOne({ userId: doctorUser._id });
      }
    }

    if (!doctorDoc) {
      return res.status(400).json({ success: false, message: 'Doctor not found.' });
    }

    // --- AVAILABILITY CHECK ---
    const dateObj = new Date(appointmentDate);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[dateObj.getDay()];
    
    const daySchedule = doctorDoc.availability ? doctorDoc.availability[dayName] : null;

    if (daySchedule) {
      if (!daySchedule.available) {
        return res.status(400).json({ success: false, message: `Doctor is not available on ${dayName}s.` });
      }
      
      // Time check (assuming 24h format like "09:00" or "17:00")
      // Convert times to comparable numbers (e.g., 09:00 -> 900, 17:30 -> 1730)
      const getMin = (t) => parseInt(t.split(':')[0]) * 60 + parseInt(t.split(':')[1]);
      
      if (daySchedule.startTime && daySchedule.endTime) {
        const reqTime = getMin(appointmentTime);
        const start = getMin(daySchedule.startTime);
        const end = getMin(daySchedule.endTime);

        if (reqTime < start || reqTime > end) {
           return res.status(400).json({ 
             success: false, 
             message: `Doctor is only available between ${daySchedule.startTime} and ${daySchedule.endTime}` 
           });
        }
      }
    }
    // --------------------------

    const appointment = new Appointment({
      userId,
      doctorId: doctorDoc._id, // Use actual Doctor ID
      doctorUserId: doctorDoc.userId,
      doctorName,
      serviceId: serviceId || '',
      serviceName: serviceName || '',
      appointmentDate: dateObj,
      appointmentTime,
      amount: amount || 0,
      notes: notes || '',
      status: 'pending',
      paymentStatus: 'pending'
    });

    await appointment.save();

    res.status(201).json({ success: true, message: 'Appointment created successfully', appointment });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ success: false, message: 'Error creating appointment', error: error.message });
  }
});

router.get('/my-appointments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const appointments = await Appointment.find({ userId })
      .select('userId doctorId doctorUserId doctorName serviceId serviceName appointmentDate appointmentTime status paymentStatus amount notes prescription')
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .lean();

    res.status(200).json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching appointments', error: error.message });
  }
});

// Update payment (Existing)
router.patch('/:appointmentId/payment', authenticateToken, async (req, res) => {
    // ... existing code ...
    // Just ensure you include req.params in the findOne
    try {
        const { appointmentId } = req.params;
        const userId = req.user.userId;
        const appointment = await Appointment.findOne({ _id: appointmentId, userId });
        if (!appointment) return res.status(404).json({ success: false, message: 'Not found' });
        
        appointment.paymentStatus = 'paid';
        appointment.status = 'confirmed';
        await appointment.save();
        res.status(200).json({ success: true, appointment });
    } catch(err) {
        res.status(500).json({success:false, message: err.message});
    }
});

module.exports = router;