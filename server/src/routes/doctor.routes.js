// server/src/routes/doctor.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const Appointment = require('../models/appointment.model');
const User = require('../models/user.model');
const Doctor = require('../models/doctor.model');
const { verifyToken } = require('../middleware/auth.middleware');
const imagekit = require('../utils/imagekit');

// Configure Multer for memory storage (buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Route to get all doctors (public route)
router.get('/', async (req, res) => {
  try {
    const { serviceId } = req.query;
    res.set('Cache-Control', 'public, max-age=300');
    
    let query = {};
    if (serviceId) {
      query.services = { $in: [serviceId] };
    }
    
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
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only doctors can access this route.'
      });
    }

    const doctorUserId = req.user.id || req.user.userId;
    
    if (!doctorUserId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user information'
      });
    }
    
    const appointments = await Appointment.find({ 
      doctorUserId: doctorUserId
    })
    .select('userId doctorId doctorUserId doctorName serviceId serviceName appointmentDate appointmentTime status paymentStatus amount notes prescription')
    .populate('userId', 'name email phone')
    .sort({ appointmentDate: 1, appointmentTime: 1 })
    .lean();

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

// Update Doctor Availability
router.put('/availability', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Access denied' });

    const { availability } = req.body;
    const userId = req.user.id || req.user.userId;

    const doctor = await Doctor.findOneAndUpdate(
      { userId: userId },
      { $set: { availability } },
      { new: true }
    );

    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found' });

    res.json({ success: true, message: 'Availability updated', availability: doctor.availability });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed', error: error.message });
  }
});

// Cancel Appointment
router.patch('/appointments/:id/cancel', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Access denied' });
    
    const appointmentId = req.params.id;
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    
    if (appointment.doctorUserId.toString() !== (req.user.id || req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.json({ success: true, message: 'Appointment cancelled', appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Cancellation failed', error: error.message });
  }
});

// UPDATED: Add Prescription (supports File Upload to '/crm' folder)
router.patch('/appointments/:id/prescription', verifyToken, upload.single('prescriptionFile'), async (req, res) => {
  try {
    // --- DEBUG LOGS ---
    console.log('--- Prescription Upload Request ---');
    console.log('Request Headers Content-Type:', req.headers['content-type']);
    console.log('File detected by Multer:', req.file ? 'YES' : 'NO');
    if (req.file) {
        console.log('File Details:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
    }
    console.log('Body fields detected:', Object.keys(req.body));
    // ------------------

    if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Access denied' });

    const { status, diagnosis } = req.body;
    const appointmentId = req.params.id;

    const appointment = await Appointment.findOne({ 
      _id: appointmentId, 
      doctorUserId: req.user.id || req.user.userId 
    });

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    let message = 'Appointment updated successfully';
    
    // Handle File Upload to ImageKit
    if (req.file) {
      try {
        console.log('Uploading file to ImageKit...');
        const result = await imagekit.upload({
          file: req.file.buffer, // Buffer from memory storage
          fileName: `prescription_${appointmentId}_${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`,
          folder: '/crm', 
          tags: ['prescription', appointmentId],
          useUniqueFileName: true // Let ImageKit handle uniqueness
        });
        
        console.log('ImageKit upload successful:', result.url);
        appointment.prescription = result.url; // Save URL to MongoDB
        message = 'Prescription uploaded and appointment updated successfully';
      } catch (uploadError) {
        console.error('ImageKit Upload Error:', uploadError);
        return res.status(500).json({ success: false, message: 'Failed to upload prescription file', error: uploadError.message });
      }
    } else {
        console.warn('WARNING: No file received for upload.');
    }

    if (status) appointment.status = status;
    
    if (diagnosis) {
        appointment.notes = diagnosis; 
    }

    await appointment.save();
    
    res.json({ success: true, message, appointment });
  } catch (error) {
    console.error('Prescription update error:', error);
    res.status(500).json({ success: false, message: 'Update failed', error: error.message });
  }
});

module.exports = router;