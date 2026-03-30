import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { verifyOTP } from '../store/slices/authSlice.js';
import api from '../utils/api.js';
import toast from 'react-hot-toast';

export default function VerifyOTPPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pendingUserId, loading } = useSelector(s => s.auth);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const refs = useRef([]);

  const handleKey = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleBackspace = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) return toast.error('Enter the complete 6-digit code');
    if (!pendingUserId) return toast.error('Session expired. Please register again.');
    const res = await dispatch(verifyOTP({ userId: pendingUserId, otp: code }));
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Email verified! Welcome 🎉');
      navigate('/dashboard');
    } else {
      toast.error(res.payload || 'Invalid OTP');
    }
  };

  const resend = async () => {
    if (!pendingUserId) return toast.error('No pending verification found');
    try {
      await api.post('/auth/resend-otp', { userId: pendingUserId });
      toast.success('New OTP sent to your email');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to resend');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="card text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="font-display font-bold text-slate-900 text-xl mb-1">Check your inbox</h2>
          <p className="text-muted mb-6">Enter the 6-digit code we sent to your email address.</p>

          <form onSubmit={submit}>
            <div className="flex gap-2 justify-center mb-6">
              {digits.map((d, i) => (
                <input key={i} ref={el => refs.current[i] = el} maxLength={1} value={d}
                  onChange={e => handleKey(i, e.target.value)}
                  onKeyDown={e => handleBackspace(i, e)}
                  className="w-11 h-12 text-center text-xl font-bold font-mono border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none bg-slate-50 transition-colors" />
              ))}
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify Email'}
            </button>
          </form>

          <button onClick={resend} className="mt-4 text-blue-600 text-sm font-semibold hover:underline">
            Resend code
          </button>
        </div>
      </motion.div>
    </div>
  );
}
