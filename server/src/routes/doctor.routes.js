// server/src/routes/doctor.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const Appointment = require('../models/appointment.model');
const Doctor = require('../models/doctor.model');
const Service = require('../models/service.model'); 
const { verifyToken } = require('../middleware/auth.middleware');
const imagekit = require('../utils/imagekit');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// GET Public Doctors List (With Enhanced Matching)
router.get('/', async (req, res) => {
  try {
    // Disable caching for real-time updates
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const { serviceId } = req.query;
    let query = {};

    if (serviceId) {
      // 1. Prepare Search Terms
      // We start with the raw ID passed (e.g., "ivf" or "genetic-testing")
      let searchTerms = [serviceId];
      let searchRegexes = [];

      // Create a "clean" version for text matching (e.g., "genetic-testing" -> "genetic testing")
      const cleanName = serviceId.replace(/-/g, ' ');
      searchRegexes.push(new RegExp(cleanName, 'i')); // Case-insensitive regex
      
      // 2. Smart Lookup: Find the Service Document
      // This helps us find the "Real Title" if the ID is just a code
      try {
        const serviceDoc = await Service.findOne({
          $or: [
            { id: serviceId }, 
            { title: { $regex: cleanName, $options: 'i' } },
            // Check if valid ObjectId
            { _id: (serviceId.match(/^[0-9a-fA-F]{24}$/) ? serviceId : null) }
          ]
        });

        if (serviceDoc) {
          // Add known aliases from the DB to our search list
          searchTerms.push(serviceDoc.id);
          searchTerms.push(serviceDoc.title);
          if (serviceDoc._id) searchTerms.push(serviceDoc._id.toString());
          
          // Add the title to regex search as well
          searchRegexes.push(new RegExp(serviceDoc.title, 'i'));
        }
      } catch (err) {
        console.warn("Service lookup warning:", err.message);
      }

      // 3. Construct the "OR" Query
      // We match if ANY of these conditions are true:
      query = {
        $or: [
          // A. Exact match in the 'services' array
          { services: { $in: searchTerms } },
          
          // B. Partial match in 'specialty' field (e.g., "IVF Specialist" matches "ivf")
          { specialty: { $in: searchRegexes } },
          
          // C. Partial match in 'bio' (optional, but helpful)
          { bio: { $in: searchRegexes } } 
        ]
      };
    }
    
    const doctors = await Doctor.find(query)
      .select('doctorId userId name email phone specialty experience education services availability successRate patientsCount image bio consultationFee')
      .populate('userId', 'name email phone role')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({ success: true, doctors, count: doctors.length, cached: false });
  } catch (error) {
    console.error("Error fetching doctors:", error);
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

// UPDATE Availability
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
        const result = await imagekit.upload({
          file: req.file.buffer,
          fileName: `prescription_${appointmentId}_${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`,
          folder: '/crm', 
          tags: ['prescription', appointmentId],
          useUniqueFileName: true
        });

        if (appointment.prescriptions) {
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

// GET Doctor's Patients
router.get('/patients', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Only doctors can access this route.' });
    }

    const doctorUserId = req.user.id || req.user.userId;

    const appointments = await Appointment.find({ doctorUserId })
      .populate('userId', 'name email phone')
      .sort({ appointmentDate: -1 });

    const uniquePatientsMap = new Map();

    appointments.forEach(app => {
      if (app.userId) {
        const patientId = app.userId._id.toString();
        if (!uniquePatientsMap.has(patientId)) {
          uniquePatientsMap.set(patientId, {
            _id: app.userId._id,
            name: app.userId.name,
            email: app.userId.email,
            phone: app.userId.phone,
            lastAppointmentDate: app.appointmentDate,
            lastAppointmentId: app._id,
            totalAppointments: 1
          });
        } else {
          const patient = uniquePatientsMap.get(patientId);
          patient.totalAppointments += 1;
        }
      }
    });

    const patients = Array.from(uniquePatientsMap.values());
    res.json({ success: true, patients });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching patients', error: error.message });
  }
});

// GET Booked Slots
router.get('/:doctorId/booked-slots', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    const queryDate = new Date(date);
    
    const appointments = await Appointment.find({
      $or: [{ doctorId: doctorId }, { doctorUserId: doctorId }],
      appointmentDate: queryDate,
      status: { $ne: 'cancelled' }
    }).select('appointmentTime');

    const bookedSlots = appointments.map(app => app.appointmentTime);

    res.json({ success: true, bookedSlots });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching slots', error: error.message });
  }
});

module.exports = router;