// server/src/routes/doctor.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const Appointment = require('../models/appointment.model');
const Doctor = require('../models/doctor.model');
const Service = require('../models/service.model'); 
const LabReport = require('../models/labReport.model'); // Added LabReport Model
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
      .select('userId patientId doctorId doctorUserId doctorName serviceId serviceName appointmentDate appointmentTime status paymentStatus amount notes doctorNotes symptoms diagnosis ivfDetails prescription prescriptions labTests dietPlan pharmacy')
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

// UPLOAD Prescription & Update Treatment Details (Updated for LabReport)
router.patch('/appointments/:id/prescription', verifyToken, upload.single('prescriptionFile'), async (req, res) => {
  try {
    console.log(`[DOCTOR] Updating Prescription for ID: ${req.params.id}`);

    if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Access denied' });

    const { status, diagnosis, labTests, diet, dietPlan, pharmacy } = req.body;
    const appointmentId = req.params.id;
    const doctorUserId = req.user.id || req.user.userId;

    // Populate userId to get patient details for LabReport
    const appointment = await Appointment.findOne({ _id: appointmentId, doctorUserId })
      .populate('userId', 'patientId'); 

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Handle File Upload
    if (req.file) {
        console.log(`[DOCTOR] File uploaded: ${req.file.originalname}`);
        const result = await imagekit.upload({
          file: req.file.buffer,
          fileName: `prescription_${appointmentId}_${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`,
          folder: '/crm', 
          tags: ['prescription', appointmentId],
          useUniqueFileName: true
        });

        if (!appointment.prescriptions) appointment.prescriptions = [];

        // Migrate legacy
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
        
        appointment.prescription = result.url;
    }

    // Update Status & Notes & Diagnosis
    if (status) appointment.status = status;
    if (diagnosis) {
        appointment.diagnosis = diagnosis;
        appointment.notes = diagnosis;
    }

    // 1. Lab Tests Parsing & Sync
    let parsedLabTests = [];
    if (labTests) {
      try {
        parsedLabTests = typeof labTests === 'string' ? JSON.parse(labTests) : labTests;
        appointment.labTests = Array.isArray(parsedLabTests) ? parsedLabTests : [];
      } catch (e) { console.error("[DOCTOR] Error parsing labTests:", e); }
    }

    // 2. Diet Plan
    const dietData = dietPlan || diet;
    if (dietData) {
      try {
        const parsed = typeof dietData === 'string' ? JSON.parse(dietData) : dietData;
        appointment.dietPlan = Array.isArray(parsed) ? parsed : [];
      } catch (e) { console.error("[DOCTOR] Error parsing dietPlan:", e); }
    }

    // 3. Pharmacy
    if (pharmacy) {
      try {
        const parsedPharmacy = typeof pharmacy === 'string' ? JSON.parse(pharmacy) : pharmacy;
        if (Array.isArray(parsedPharmacy)) {
            appointment.pharmacy = parsedPharmacy.map(item => ({
                medicineName: item.name || item.medicineName,
                frequency: item.frequency || '',
                duration: item.duration || ''
            }));
        }
      } catch (e) { console.error("[DOCTOR] Error parsing pharmacy:", e); }
    }

    const savedDoc = await appointment.save();

    // --- AUTOMATIC LAB REPORT CREATION ---
    if (parsedLabTests && parsedLabTests.length > 0) {
        try {
            // Check if a report already exists for this appointment
            const existingReport = await LabReport.findOne({ appointmentId: appointment._id });

            if (existingReport) {
                // Update existing request
                existingReport.testNames = parsedLabTests;
                // If previously completed, we might want to set back to PENDING if new tests added, 
                // but usually better to keep as is or handle via specific status logic.
                // For now, we update the list.
                await existingReport.save();
                console.log(`[LAB] Updated existing lab request for Appointment ${appointment._id}`);
            } else {
                // Create new request
                await LabReport.create({
                    appointmentId: appointment._id,
                    patientId: appointment.userId?.patientId || 'N/A',
                    userId: appointment.userId?._id,
                    doctorId: doctorUserId,
                    testNames: parsedLabTests,
                    testStatus: 'PENDING',
                    reportStatus: 'PENDING'
                });
                console.log(`[LAB] Created new lab request for Appointment ${appointment._id}`);
            }
        } catch (labError) {
            console.error("[DOCTOR] Error syncing Lab Report:", labError);
            // Don't fail the main request if lab sync fails, just log it
        }
    }
    // -------------------------------------
    
    res.json({ success: true, message: 'Treatment plan updated', appointment: savedDoc });
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
            patientId: app.userId.patientId || 'N/A',
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

// GET Patient History
router.get('/patients/:patientId/history', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Access denied' });
        
        const { patientId } = req.params;
        const doctorUserId = req.user.id || req.user.userId;

        let query = { doctorUserId };
        if (patientId.startsWith('P-')) {
            query.patientId = patientId;
        } else {
            query.userId = patientId; 
        }

        const history = await Appointment.find(query)
            .sort({ appointmentDate: -1 })
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

    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

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