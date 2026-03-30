import express from 'express';
import { updateProfile, getLeaderboard, getUserStats } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.put('/profile', updateProfile);
router.get('/leaderboard', getLeaderboard);
router.get('/stats', getUserStats);
export default router;
