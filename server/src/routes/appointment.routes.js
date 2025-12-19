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
    const { doctorId, serviceId, serviceName, appointmentDate, appointmentTime, amount, notes } = req.body;
    const userId = req.user.userId;

    // Log the incoming request for debugging
    console.log("--- New Appointment Request ---");
    console.log("Body:", req.body);

    if (!doctorId || !appointmentDate || !appointmentTime) {
      console.log("Error: Missing required fields");
      return res.status(400).json({ success: false, message: 'Missing required fields (doctorId, date, or time)' });
    }

    // --- 1. ROBUST DATE VALIDATION (String Comparison) ---
    // We compare YYYY-MM-DD strings to avoid timezone issues
    const today = new Date();
    const reqDate = new Date(appointmentDate);
    
    // Normalize to YYYY-MM-DD strings
    const todayStr = today.toISOString().split('T')[0];
    const reqDateStr = reqDate.toISOString().split('T')[0];

    // Check if date is in the past
    if (reqDateStr < todayStr) {
        console.log("Error: Date is in the past");
        return res.status(400).json({ success: false, message: 'Cannot book appointments in the past.' });
    }

    // Check max 14 days
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 14);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    if (reqDateStr > maxDateStr) {
        console.log("Error: Date > 14 days");
        return res.status(400).json({ success: false, message: 'Cannot book more than 14 days in advance.' });
    }

    // --- 2. TIME VALIDATION (If booking for Today) ---
    if (reqDateStr === todayStr) {
        const currentHours = today.getHours();
        const currentMinutes = today.getMinutes();
        const currentTimeInMin = currentHours * 60 + currentMinutes;

        const [reqHours, reqMinutes] = appointmentTime.split(':').map(Number);
        const reqTimeInMin = reqHours * 60 + reqMinutes;

        // Add a small buffer (e.g., 5 mins) so users can't book the exact current minute
        if (reqTimeInMin <= currentTimeInMin + 5) {
            console.log("Error: Time slot passed");
            return res.status(400).json({ success: false, message: 'This time slot has already passed or is too soon.' });
        }
    }

    // --- 3. FIND DOCTOR (And get Name automatically) ---
    let doctorDoc = await Doctor.findOne({ 
        $or: [{ _id: doctorId }, { doctorId: doctorId }] 
    });
    
    if (!doctorDoc) {
      // Legacy fallback
      const doctorUser = await User.findOne({ name: req.body.doctorName, role: 'doctor' });
      if (doctorUser) {
        doctorDoc = await Doctor.findOne({ userId: doctorUser._id });
      }
    }

    if (!doctorDoc) {
      console.log("Error: Doctor not found for ID:", doctorId);
      return res.status(400).json({ success: false, message: 'Doctor not found.' });
    }

    // --- 4. CHECK IF SLOT IS ALREADY TAKEN ---
    const existingAppointment = await Appointment.findOne({
        doctorId: doctorDoc._id,
        appointmentDate: reqDateStr, // Use string matching if you stored as string, or Date range if Date
        // Since we save as Date, we need a range query for the specific day
        appointmentDate: {
            $gte: new Date(reqDateStr + 'T00:00:00.000Z'),
            $lte: new Date(reqDateStr + 'T23:59:59.999Z')
        },
        appointmentTime: appointmentTime,
        status: { $ne: 'cancelled' }
    });

    if (existingAppointment) {
        console.log("Error: Slot taken");
        return res.status(400).json({ 
            success: false, 
            message: `The slot at ${appointmentTime} is already booked.` 
        });
    }

    // --- 5. CHECK DOCTOR AVAILABILITY SCHEDULE ---
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[reqDate.getDay()];
    const daySchedule = doctorDoc.availability ? doctorDoc.availability[dayName] : null;

    if (daySchedule) {
      if (!daySchedule.available) {
        console.log(`Error: Doctor not available on ${dayName}`);
        return res.status(400).json({ success: false, message: `Doctor is not available on ${dayName}s.` });
      }
      
      const getMin = (t) => parseInt(t.split(':')[0]) * 60 + parseInt(t.split(':')[1]);
      
      if (daySchedule.startTime && daySchedule.endTime) {
        const reqTime = getMin(appointmentTime);
        const start = getMin(daySchedule.startTime);
        const end = getMin(daySchedule.endTime);

        if (reqTime < start || reqTime > end) {
           console.log("Error: Outside working hours");
           return res.status(400).json({ 
             success: false, 
             message: `Doctor available between ${daySchedule.startTime} and ${daySchedule.endTime}` 
           });
        }
      }
    }

    // --- 6. CREATE APPOINTMENT ---
    const appointment = new Appointment({
      userId,
      doctorId: doctorDoc._id, // Ensure ObjectId
      doctorUserId: doctorDoc.userId,
      doctorName: doctorDoc.name, // Use name from DB, not frontend
      serviceId: serviceId || '',
      serviceName: serviceName || '',
      appointmentDate: new Date(reqDateStr), // Save standardized date
      appointmentTime,
      amount: amount || doctorDoc.consultationFee || 0,
      notes: notes || '',
      status: 'pending',
      paymentStatus: 'pending'
    });

    await appointment.save();
    console.log("Success: Appointment booked", appointment._id);

    res.status(201).json({ success: true, message: 'Appointment created successfully', appointment });

  } catch (error) {
    // Handle Duplicate Key Error (Race Condition)
    if (error.code === 11000) {
        console.log("Error: Race condition duplicate detected");
        return res.status(400).json({ 
            success: false, 
            message: 'This slot was just booked by someone else. Please try another.' 
        });
    }

    console.error('Create appointment error:', error);
    res.status(500).json({ success: false, message: 'Error creating appointment', error: error.message });
  }
});

// Get My Appointments
router.get('/my-appointments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const appointments = await Appointment.find({ userId })
      .select('userId doctorId doctorUserId doctorName serviceId serviceName appointmentDate appointmentTime status paymentStatus amount notes prescription prescriptions')
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .lean();

    res.status(200).json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching appointments', error: error.message });
  }
});

// Update Payment Status
router.patch('/:appointmentId/payment', authenticateToken, async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const userId = req.user.userId;
        const appointment = await Appointment.findOne({ _id: appointmentId, userId });
        
        if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
        
        appointment.paymentStatus = 'paid';
        appointment.status = 'confirmed';
        await appointment.save();
        
        res.status(200).json({ success: true, appointment });
    } catch(err) {
        res.status(500).json({success:false, message: err.message});
    }
});

module.exports = router;