// server/src/routes/treatmentPlan.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const TreatmentPlan = require('../models/treatmentPlan.model');
const Appointment = require('../models/appointment.model');
const { verifyToken } = require('../middleware/auth.middleware');
const imagekit = require('../utils/imagekit');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// GET Plan by Appointment ID
router.get('/:appointmentId', verifyToken, async (req, res) => {
  try {
    const plan = await TreatmentPlan.findOne({ appointmentId: req.params.appointmentId });
    if (!plan) return res.status(200).json({ success: true, plan: null }); // No plan yet is fine
    res.json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching plan', error: error.message });
  }
});

// SAVE / UPDATE Plan (Upsert)
router.post('/:appointmentId', verifyToken, upload.single('prescriptionFile'), async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const doctorUserId = req.user.id || req.user.userId;
    
    // Extract textual data
    const { 
      diagnosis, 
      prescriptionDescription, 
      labTests, 
      dietPlan, 
      pharmacy, 
      status // We can also update appointment status here
    } = req.body;

    console.log(`[TREATMENT] Saving for Appointment: ${appointmentId}`);

    // 1. Prepare Data Object
    let updateData = {
      doctorUserId,
      diagnosis: diagnosis || '',
      prescriptionDescription: prescriptionDescription || ''
    };

    // 2. Parse Arrays
    try {
      if (labTests) updateData.labTests = JSON.parse(labTests);
      if (dietPlan) updateData.dietPlan = JSON.parse(dietPlan);
      if (pharmacy) {
        const rawPharm = JSON.parse(pharmacy);
        updateData.pharmacy = Array.isArray(rawPharm) ? rawPharm.map(p => ({
            medicineName: p.medicineName || p.name,
            frequency: p.frequency || '',
            duration: p.duration || ''
        })) : [];
      }
    } catch (e) {
      console.error("JSON Parse Error in Treatment Plan:", e);
      return res.status(400).json({ success: false, message: 'Invalid data format' });
    }

    // 3. Find or Create Plan
    let plan = await TreatmentPlan.findOne({ appointmentId });
    
    // Handle File Upload
    if (req.file) {
      const result = await imagekit.upload({
        file: req.file.buffer,
        fileName: `tx_${appointmentId}_${Date.now()}_${req.file.originalname}`,
        folder: '/crm/treatment-plans',
        useUniqueFileName: true
      });
      
      const newAttachment = {
        url: result.url,
        fileId: result.fileId,
        name: req.file.originalname
      };

      if (plan) {
        plan.attachments.push(newAttachment);
      } else {
        updateData.attachments = [newAttachment];
      }
    }

    // 4. Perform DB Update (Upsert)
    if (plan) {
      // Update existing
      Object.assign(plan, updateData);
      await plan.save();
    } else {
      // Create new
      updateData.appointmentId = appointmentId;
      // Get patientId from Appointment to store in TreatmentPlan for easier lookup later
      const appt = await Appointment.findById(appointmentId);
      if (appt) updateData.patientId = appt.patientId;
      
      plan = await TreatmentPlan.create(updateData);
    }

    // 5. Update Parent Appointment Status (if requested)
    if (status) {
      await Appointment.findByIdAndUpdate(appointmentId, { 
        status: status,
        // Also link the plan ID back to appointment just in case
        // But we rely mainly on appointmentId in TreatmentPlan
      });
    }

    res.json({ success: true, message: 'Treatment plan saved successfully', plan });

  } catch (error) {
    console.error("Save Treatment Plan Error:", error);
    res.status(500).json({ success: false, message: 'Failed to save treatment plan', error: error.message });
  }
});

// DELETE File from Plan
router.delete('/:appointmentId/files/:fileId', verifyToken, async (req, res) => {
    try {
        const plan = await TreatmentPlan.findOne({ appointmentId: req.params.appointmentId });
        if(plan) {
            plan.attachments = plan.attachments.filter(f => f._id.toString() !== req.params.fileId);
            await plan.save();
        }
        res.json({ success: true, plan });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;