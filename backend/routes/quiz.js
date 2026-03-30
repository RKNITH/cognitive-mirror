import express from 'express';
import { generateQuiz, submitQuiz, getQuizHistory, getQuizById } from '../controllers/quizController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.post('/generate', generateQuiz);
router.get('/history', getQuizHistory);
router.get('/:id', getQuizById);
router.post('/:id/submit', submitQuiz);
export default router;
