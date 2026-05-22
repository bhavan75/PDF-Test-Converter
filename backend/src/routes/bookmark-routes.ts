import { Router } from 'express';
import { toggleBookmark, getBookmarks } from '../controllers/bookmark-controller.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

router.post('/toggle', authenticateJWT as any, toggleBookmark as any);
router.get('/', authenticateJWT as any, getBookmarks as any);

export default router;
