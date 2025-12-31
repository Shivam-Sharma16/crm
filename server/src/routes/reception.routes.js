// server/src/routes/reception.routes.js
const express = require('express');
const router = express.Router();
const Appointment = require('../models/appointment.model');
const Doctor = require('../models/doctor.model');
const { verifyToken } = require('../middleware/auth.middleware');

// Middleware to ensure user is Reception or Admin
const verifyReceptionOrAdmin = (req, res, next) => {
  if (req.user.role !== 'reception' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: Reception/Admin only' });
  }
  next();
};

// GET: All Appointments (Sorted)
router.get('/appointments', verifyToken, verifyReceptionOrAdmin, async (req, res) => {
  try {
    const appointments = await Appointment.find({})
      .populate('userId', 'name email phone patientId')
      .populate('doctorId', 'name')
      .sort({ appointmentDate: -1, appointmentTime: -1 }) // Newest first
      .lean();

    res.json({ success: true, appointments });
  } catch (error) {
    console.error('Reception fetch error:', error);
    res.status(500).json({ success: false, message: 'Error fetching appointments', error: error.message });
  }
});

// PATCH: Reschedule Appointment
router.patch('/appointments/:id/reschedule', verifyToken, verifyReceptionOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time } = req.body;

    if (!date || !time) return res.status(400).json({ success: false, message: 'Date and time required' });

    const appointment = await Appointment.findById(id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    // (Add your existing Doctor Availability/Double Booking validation logic here if needed)

    appointment.appointmentDate = new Date(date);
    appointment.appointmentTime = time;
    if (appointment.status === 'cancelled') appointment.status = 'confirmed';
    
    await appointment.save();
    res.json({ success: true, message: 'Rescheduled successfully', appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Reschedule failed', error: error.message });
  }
});

// PATCH: Cancel Appointment
router.patch('/appointments/:id/cancel', verifyToken, verifyReceptionOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, message: 'Cancelled successfully', appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Cancellation failed', error: error.message });
  }
});

module.exports = router;