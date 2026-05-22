import { Router } from 'express';
import { signup, login, getMe } from '../controllers/auth-controller.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authenticateJWT as any, getMe as any);

export default router;
