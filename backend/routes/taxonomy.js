import express from 'express';
import { logMistake, getMistakeProfile, getMistakes, resolveMistake } from '../controllers/taxonomyController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.post('/mistake', logMistake);
router.get('/profile', getMistakeProfile);
router.get('/mistakes', getMistakes);
router.patch('/mistake/:id/resolve', resolveMistake);
export default router;
