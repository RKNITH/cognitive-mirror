import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api.js';
import PageHeader from '../components/common/PageHeader.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import toast from 'react-hot-toast';

const DEFAULT_FORM = {
  sleep:    { duration: 7, quality: 7, bedTime: '23:00', wakeTime: '06:30' },
  activity: { type: 'walking', duration: 30, intensity: 'medium' },
  mood: 7, stressLevel: 4,
  meals: [{ time: '08:00', type: 'breakfast', quality: 7 }],
};

const ACTIVITY_TYPES = ['walking','running','cycling','yoga','gym','swimming','sports','none'];

export default function BioRhythmPage() {
  const [form, setForm]       = useState(DEFAULT_FORM);
  const [saving, setSaving]   = useState(false);
  const [forecast, setForecast] = useState(null);
  const [history, setHistory]   = useState([]);
  const [lastLog, setLastLog]   = useState(null);

  const load = () => {
    api.get('/bio-rhythm/forecast').then(r => setForecast(r.data.forecast)).catch(() => {});
    api.get('/bio-rhythm/history').then(r => {
      const data = r.data.data || [];
      setHistory(data);
      if (data[0]) setLastLog(data[0]);
    }).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/bio-rhythm/log', form);
      toast.success('Bio data logged — AI forecast updated! 🧠');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const setS   = (k, v) => setForm(f => ({ ...f, sleep:    { ...f.sleep,    [k]: v } }));
  const setAct = (k, v) => setForm(f => ({ ...f, activity: { ...f.activity, [k]: v } }));

  const chartData = [...history].reverse().map((d, i) => ({
    day: 'D' + (i + 1), score: d.cognitiveScore || 70,
  }));

  const moodEmoji = (v) => v >= 8 ? '😄' : v >= 6 ? '🙂' : v >= 4 ? '😐' : '😔';
  const stressEmoji = (v) => v >= 8 ? '😰' : v >= 6 ? '😟' : v >= 4 ? '😐' : '😌';

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <PageHeader icon="🌙" title="Bio-Rhythm Engine"
        subtitle="Log lifestyle data for AI-powered cognitive performance forecasts" />

      {/* Forecast banner */}
      {forecast && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="shrink-0">
              <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Today's Cognitive Forecast</p>
              <div className="font-display font-extrabold text-4xl text-blue-700">
                {forecast.score}<span className="text-xl text-blue-400">/100</span>
              </div>
              <span className={[
                'text-xs font-bold px-2 py-1 rounded-full mt-1 inline-block',
                forecast.trend === 'improving' ? 'bg-green-100 text-green-700' :
                forecast.trend === 'declining' ? 'bg-rose-100 text-rose-700' :
                'bg-blue-100 text-blue-700',
              ].join(' ')}>
                {forecast.trend === 'improving' ? '↑ Improving' : forecast.trend === 'declining' ? '↓ Declining' : '→ Stable'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="h-2 bg-white rounded-full overflow-hidden mb-2">
                <motion.div className="h-full rounded-full bg-blue-500"
                  initial={{ width: 0 }} animate={{ width: forecast.score + '%' }} transition={{ duration: 1 }} />
              </div>
              {forecast.message && (
                <p className="text-xs text-slate-600 leading-relaxed">{forecast.message}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* AI Insight from last log */}
      {lastLog?.aiInsights && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="card bg-gradient-to-r from-violet-50 to-purple-50 border-violet-100">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center text-white text-sm shrink-0">🤖</div>
            <div>
              <p className="text-xs font-bold text-violet-600 mb-1">AI Coach Insight</p>
              <p className="text-sm text-slate-700 leading-relaxed">{lastLog.aiInsights}</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Form */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="card">
          <h3 className="section-title">Log Today's Data</h3>
          <form onSubmit={submit} className="space-y-4">

            {/* Sleep */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="font-bold text-slate-700 text-sm mb-3">😴 Sleep</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Duration (hrs)</label>
                  <input type="number" min="0" max="12" step="0.5" className="input"
                    value={form.sleep.duration}
                    onChange={e => setS('duration', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="label">
                    Quality: <span className="font-bold text-blue-600">{form.sleep.quality}/10</span>
                  </label>
                  <input type="range" min="1" max="10" className="w-full accent-blue-600 mt-2"
                    value={form.sleep.quality}
                    onChange={e => setS('quality', parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="label">Bed time</label>
                  <input type="time" className="input" value={form.sleep.bedTime}
                    onChange={e => setS('bedTime', e.target.value)} />
                </div>
                <div>
                  <label className="label">Wake time</label>
                  <input type="time" className="input" value={form.sleep.wakeTime}
                    onChange={e => setS('wakeTime', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Activity */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <p className="font-bold text-slate-700 text-sm mb-3">🏃 Activity</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.activity.type}
                    onChange={e => setAct('type', e.target.value)}>
                    {ACTIVITY_TYPES.map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Duration (min)</label>
                  <input type="number" min="0" max="300" className="input"
                    value={form.activity.duration}
                    onChange={e => setAct('duration', parseInt(e.target.value) || 0)} />
                </div>
                <div className="col-span-2">
                  <label className="label">Intensity</label>
                  <div className="flex gap-2">
                    {['low', 'medium', 'high'].map(lv => (
                      <button key={lv} type="button"
                        onClick={() => setAct('intensity', lv)}
                        className={[
                          'flex-1 py-2 text-sm font-semibold rounded-xl border transition-colors',
                          form.activity.intensity === lv
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-green-300',
                        ].join(' ')}>
                        {lv.charAt(0).toUpperCase() + lv.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Mood & Stress */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  {moodEmoji(form.mood)} Mood: <span className="font-bold text-blue-600">{form.mood}/10</span>
                </label>
                <input type="range" min="1" max="10" className="w-full accent-blue-600"
                  value={form.mood}
                  onChange={e => setForm(f => ({ ...f, mood: parseInt(e.target.value) }))} />
              </div>
              <div>
                <label className="label">
                  {stressEmoji(form.stressLevel)} Stress: <span className="font-bold text-rose-600">{form.stressLevel}/10</span>
                </label>
                <input type="range" min="1" max="10" className="w-full accent-rose-500"
                  value={form.stressLevel}
                  onChange={e => setForm(f => ({ ...f, stressLevel: parseInt(e.target.value) }))} />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving ? '🤖 Gemini generating forecast…' : '🧠 Log & Generate AI Forecast'}
            </button>
          </form>
        </motion.div>

        {/* Chart + History */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="card flex flex-col">
          <h3 className="section-title">Cognitive Score History</h3>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="cogA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} fill="url(#cogA)" name="Cognitive" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon="📊" title="No data yet" message="Log your first entry to see your cognitive trend" />
            </div>
          )}

          <div className="divider" />
          <h4 className="font-semibold text-slate-700 text-sm mb-2">Recent Logs</h4>
          <div className="space-y-2 overflow-y-auto max-h-52">
            {history.length === 0 && (
              <p className="text-muted text-xs text-center py-4">No logs yet — submit the form to get started!</p>
            )}
            {history.slice(0, 7).map((log, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <span className="text-xs font-semibold text-slate-700">
                    {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sleep {log.sleep?.duration}h · Mood {log.mood}/10 · Stress {log.stressLevel}/10
                  </p>
                </div>
                <div className="text-right">
                  <span className={[
                    'font-bold text-sm',
                    log.cognitiveScore >= 70 ? 'text-green-600' :
                    log.cognitiveScore >= 50 ? 'text-blue-600'  : 'text-amber-600',
                  ].join(' ')}>
                    {log.cognitiveScore}/100
                  </span>
                  <p className="text-xs text-slate-400">{log.activity?.activityType || log.activity?.type}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
