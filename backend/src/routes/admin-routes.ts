import { Router } from 'express';
import { getAllPdfs, getPdfQuestions, editQuestion, approveQuestion, deleteQuestion, deletePdf } from '../controllers/admin-controller.js';
import { authenticateJWT, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Protect all routes with JWT and Admin checks
router.use(authenticateJWT as any);
router.use(requireAdmin as any);

router.get('/pdfs', getAllPdfs as any);
router.get('/pdfs/:pdfId/questions', getPdfQuestions as any);
router.put('/questions/:id', editQuestion as any);
router.put('/questions/:id/approve', approveQuestion as any);
router.delete('/questions/:id', deleteQuestion as any);
router.delete('/pdfs/:id', deletePdf as any);

export default router;
