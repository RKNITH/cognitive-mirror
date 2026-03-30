import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { loginUser, clearError } from '../store/slices/authSlice.js';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(s => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => { dispatch(clearError()); }, []);

  const submit = async (e) => {
    e.preventDefault();
    const res = await dispatch(loginUser(form));
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Welcome back! 🎉');
      navigate('/dashboard');
    } else {
      toast.error(res.payload || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xl">
            <span className="text-white font-bold text-xl font-display">CM</span>
          </div>
          <h1 className="font-display font-extrabold text-slate-900 text-2xl">Cognitive Mirror</h1>
          <p className="text-slate-500 text-sm mt-1">AI-powered meta-learning ecosystem</p>
        </div>

        <div className="card">
          <h2 className="font-display font-bold text-slate-800 text-xl mb-5">Sign in to your account</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input type="email" className="input" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm px-3 py-2 rounded-xl">{error}</div>
            )}
            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">Create one</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
