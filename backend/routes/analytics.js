import express from 'express';
import { getDashboardStats } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/dashboard', getDashboardStats);
export default router;
