const express = require('express');
const router = express.Router();
const Appointment = require('../models/appointment.model');
const Doctor = require('../models/doctor.model');
const { verifyToken } = require('../middleware/auth.middleware');

// Create Appointment
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { doctorId, serviceId, serviceName, appointmentDate, appointmentTime, amount, notes } = req.body;
    const userId = req.user.userId;

    if (!doctorId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ success: false, message: 'Missing required fields (doctorId, date, or time)' });
    }

    // 1. Find Doctor
    let doctorDoc = await Doctor.findOne({
      $or: [
        { _id: (doctorId.match(/^[0-9a-fA-F]{24}$/) ? doctorId : null) },
        { userId: (doctorId.match(/^[0-9a-fA-F]{24}$/) ? doctorId : null) },
        { doctorId: doctorId }
      ]
    });

    if (!doctorDoc) {
      return res.status(400).json({ success: false, message: 'Doctor not found.' });
    }

    // 2. Validate Date
    const today = new Date();
    const reqDate = new Date(appointmentDate);
    const todayStr = today.toISOString().split('T')[0];
    const reqDateStr = reqDate.toISOString().split('T')[0];

    if (reqDateStr < todayStr) {
        return res.status(400).json({ success: false, message: 'Cannot book appointments in the past.' });
    }

    // 3. Validate Time
    if (reqDateStr === todayStr) {
        const currentHours = today.getHours();
        const currentMinutes = today.getMinutes();
        const currentTimeInMin = currentHours * 60 + currentMinutes;
        const [reqHours, reqMinutes] = appointmentTime.split(':').map(Number);
        const reqTimeInMin = reqHours * 60 + reqMinutes;

        if (reqTimeInMin <= currentTimeInMin + 15) {
             return res.status(400).json({ success: false, message: 'This time slot is too soon or has passed.' });
        }
    }

    // 4. Check Availability
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[reqDate.getDay()];
    
    if (doctorDoc.availability && doctorDoc.availability[dayName]) {
        const daySchedule = doctorDoc.availability[dayName];
        if (!daySchedule.available) {
            return res.status(400).json({ success: false, message: `Doctor is not available on ${dayName}s.` });
        }
        if (daySchedule.startTime && daySchedule.endTime) {
            const getMin = (t) => parseInt(t.split(':')[0]) * 60 + parseInt(t.split(':')[1]);
            const reqMin = getMin(appointmentTime);
            const startMin = getMin(daySchedule.startTime);
            const endMin = getMin(daySchedule.endTime);
            
            if (reqMin < startMin || reqMin >= endMin) {
                 return res.status(400).json({ success: false, message: `Doctor is only available between ${daySchedule.startTime} and ${daySchedule.endTime}` });
            }
        }
    }

    // 5. Check for Double Booking
    const existingAppointment = await Appointment.findOne({
        doctorId: doctorDoc._id,
        appointmentDate: new Date(reqDateStr),
        appointmentTime: appointmentTime,
        status: { $ne: 'cancelled' }
    });

    if (existingAppointment) {
        return res.status(400).json({ success: false, message: 'This slot is already booked.' });
    }

    // 6. Save Appointment
    const appointment = new Appointment({
      userId: userId,
      doctorId: doctorDoc._id,
      doctorUserId: doctorDoc.userId,
      doctorName: doctorDoc.name,
      serviceId: serviceId || (doctorDoc.services && doctorDoc.services[0]) || 'general',
      serviceName: serviceName || 'General Consultation',
      appointmentDate: new Date(reqDateStr),
      appointmentTime: appointmentTime,
      amount: amount || doctorDoc.consultationFee || 500,
      notes: notes || '',
      status: 'pending',
      paymentStatus: 'pending'
    });

    await appointment.save();
    res.status(201).json({ success: true, message: 'Appointment booked successfully', appointment });

  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ success: false, message: 'Server error creating appointment', error: error.message });
  }
});

// Get My Appointments (Will include labTests, diet, pharmacy)
router.get('/my-appointments', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const appointments = await Appointment.find({ userId })
      .sort({ appointmentDate: -1, appointmentTime: -1 });
    res.status(200).json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching appointments' });
  }
});

module.exports = router;