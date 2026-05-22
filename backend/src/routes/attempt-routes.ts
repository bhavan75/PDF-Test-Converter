import { Router } from 'express';
import { saveAttempt, getUserAttempts, getAttemptDetails, getDashboardAnalytics } from '../controllers/attempt-controller.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticateJWT as any, saveAttempt as any);
router.get('/history', authenticateJWT as any, getUserAttempts as any);
router.get('/analytics', authenticateJWT as any, getDashboardAnalytics as any);
router.get('/:id', authenticateJWT as any, getAttemptDetails as any);

export default router;
