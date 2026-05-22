import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadPdf, getPdfAnalysis } from '../controllers/upload-controller.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

// Ensure upload directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Save with unique timestamp to prevent collisions
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only PDF files are allowed!'));
  },
});

import { getPdfQuestions } from '../controllers/admin-controller.js';

router.post('/upload', authenticateJWT as any, upload.single('pdf'), uploadPdf);
router.get('/analysis/:id', authenticateJWT as any, getPdfAnalysis);
router.get('/:pdfId/questions', authenticateJWT as any, getPdfQuestions as any);

export default router;
