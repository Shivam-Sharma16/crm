const express = require('express');
const router = express.Router();
const multer = require('multer');
const LabReport = require('../models/labReport.model');
const Appointment = require('../models/appointment.model');
const { verifyToken } = require('../middleware/auth.middleware');
const imagekit = require('../utils/imagekit');

// Middleware Config
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for detailed reports
});

const verifyLabRole = (req, res, next) => {
    if (req.user && req.user.role === 'lab') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Access denied. Lab role required.' });
    }
};

// 1. GET Stats
router.get('/stats', verifyToken, verifyLabRole, async (req, res) => {
    try {
        const total = await LabReport.countDocuments();
        const pending = await LabReport.countDocuments({ testStatus: 'PENDING' });
        const completed = await LabReport.countDocuments({ testStatus: 'DONE' });
        
        res.json({ success: true, stats: { total, pending, completed } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching stats' });
    }
});

// 2. GET Requests (Filter by status)
router.get('/requests', verifyToken, verifyLabRole, async (req, res) => {
    try {
        const { status } = req.query; // 'pending' or 'completed'
        
        let query = {};
        if (status === 'completed') {
            query.testStatus = 'DONE';
        } else if (status === 'pending') {
            query.testStatus = 'PENDING';
        }

        const reports = await LabReport.find(query)
            .populate('appointmentId', 'appointmentDate serviceName')
            .populate('userId', 'name email phone gender age') // Patient Info
            .populate('doctorId', 'name')
            .sort({ createdAt: -1 });

        res.json({ success: true, requests: reports });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching requests', error: error.message });
    }
});

// 3. UPLOAD Lab Report & Complete Test
router.post('/upload-report/:id', verifyToken, verifyLabRole, upload.single('reportFile'), async (req, res) => {
    try {
        const { id } = req.params;
        const report = await LabReport.findById(id);

        if (!report) {
            return res.status(404).json({ success: false, message: 'Lab request not found' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Upload to ImageKit
        const result = await imagekit.upload({
            file: req.file.buffer,
            fileName: `lab_report_${id}_${Date.now()}`,
            folder: '/crm/lab_reports',
            tags: ['lab_report', report.appointmentId.toString()]
        });

        // Update LabReport
        report.reportFile = {
            url: result.url,
            fileId: result.fileId,
            name: req.file.originalname,
            uploadedAt: new Date()
        };
        report.reportStatus = 'UPLOADED';
        report.testStatus = 'DONE';
        await report.save();

        // OPTIONAL: Update the original Appointment to make it easier for User Dashboard
        // This ensures the user sees the file in their existing "Documents" view without new frontend logic
        await Appointment.findByIdAndUpdate(report.appointmentId, {
            $push: {
                prescriptions: { // Pushing to prescriptions array as a "Report" type
                    url: result.url,
                    name: `Lab Report: ${req.file.originalname}`,
                    uploadedAt: new Date(),
                    type: 'lab_report' // You can filter by this field in frontend if needed
                }
            }
        });

        res.json({ success: true, message: 'Report uploaded and synced', report });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
    }
});

module.exports = router;