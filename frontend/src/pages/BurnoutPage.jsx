import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api.js';
import PageHeader from '../components/common/PageHeader.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import toast from 'react-hot-toast';
import { fmtRelative } from '../utils/helpers.js';

const RISK = {
  low:      { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  label: 'Low Risk',      emoji: '😊' },
  medium:   { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  label: 'Medium Risk',   emoji: '😐' },
  high:     { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', label: 'High Risk',     emoji: '😓' },
  critical: { bg: 'bg-rose-50',   border: 'border-rose-300',   text: 'text-rose-700',   label: 'Critical Risk', emoji: '🚨' },
};

const EMOTIONAL_STATES = ['focused','motivated','neutral','tired','stressed','anxious','burnt out'];

export default function BurnoutPage() {
  const [form, setForm] = useState({
    focusScore: 70, studyDuration: 120, breaksTaken: 2,
    productivityRating: 7, emotionalState: 'focused',
  });
  const [saving, setSaving] = useState(false);
  const [lastLog, setLastLog] = useState(null);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);

  const load = () => {
    api.get('/burnout/history?days=14').then(r => {
      setHistory(r.data.data || []);
      setSummary(r.data.summary);
      if (r.data.data?.[0]) setLastLog(r.data.data[0]);
    }).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/burnout/log', form);
      setLastLog(data.data);
      toast.success('Focus session logged! AI analysis complete.');
      if (data.data.riskLevel === 'critical') toast.error('🚨 Critical burnout risk — rest now!', { duration: 6000 });
      else if (data.data.riskLevel === 'high') toast.error('⚠️ High burnout risk — take a break!', { duration: 5000 });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log session');
    } finally { setSaving(false); }
  };

  const chartData = [...history].reverse().map((d, i) => ({
    d: 'D' + (i + 1), score: d.burnoutScore, focus: d.focusScore,
  }));
  const risk = lastLog ? (RISK[lastLog.riskLevel] || RISK.low) : null;

  // Parse recovery protocol into steps (it comes from AI as numbered steps)
  const recoverySteps = lastLog?.recoveryProtocol
    ? lastLog.recoveryProtocol
        .split(/\d+[\.\)]\s+/)
        .filter(s => s.trim().length > 5)
        .slice(0, 4)
    : [];

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <PageHeader icon="🔥" title="Predictive Burnout Detection"
        subtitle="Monitor cognitive fatigue and receive AI-driven smart recovery protocols" />

      {/* Risk banner */}
      {lastLog && risk && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={['card border', risk.bg, risk.border].join(' ')}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Current Burnout Status</p>
              <div className="flex items-baseline gap-2">
                <span className={['font-display font-extrabold text-4xl', risk.text].join(' ')}>{lastLog.burnoutScore}</span>
                <span className="text-slate-400 text-sm">/100</span>
                <span className="text-2xl">{risk.emoji}</span>
              </div>
              <span className={['text-xs font-bold px-2.5 py-1 rounded-full mt-1 inline-block border', risk.bg, risk.text, risk.border].join(' ')}>
                {risk.label}
              </span>
              <p className="text-xs text-slate-400 mt-1">{fmtRelative(lastLog.createdAt)}</p>
            </div>
            <div className="flex-1 min-w-0">
              {lastLog.aiInsights && (
                <p className="text-sm text-slate-700 mb-3 leading-relaxed">{lastLog.aiInsights}</p>
              )}
              {recoverySteps.length > 0 && (
                <div className="bg-white/70 rounded-xl p-3 border border-white">
                  <p className="text-xs font-bold text-slate-600 mb-2">🛡️ AI Recovery Protocol</p>
                  <ul className="space-y-1.5">
                    {recoverySteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className={['w-5 h-5 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0 mt-0.5',
                          lastLog.riskLevel === 'critical' ? 'bg-rose-500' :
                          lastLog.riskLevel === 'high' ? 'bg-orange-500' : 'bg-blue-500'
                        ].join(' ')}>{i + 1}</span>
                        {step.trim()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {recoverySteps.length === 0 && lastLog.recoveryProtocol && (
                <div className="bg-white/70 rounded-xl p-3 border border-white">
                  <p className="text-xs font-bold text-slate-600 mb-1">🛡️ AI Recovery Protocol</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{lastLog.recoveryProtocol}</p>
                </div>
              )}
            </div>
          </div>
          {lastLog.alerts?.map((a, i) => (
            <div key={i} className={[
              'mt-3 px-3 py-2 rounded-xl text-sm font-semibold',
              a.type === 'critical' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white',
            ].join(' ')}>
              {a.message}
            </div>
          ))}
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Form */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="card">
          <h3 className="section-title">Log Focus Session</h3>
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="label">
                Focus Score: <span className="font-bold text-blue-600">{form.focusScore}/100</span>
                <span className="ml-2 text-xs font-normal text-slate-400">
                  {form.focusScore >= 80 ? '🟢 Excellent' : form.focusScore >= 60 ? '🟡 Good' : form.focusScore >= 40 ? '🟠 Fair' : '🔴 Poor'}
                </span>
              </label>
              <input type="range" min="0" max="100" className="w-full accent-blue-600"
                value={form.focusScore} onChange={e => setForm(f => ({ ...f, focusScore: parseInt(e.target.value) }))} />
            </div>
            <div>
              <label className="label">
                Productivity: <span className="font-bold text-green-600">{form.productivityRating}/10</span>
              </label>
              <input type="range" min="1" max="10" className="w-full accent-green-600"
                value={form.productivityRating} onChange={e => setForm(f => ({ ...f, productivityRating: parseInt(e.target.value) }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Study Duration (min)</label>
                <input type="number" min="0" max="600" className="input"
                  value={form.studyDuration} onChange={e => setForm(f => ({ ...f, studyDuration: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="label">Breaks Taken</label>
                <input type="number" min="0" max="20" className="input"
                  value={form.breaksTaken} onChange={e => setForm(f => ({ ...f, breaksTaken: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div>
              <label className="label">Emotional State</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {EMOTIONAL_STATES.map(s => (
                  <button key={s} type="button"
                    onClick={() => setForm(f => ({ ...f, emotionalState: s }))}
                    className={['py-2 px-2 rounded-xl border-2 text-xs font-semibold transition-colors text-center capitalize',
                      form.emotionalState === s
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200',
                    ].join(' ')}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving ? '🤖 AI analysing burnout risk…' : '📊 Log Session & Get AI Analysis'}
            </button>
          </form>
        </motion.div>

        {/* Chart + Stats */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="card flex flex-col">
          <h3 className="section-title">14-Day Burnout Trend</h3>
          {summary && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { l: 'Avg Burnout',    v: summary.avgBurnout + '/100',                          color: summary.avgBurnout > 60 ? 'text-rose-600' : 'text-green-600' },
                { l: 'Current Risk',   v: (summary.currentRisk || 'low').toUpperCase(),          color: summary.currentRisk === 'low' ? 'text-green-600' : 'text-orange-600' },
                { l: 'Total Sessions', v: summary.totalSessions,                                 color: 'text-blue-600' },
              ].map(({ l, v, color }) => (
                <div key={l} className="text-center bg-slate-50 rounded-xl p-2">
                  <div className={`font-bold text-slate-800 text-sm ${color}`}>{v}</div>
                  <div className="text-xs text-slate-500">{l}</div>
                </div>
              ))}
            </div>
          )}
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="bG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="d" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Area type="monotone" dataKey="score" stroke="#f43f5e" strokeWidth={2} fill="url(#bG)" name="Burnout" />
                <Area type="monotone" dataKey="focus" stroke="#3b82f6" strokeWidth={1.5} fill="none" name="Focus" strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex-1 flex items-center justify-center py-8 text-center">
              <EmptyState icon="📉" title="No data yet" message="Log your first session to see trends" />
            </div>
          )}

          {/* Recent sessions */}
          {history.length > 0 && (
            <>
              <div className="divider" />
              <h4 className="font-semibold text-slate-700 text-sm mb-2">Recent Sessions</h4>
              <div className="space-y-2 overflow-y-auto max-h-40">
                {history.slice(0, 5).map((log, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{RISK[log.riskLevel]?.emoji || '😐'}</span>
                      <div>
                        <span className="text-xs font-semibold text-slate-700 capitalize">{log.riskLevel} risk</span>
                        <p className="text-xs text-slate-400">{log.studyDuration}min study · {fmtRelative(log.createdAt)}</p>
                      </div>
                    </div>
                    <span className={['font-bold text-sm', log.burnoutScore > 60 ? 'text-rose-600' : log.burnoutScore > 40 ? 'text-amber-600' : 'text-green-600'].join(' ')}>
                      {log.burnoutScore}/100
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
