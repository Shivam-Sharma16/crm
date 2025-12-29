const express = require('express');
const router = express.Router();
const multer = require('multer');
const Appointment = require('../models/appointment.model');
const Doctor = require('../models/doctor.model');
const User = require('../models/user.model'); 
const { verifyToken } = require('../middleware/auth.middleware');
const imagekit = require('../utils/imagekit');

// Configure Multer for File Uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// --- 1. Create Appointment ---
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { 
      doctorId, serviceId, serviceName, appointmentDate, appointmentTime, amount, 
      notes, symptoms, ivfDetails
    } = req.body;

    const userId = req.user.userId;

    if (!doctorId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const patientId = user.patientId; 

    // Find Doctor
    let doctorDoc = await Doctor.findOne({
      $or: [
        { _id: (doctorId.match(/^[0-9a-fA-F]{24}$/) ? doctorId : null) },
        { userId: (doctorId.match(/^[0-9a-fA-F]{24}$/) ? doctorId : null) },
        { doctorId: doctorId }
      ]
    });

    if (!doctorDoc) return res.status(400).json({ success: false, message: 'Doctor not found.' });

    // Validate Date (Simplified for brevity, keep your existing validation logic if preferred)
    const reqDate = new Date(appointmentDate);
    if (isNaN(reqDate.getTime())) return res.status(400).json({message: "Invalid Date"});

    // Check Double Booking
    const existing = await Appointment.findOne({
        doctorId: doctorDoc._id,
        appointmentDate: reqDate,
        appointmentTime: appointmentTime,
        status: { $ne: 'cancelled' }
    });
    if (existing) return res.status(400).json({ success: false, message: 'Slot already booked.' });

    const appointment = new Appointment({
      userId: userId,
      patientId: patientId, 
      doctorId: doctorDoc._id,
      doctorUserId: doctorDoc.userId,
      doctorName: doctorDoc.name,
      serviceId: serviceId || 'general',
      serviceName: serviceName || 'General Consultation',
      appointmentDate: reqDate,
      appointmentTime: appointmentTime,
      amount: amount || doctorDoc.consultationFee || 500,
      notes: notes || '',
      symptoms: symptoms || '',
      ivfDetails: ivfDetails || {}, 
      status: 'pending',
      paymentStatus: 'pending'
    });

    const savedAppointment = await appointment.save();
    res.status(201).json({ success: true, message: 'Appointment booked', appointment: savedAppointment });

  } catch (error) {
    console.error('Create error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// --- 2. Update Treatment Plan (Doctor Action) ---
router.put('/update-plan/:id', verifyToken, upload.single('prescriptionFile'), async (req, res) => {
    try {
        const appointmentId = req.params.id;
        console.log(`[BACKEND] Updating Plan for ID: ${appointmentId}`);
        console.log(`[BACKEND] Body Keys:`, Object.keys(req.body));

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        // Check if the appointment belongs to the logged-in doctor
        if (appointment.doctorUserId.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Access denied. You can only update your own appointments.' });
        }

        // 1. File Upload Logic
        if (req.file) {
            console.log(`[BACKEND] Uploading file: ${req.file.originalname}`);
            const result = await imagekit.upload({
                file: req.file.buffer,
                fileName: `rx_${appointmentId}_${Date.now()}`,
                folder: '/crm',
                tags: ['prescription', appointmentId]
            });
            
            if (!appointment.prescriptions) appointment.prescriptions = [];
            appointment.prescriptions.push({
                url: result.url,
                fileId: result.fileId,
                name: req.file.originalname
            });
            appointment.prescription = result.url; // Legacy support
        }

        // 2. Parse Data (FormData sends everything as strings)
        const { diagnosis, instructions, labTests, dietPlan, pharmacy, status } = req.body;

        // Initialize treatmentPlan if missing
        if (!appointment.treatmentPlan) appointment.treatmentPlan = {};

        // Helper to parse JSON strings
        const parseJSON = (data, name) => {
            if (!data) return [];
            try {
                return typeof data === 'string' ? JSON.parse(data) : data;
            } catch (e) {
                console.error(`Error parsing ${name}:`, e.message);
                return [];
            }
        };

        // Update Fields
        if (diagnosis) appointment.treatmentPlan.diagnosis = diagnosis;
        if (instructions) appointment.treatmentPlan.instructions = instructions;
        if (status) appointment.status = status;

        if (labTests) appointment.treatmentPlan.labTests = parseJSON(labTests, 'labTests');
        if (dietPlan) appointment.treatmentPlan.dietPlan = parseJSON(dietPlan, 'dietPlan');
        
        if (pharmacy) {
            const rawPharmacy = parseJSON(pharmacy, 'pharmacy');
            if (Array.isArray(rawPharmacy)) {
                appointment.treatmentPlan.pharmacy = rawPharmacy.map(item => ({
                    medicineName: item.name || item.medicineName,
                    frequency: item.frequency || '',
                    duration: item.duration || ''
                }));
            }
        }

        // Sync legacy root fields to ensure compatibility
        appointment.labTests = appointment.treatmentPlan.labTests;
        appointment.dietPlan = appointment.treatmentPlan.dietPlan;
        appointment.pharmacy = appointment.treatmentPlan.pharmacy;
        appointment.notes = appointment.treatmentPlan.diagnosis; // Sync notes

        const savedDoc = await appointment.save();
        console.log("[BACKEND] Plan Saved Successfully");

        res.json({ success: true, message: 'Treatment plan updated', appointment: savedDoc });

    } catch (error) {
        console.error("Update Plan Error:", error);
        res.status(500).json({ success: false, message: 'Failed to update plan', error: error.message });
    }
});

// --- 3. Get Single Appointment (For Doctor Details) ---
router.get('/details/:id', verifyToken, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('userId', 'name email phone patientId')
            .lean();
        if (!appointment) return res.status(404).json({ message: 'Not found' });
        res.json({ success: true, appointment });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching details' });
    }
});

// --- 4. Get My Appointments (For User Dashboard) ---
router.get('/my-appointments', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Explicitly select treatmentPlan and other fields
    const appointments = await Appointment.find({ userId })
      .select('userId patientId doctorId doctorName serviceName appointmentDate appointmentTime status amount notes treatmentPlan prescription prescriptions labTests dietPlan pharmacy ivfDetails')
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .lean(); 
    
    res.status(200).json({ success: true, appointments });
  } catch (error) {
    console.error('Fetch appointments error:', error);
    res.status(500).json({ success: false, message: 'Error fetching appointments' });
  }
});

// --- 5. Get Latest Appointment for Patient (For Doctor) ---
router.get('/patient/:patientId/latest', verifyToken, async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const appointment = await Appointment.findOne({ patientId })
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .populate('userId', 'name email phone patientId')
      .lean();
    if (!appointment) return res.status(404).json({ message: 'No appointment found for this patient' });
    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching latest appointment' });
  }
});

module.exports = router;