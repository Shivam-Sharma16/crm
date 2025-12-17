const express = require('express');
const router = express.Router();
const multer = require('multer');
const imagekit = require('../utils/imagekit'); // Your existing ImageKit util

// Configure Multer for memory storage (buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed!'), false);
    }
  }
});

// Generic Route to Upload Multiple Images/Files
// Usage: POST /api/upload/images
// Body: FormData with key "images" (multiple files) and optional "captions"
router.post('/images', upload.array("images", 10), async (req, res) => {
  try {
    const files = req.files;
    const { captions } = req.body; // Optional captions array

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    // Handle single or multiple captions
    const captionsArray = Array.isArray(captions) ? captions : [captions];

    const uploadedFiles = [];

    // Iterate through all uploaded files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const caption = captionsArray[i] || file.originalname;

      // Upload to ImageKit
      const result = await imagekit.upload({
        file: file.buffer, // Buffer from multer
        fileName: `crm_${Date.now()}_${file.originalname}`,
        folder: '/crm',    // Upload to your CRM folder
        tags: ['crm_upload', file.mimetype]
      });

      // Create a result object (similar to your songObject)
      const fileObject = {
        name: file.originalname,
        caption: caption,
        url: result.url,
        fileId: result.fileId,
        type: file.mimetype,
        size: result.size
      };

      uploadedFiles.push(fileObject);
    }

    // Return the uploaded data (You can save this to a 'Gallery' or 'Report' model here if needed)
    res.status(201).json({
      success: true,
      message: "Images uploaded successfully",
      count: uploadedFiles.length,
      files: uploadedFiles,
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
        success: false, 
        message: "Upload failed", 
        error: error.message 
    });
  }
});

module.exports = router;