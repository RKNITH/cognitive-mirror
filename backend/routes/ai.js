import express from 'express';
import { chatWithAI, getRecommendations } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.post('/chat', chatWithAI);
router.post('/recommendations', getRecommendations);
export default router;
