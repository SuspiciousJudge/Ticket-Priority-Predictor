const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const auth = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists for local fallback
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Local storage fallback
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|csv|xlsx/;
  const extOk = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowedTypes.test(file.mimetype.split('/')[1]) || file.mimetype === 'application/pdf' || file.mimetype.includes('document') || file.mimetype.includes('sheet');
  if (extOk || mimeOk) return cb(null, true);
  cb(new Error('File type not allowed'));
};

const upload = multer({
  storage: localStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});

// Upload to Cloudinary (if configured) or serve locally
router.post('/', auth, upload.array('files', 5), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const results = [];
    const useCloud = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY;

    for (const file of req.files) {
      if (useCloud) {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'ticket-attachments',
          resource_type: 'auto',
        });
        // Clean up local temp file
        fs.unlinkSync(file.path);
        results.push({
          filename: file.originalname,
          url: result.secure_url,
          publicId: result.public_id,
          size: file.size,
        });
      } else {
        // Local storage
        results.push({
          filename: file.originalname,
          url: `/uploads/${file.filename}`,
          size: file.size,
        });
      }
    }

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
