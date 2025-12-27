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

// GET Public Doctors List
router.get('/', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const { serviceId } = req.query;
    let query = {};

    if (serviceId) {
      let searchTerms = [serviceId];
      let searchRegexes = [];
      const cleanName = serviceId.replace(/-/g, ' ');
      searchRegexes.push(new RegExp(cleanName, 'i')); 
      
      try {
        const serviceDoc = await Service.findOne({
          $or: [
            { id: serviceId }, 
            { title: { $regex: cleanName, $options: 'i' } },
            { _id: (serviceId.match(/^[0-9a-fA-F]{24}$/) ? serviceId : null) }
          ]
        });

        if (serviceDoc) {
          searchTerms.push(serviceDoc.id);
          searchTerms.push(serviceDoc.title);
          if (serviceDoc._id) searchTerms.push(serviceDoc._id.toString());
          searchRegexes.push(new RegExp(serviceDoc.title, 'i'));
        }
      } catch (err) {
        console.warn("Service lookup warning:", err.message);
      }

      query = {
        $or: [
          { services: { $in: searchTerms } },
          { specialty: { $in: searchRegexes } },
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
      // Updated select to include dietPlan
      .select('userId patientId doctorId doctorUserId doctorName serviceId serviceName appointmentDate appointmentTime status paymentStatus amount notes prescription prescriptions labTests dietPlan pharmacy')
      .populate('userId', 'name email phone patientId')
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

// UPLOAD Prescription & Update Treatment Details
router.patch('/appointments/:id/prescription', verifyToken, upload.single('prescriptionFile'), async (req, res) => {
  try {
    if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Access denied' });

    // Extract textual data. Note: 'diet' might be sent as 'dietPlan'
    const { status, diagnosis, labTests, diet, dietPlan, pharmacy } = req.body;
    const appointmentId = req.params.id;
    const doctorUserId = req.user.id || req.user.userId;

    const appointment = await Appointment.findOne({ _id: appointmentId, doctorUserId });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Handle File Upload
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

    // Update Status & Notes
    if (status) appointment.status = status;
    if (diagnosis) appointment.notes = diagnosis; 

    // Update Complex Fields (Parse JSON if string)
    
    // 1. Lab Tests
    if (labTests) {
      try {
        appointment.labTests = typeof labTests === 'string' ? JSON.parse(labTests) : labTests;
      } catch (e) { console.error("Error parsing labTests:", e); }
    }

    // 2. Diet Plan (Handle both 'diet' and 'dietPlan' keys)
    const dietData = dietPlan || diet;
    if (dietData) {
      try {
        appointment.dietPlan = typeof dietData === 'string' ? JSON.parse(dietData) : dietData;
      } catch (e) { console.error("Error parsing dietPlan:", e); }
    }

    // 3. Pharmacy
    if (pharmacy) {
      try {
        const parsedPharmacy = typeof pharmacy === 'string' ? JSON.parse(pharmacy) : pharmacy;
        // Map frontend "name" to backend "medicineName"
        if (Array.isArray(parsedPharmacy)) {
            appointment.pharmacy = parsedPharmacy.map(item => ({
                medicineName: item.name || item.medicineName,
                frequency: item.frequency || '',
                duration: item.duration || ''
            }));
        }
      } catch (e) { console.error("Error parsing pharmacy:", e); }
    }

    await appointment.save();
    res.json({ success: true, message: 'Treatment plan updated', appointment });
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

// GET Doctor's Patients (Unique List)
router.get('/patients', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Only doctors can access this route.' });
    }

    const doctorUserId = req.user.id || req.user.userId;

    const appointments = await Appointment.find({ doctorUserId })
      .populate('userId', 'name email phone patientId')
      .sort({ appointmentDate: -1 });

    const uniquePatientsMap = new Map();

    appointments.forEach(app => {
      if (app.userId) {
        const patientId = app.userId.patientId || app.userId._id.toString();
        
        if (!uniquePatientsMap.has(patientId)) {
          uniquePatientsMap.set(patientId, {
            _id: app.userId._id,
            patientId: app.userId.patientId || 'N/A', // Return persistent ID
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

// GET Patient History (Previous Appointments with this Doctor)
router.get('/patients/:patientId/history', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Access denied' });
        
        const { patientId } = req.params;
        const doctorUserId = req.user.id || req.user.userId;

        // Find appointments matching patientId or userId
        // If patientId starts with P-, treat as persistent ID. Else treat as ObjectId.
        let query = { doctorUserId };
        
        if (patientId.startsWith('P-')) {
            query.patientId = patientId;
        } else {
            query.userId = patientId; // Fallback if old ID passed
        }

        const history = await Appointment.find(query)
            .sort({ appointmentDate: -1 })
            // Updated select to include dietPlan
            .select('appointmentDate appointmentTime serviceName status notes prescription prescriptions labTests dietPlan pharmacy')
            .lean();

        res.json({ success: true, history });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching history', error: error.message });
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