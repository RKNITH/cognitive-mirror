import express from 'express';
import { logBioData, getBioHistory, getCognitiveForecast } from '../controllers/bioRhythmController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.post('/log', logBioData);
router.get('/history', getBioHistory);
router.get('/forecast', getCognitiveForecast);
export default router;
