import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { generateOTP } from '../utils/helpers.js';
import { sendOTPEmail, sendWelcomeEmail } from '../utils/email.js';

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password)
      return res.status(400).json({ success: false, message: 'name, email and password are required' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing)
      return res.status(409).json({ success: false, message: 'Email already registered' });

    const otp = generateOTP();
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      otp,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000),
    });

    try { await sendOTPEmail(user.email, otp, user.name); }
    catch (e) { console.error('Email send error:', e.message); }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Check your email for a 6-digit OTP.',
      userId: user._id,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp)
      return res.status(400).json({ success: false, message: 'userId and otp are required' });

    const user = await User.findById(userId).select('+otp +otpExpires');
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isVerified)
      return res.status(400).json({ success: false, message: 'Email already verified' });
    if (!user.otp || user.otp !== otp.toString())
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (user.otpExpires < new Date())
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    try { await sendWelcomeEmail(user.email, user.name); } catch (e) {}

    const token = generateToken(user._id);
    res.json({ success: true, message: 'Email verified successfully!', token, user });
  } catch (error) {
    console.error('VerifyOTP error:', error);
    res.status(500).json({ success: false, message: 'Server error during OTP verification' });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId)
      return res.status(400).json({ success: false, message: 'userId is required' });

    const user = await User.findById(userId).select('+otp +otpExpires');
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isVerified)
      return res.status(400).json({ success: false, message: 'Email already verified' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOTPEmail(user.email, otp, user.name);
    res.json({ success: true, message: 'New OTP sent to your email.' });
  } catch (error) {
    console.error('ResendOTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend OTP' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    if (!user.isVerified)
      return res.status(403).json({ success: false, message: 'Please verify your email before logging in', userId: user._id });

    // Streak logic
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate).toDateString() : null;
    if (lastActive === yesterday) user.streak += 1;
    else if (lastActive !== today) user.streak = 1;
    user.lastActiveDate = new Date();
    await user.save();

    const token = generateToken(user._id);
    res.json({ success: true, message: 'Login successful', token, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

export const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};
