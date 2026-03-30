import express from 'express';
import { register, verifyOTP, resendOTP, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();
router.post('/register', authLimiter, register);
router.post('/verify-otp', authLimiter, verifyOTP);
router.post('/resend-otp', authLimiter, resendOTP);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
export default router;
