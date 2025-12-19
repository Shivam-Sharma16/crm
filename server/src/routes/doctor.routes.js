// server/src/routes/doctor.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const Appointment = require('../models/appointment.model');
const Doctor = require('../models/doctor.model');
const { verifyToken } = require('../middleware/auth.middleware');
const imagekit = require('../utils/imagekit');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// GET Public Doctors List
router.get('/', async (req, res) => {
  try {
    // FIX: COMPLETELY DISABLE CACHING
    // This ensures that if an admin deletes/edits a doctor, the user sees it immediately.
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const { serviceId } = req.query;
    let query = {};
    if (serviceId) {
      query.services = { $in: [serviceId] };
    }
    
    const doctors = await Doctor.find(query)
      .select('doctorId userId name email phone specialty experience education services availability successRate patientsCount image bio consultationFee')
      .populate('userId', 'name email phone role')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({ success: true, doctors, count: doctors.length, cached: false });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching doctors', error: error.message });
  }
});

// GET Doctor Appointments
router.get('/appointments', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Access denied. Only doctors can access this route.' });
    }

    const doctorUserId = req.user.id || req.user.userId;
    
    const appointments = await Appointment.find({ doctorUserId })
      .select('userId doctorId doctorUserId doctorName serviceId serviceName appointmentDate appointmentTime status paymentStatus amount notes prescription prescriptions')
      .populate('userId', 'name email phone')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .lean();

    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching appointments', error: error.message });
  }
});

// UPDATE Availability (For Doctor Dashboard)
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

// CANCEL Appointment
router.patch('/appointments/:id/cancel', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Access denied' });
    const appointmentId = req.params.id;
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (appointment.doctorUserId.toString() !== (req.user.id || req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    appointment.status = 'cancelled';
    await appointment.save();
    res.json({ success: true, message: 'Appointment cancelled', appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Cancellation failed', error: error.message });
  }
});

// UPLOAD Prescription
router.patch('/appointments/:id/prescription', verifyToken, upload.single('prescriptionFile'), async (req, res) => {
  try {
    if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Access denied' });

    const { status, diagnosis } = req.body;
    const appointmentId = req.params.id;
    const doctorUserId = req.user.id || req.user.userId;

    const appointment = await Appointment.findOne({ _id: appointmentId, doctorUserId });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (req.file) {
        console.log('Uploading file to ImageKit...');
        const result = await imagekit.upload({
          file: req.file.buffer,
          fileName: `prescription_${appointmentId}_${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`,
          folder: '/crm', 
          tags: ['prescription', appointmentId],
          useUniqueFileName: true
        });

        if (appointment.prescriptions) {
            // Migration logic for old data
            if (appointment.prescription && appointment.prescriptions.length === 0) {
                 appointment.prescriptions.push({
                     url: appointment.prescription,
                     name: 'Previous Prescription',
                     uploadedAt: new Date(appointment.updatedAt)
                 });
            }
            appointment.prescriptions.push({
                url: result.url,
                fileId: result.fileId,
                name: req.file.originalname,
                uploadedAt: new Date()
            });
        }
        appointment.prescription = result.url;
    }

    if (status) appointment.status = status;
    if (diagnosis) appointment.notes = diagnosis; 

    await appointment.save();
    res.json({ success: true, message: 'Prescription updated', appointment });
  } catch (error) {
    console.error('Prescription update error:', error);
    res.status(500).json({ success: false, message: 'Update failed', error: error.message });
  }
});

// DELETE Prescription
router.delete('/appointments/:id/prescriptions/:prescriptionId', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Access denied' });
        const { id, prescriptionId } = req.params;

        const appointment = await Appointment.findOne({ 
            _id: id, 
            doctorUserId: req.user.id || req.user.userId 
        });

        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        if (appointment.prescriptions) {
            appointment.prescriptions.pull({ _id: prescriptionId });
            if (appointment.prescriptions.length > 0) {
                appointment.prescription = appointment.prescriptions[appointment.prescriptions.length - 1].url;
            } else {
                appointment.prescription = '';
            }
        }

        await appointment.save();
        res.json({ success: true, message: 'Prescription removed', appointment });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Delete failed', error: error.message });
    }
});

module.exports = router;