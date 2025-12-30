// server/src/routes/lab.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const LabReport = require('../models/labReport.model');
const Appointment = require('../models/appointment.model');
const { verifyToken } = require('../middleware/auth.middleware');
const imagekit = require('../utils/imagekit');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

const verifyLabRole = (req, res, next) => {
    if (req.user && req.user.role === 'lab') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Access denied. Lab role required.' });
    }
};

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

router.get('/requests', verifyToken, verifyLabRole, async (req, res) => {
    try {
        const { status } = req.query;
        
        let query = {};
        if (status === 'completed') query.testStatus = 'DONE';
        else if (status === 'pending') query.testStatus = 'PENDING';

        const reports = await LabReport.find(query)
            // --- CRITICAL FIX: Populate prescription fields ---
            .populate('appointmentId', 'appointmentDate appointmentTime serviceName prescription prescriptions')
            .populate('userId', 'name email phone gender age')
            .populate('doctorId', 'name')
            .sort({ createdAt: -1 });

        res.json({ success: true, requests: reports });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching requests', error: error.message });
    }
});

router.post('/upload-report/:id', verifyToken, verifyLabRole, upload.single('reportFile'), async (req, res) => {
    try {
        const { id } = req.params;
        const report = await LabReport.findById(id);

        if (!report) return res.status(404).json({ success: false, message: 'Lab request not found' });
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

        const result = await imagekit.upload({
            file: req.file.buffer,
            fileName: `lab_report_${id}_${Date.now()}`,
            folder: '/crm/lab_reports',
            tags: ['lab_report', report.appointmentId.toString()]
        });

        report.reportFile = {
            url: result.url,
            fileId: result.fileId,
            name: req.file.originalname,
            uploadedAt: new Date()
        };
        report.reportStatus = 'UPLOADED';
        report.testStatus = 'DONE';
        await report.save();

        await Appointment.findByIdAndUpdate(report.appointmentId, {
            $push: {
                prescriptions: { 
                    url: result.url,
                    name: `Lab Report: ${req.file.originalname}`,
                    uploadedAt: new Date(),
                    type: 'lab_report'
                }
            }
        });

        res.json({ success: true, message: 'Report uploaded and synced', report });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
    }
});

module.exports = router;