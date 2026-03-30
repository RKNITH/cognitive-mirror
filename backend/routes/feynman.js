import express from 'express';
import { analyzeExplanation, getFeynmanHistory, getFeynmanById } from '../controllers/feynmanController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.post('/analyze', analyzeExplanation);
router.get('/history', getFeynmanHistory);
router.get('/:id', getFeynmanById);
export default router;
