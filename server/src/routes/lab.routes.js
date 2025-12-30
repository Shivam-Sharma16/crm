const express = require('express');
const router = express.Router();
const Appointment = require('../models/appointment.model');
const User = require('../models/user.model');
const { verifyToken } = require('../middleware/auth.middleware');

// Middleware to ensure user is a Lab
const verifyLab = (req, res, next) => {
  if (req.user && req.user.role === 'lab') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied. Lab privileges required.' });
  }
};

// 1. Get Lab Dashboard Stats
router.get('/stats', verifyToken, verifyLab, async (req, res) => {
  try {
    // Find appointments with lab tests
    const labAppointments = await Appointment.find({
      labTests: { $exists: true, $not: { $size: 0 } },
      status: { $ne: 'cancelled' }
    });

    const pending = labAppointments.filter(app => !app.labReports || app.labReports.length === 0).length;
    const completed = labAppointments.filter(app => app.labReports && app.labReports.length > 0).length;

    res.json({
      success: true,
      stats: {
        totalRequests: labAppointments.length,
        pending,
        completed
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching stats', error: error.message });
  }
});

// 2. Get Assigned/Pending Tests
router.get('/requests', verifyToken, verifyLab, async (req, res) => {
  try {
    const { status } = req.query; // 'pending' or 'completed'
    
    let query = {
      labTests: { $exists: true, $not: { $size: 0 } },
      status: { $ne: 'cancelled' }
    };

    const appointments = await Appointment.find(query)
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name') // Assuming doctorId is stored or populated via doctorUserId
      .sort({ appointmentDate: 1 });

    // Filter based on whether reports have been uploaded
    // Note: You may need to add a 'labReports' field to your Appointment modelSchema 
    // or use a separate Report model. For this example, we assume we check if the report exists.
    const filtered = appointments.filter(app => {
        const hasReports = app.prescriptions && app.prescriptions.some(p => p.type === 'lab_report'); // Example logic
        return status === 'completed' ? hasReports : !hasReports;
    });

    res.json({ success: true, requests: filtered });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching requests', error: error.message });
  }
});

// 3. Upload Lab Report (Update Appointment)
router.post('/upload-report/:id', verifyToken, verifyLab, async (req, res) => {
  try {
    const { reportUrl, reportName } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Add to prescriptions array with a type indicator or simple name convention
    // Since appointment.model.js uses a 'prescriptions' array for docs
    appointment.prescriptions.push({
      url: reportUrl,
      name: reportName || 'Lab Report',
      uploadedAt: new Date()
    });

    await appointment.save();

    res.json({ success: true, message: 'Report uploaded successfully', appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error uploading report', error: error.message });
  }
});

module.exports = router;