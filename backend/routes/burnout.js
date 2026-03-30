import express from 'express';
import { logFocusSession, getBurnoutHistory } from '../controllers/burnoutController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.post('/log', logFocusSession);
router.get('/history', getBurnoutHistory);
export default router;
