import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { updateUser } from '../store/slices/authSlice.js';
import api from '../utils/api.js';
import PageHeader from '../components/common/PageHeader.jsx';
import toast from 'react-hot-toast';
import { fmtDate } from '../utils/helpers.js';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [leaderboard, setLeaderboard] = useState(null);
  const [lbLoading, setLbLoading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/analytics/dashboard').then(r => setStats(r.data.stats)).catch(() => {});
  }, []);

  const loadLB = async () => {
    setLbLoading(true);
    try {
      const r = await api.get('/users/leaderboard');
      setLeaderboard(r.data.leaderboard);
    } catch {
      toast.error('Could not load leaderboard');
    } finally {
      setLbLoading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name cannot be empty');
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', { name: name.trim() });
      dispatch(updateUser(data.user));
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  // Dynamic badges based on real user data
  const badges = [
    { icon: '🔥', label: 'Streak Master',  desc: '7+ day streak',      earned: (user?.streak || 0) >= 7   },
    { icon: '⚡', label: 'XP Hunter',      desc: '100+ XP earned',     earned: (user?.xp || 0) >= 100     },
    { icon: '🧠', label: 'Feynman Scholar',desc: '5+ analyses done',   earned: (stats?.feynmanAvgScore || 0) > 0 && (user?.xp || 0) >= 20 },
    { icon: '📝', label: 'Quiz Champion',  desc: '5+ quizzes done',    earned: (stats?.totalQuizzes || 0) >= 5 },
    { icon: '⏱',  label: 'Study Warrior',  desc: '1h+ total study',    earned: (user?.totalStudyTime || 0) >= 60 },
    { icon: '🎯', label: 'Goal Getter',    desc: 'All modules used',   earned: (user?.xp || 0) >= 500     },
  ];

  const earnedCount = badges.filter(b => b.earned).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader icon="👤" title="My Profile" subtitle="Manage your account and track your achievements" />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white font-bold text-2xl font-display shadow-lg shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-slate-900 text-lg truncate">{user?.name}</h2>
              <p className="text-slate-500 text-sm truncate">{user?.email}</p>
              <p className="text-xs text-slate-400 mt-0.5">Member since {user?.createdAt ? fmtDate(user.createdAt) : '—'}</p>
            </div>
          </div>

          <form onSubmit={save} className="space-y-3">
            <div>
              <label className="label">Display Name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input bg-slate-100 cursor-not-allowed" value={user?.email || ''} disabled />
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="space-y-4">
          <div className="card">
            <h3 className="section-title">Your Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total XP',     value: user?.xp || 0,                                                icon: '⚡', color: 'text-amber-600' },
                { label: 'Day Streak',   value: `${user?.streak || 0}d`,                                     icon: '🔥', color: 'text-orange-600' },
                { label: 'Study Time',   value: `${Math.round((user?.totalStudyTime || 0) / 60)}h`,          icon: '⏱', color: 'text-blue-600' },
                { label: 'Burnout Risk', value: (user?.cognitiveProfile?.burnoutRisk || 'low').toUpperCase(), icon: '😌', color: 'text-green-600' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="text-xl mb-1">{icon}</div>
                  <div className={`font-display font-bold text-lg ${color}`}>{value}</div>
                  <div className="text-xs text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="section-title mb-0">Achievements</h3>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                {earnedCount}/{badges.length} earned
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {badges.map(b => (
                <div
                  key={b.label}
                  title={b.desc}
                  className={`text-center p-3 rounded-xl border-2 transition-all ${
                    b.earned
                      ? 'bg-amber-50 border-amber-200 shadow-sm'
                      : 'bg-slate-50 border-slate-200 opacity-40 grayscale'
                  }`}
                >
                  <div className="text-2xl mb-1">{b.icon}</div>
                  <div className="text-xs font-semibold text-slate-700 leading-tight">{b.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5 leading-tight">{b.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Leaderboard */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title mb-0">🏆 Leaderboard</h3>
          {!leaderboard && (
            <button onClick={loadLB} className="btn-secondary text-sm py-1.5" disabled={lbLoading}>
              {lbLoading ? 'Loading…' : 'Load Rankings'}
            </button>
          )}
        </div>
        {leaderboard ? (
          <div className="space-y-2">
            {leaderboard.map((u, i) => (
              <div
                key={u._id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  u._id === user?._id ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'
                }`}
              >
                <span className="font-bold text-slate-600 w-6 text-center text-sm shrink-0">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </span>
                <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center font-bold text-blue-700 text-sm shrink-0">
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">
                    {u.name} {u._id === user?._id ? <span className="text-blue-500 font-normal">(you)</span> : ''}
                  </p>
                  <p className="text-xs text-slate-500">🔥 {u.streak || 0} day streak</p>
                </div>
                <span className="font-bold text-amber-600 text-sm shrink-0">⚡ {u.xp}</span>
              </div>
            ))}
          </div>
        ) : !lbLoading ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🏆</div>
            <p className="text-muted text-sm">Load the leaderboard to see how you rank</p>
          </div>
        ) : (
          <div className="flex justify-center py-8">
            <div className="flex gap-1.5">
              {[0,1,2].map(i => (
                <div key={i} className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: i * 0.15 + 's' }} />
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
