import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api.js';
import PageHeader from '../components/common/PageHeader.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import toast from 'react-hot-toast';
import { fmtRelative } from '../utils/helpers.js';

const MIN_CHARS = 100;

function ScoreRing({ score }) {
  const color = score >= 70 ? '#22c55e' : score >= 50 ? '#3b82f6' : '#f59e0b';
  const r = 36, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 84 84" className="w-full h-full -rotate-90">
        <circle cx="42" cy="42" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle cx="42" cy="42" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-extrabold text-xl leading-none" style={{ color }}>{score}</span>
        <span className="text-slate-400 text-xs">/100</span>
      </div>
    </div>
  );
}

export default function FeynmanPage() {
  const [form, setForm]       = useState({ topic: '', subject: '', transcription: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [history, setHistory] = useState([]);
  const [tab, setTab]         = useState('analyze');

  const loadHistory = () => {
    api.get('/feynman/history')
      .then(r => setHistory(r.data.data || []))
      .catch(() => {});
  };

  useEffect(() => { loadHistory(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.topic.trim())         return toast.error('Topic is required');
    if (!form.transcription.trim()) return toast.error('Your explanation is required');
    if (form.transcription.trim().length < MIN_CHARS) {
      return toast.error(`Explanation too short — write at least ${MIN_CHARS} characters for a meaningful analysis`);
    }
    setLoading(true);
    try {
      const { data } = await api.post('/feynman/analyze', form);
      setResult(data.data);
      toast.success(`Analysis complete! Score: ${data.data.gapAnalysis.score}/100 · +${data.xpGained} XP`);
      loadHistory();
      setTab('result');
    } catch (err) {
      const msg = err.response?.data?.message || 'Analysis failed';
      toast.error(msg);
      if (err.response?.status === 500) {
        toast.error('Check GEMINI_API_KEY in your backend .env', { duration: 5000 });
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setForm({ topic: '', subject: '', transcription: '' });
    setTab('analyze');
  };

  const charCount   = form.transcription.length;
  const charOk      = charCount >= MIN_CHARS;
  const TABS = ['analyze', 'result', 'history'];

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <PageHeader
        icon="🧠"
        title="Feynman Gap Analysis"
        subtitle="Explain a concept in simple terms — Gemini AI finds your knowledge gaps"
      />

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto sm:inline-flex">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={[
              'flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors capitalize',
              tab === t ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}>
            {t === 'result' ? 'Last Result' : t === 'history' ? `History (${history.length})` : t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── ANALYZE ── */}
        {tab === 'analyze' && (
          <motion.div key="analyze"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="grid lg:grid-cols-2 gap-5">
            {/* Form */}
            <div className="card">
              <h3 className="section-title">Your Explanation</h3>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="label">Topic to explain *</label>
                  <input className="input" placeholder="e.g. Newton's Second Law"
                    value={form.topic}
                    onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">Subject <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input className="input" placeholder="e.g. Physics"
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                </div>
                <div>
                  <label className="label">
                    Your explanation *
                    <span className="text-slate-400 font-normal ml-1">(write as if teaching a 12-year-old)</span>
                  </label>
                  <textarea
                    rows={8}
                    className={['input resize-none transition-colors', !charOk && charCount > 0 ? 'border-amber-300 focus:ring-amber-300' : ''].join(' ')}
                    placeholder="Explain the concept in your own words without looking at notes. The more detail you write, the better the AI analysis…"
                    value={form.transcription}
                    onChange={e => setForm(f => ({ ...f, transcription: e.target.value }))}
                    required
                  />
                  <div className="flex justify-between mt-1">
                    <p className={['text-xs font-medium', charOk ? 'text-green-600' : charCount > 0 ? 'text-amber-600' : 'text-slate-400'].join(' ')}>
                      {charOk ? '✓ Good length for analysis' : charCount > 0 ? `${MIN_CHARS - charCount} more characters needed` : `Min ${MIN_CHARS} characters`}
                    </p>
                    <p className="text-xs text-slate-400">{charCount} chars</p>
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full" disabled={loading || !charOk}>
                  {loading ? '🔄 Gemini is analysing…' : '🔍 Analyse with Gemini AI'}
                </button>
              </form>
            </div>

            {/* How-to card */}
            <div className="card bg-blue-50 border-blue-100">
              <h3 className="section-title">The Feynman Technique</h3>
              {[
                ['1', 'Choose a concept', 'Pick any topic you want to understand deeply — from biology to maths.'],
                ['2', 'Explain it simply', 'Write your explanation without looking at notes. Pretend you\'re teaching a child.'],
                ['3', 'AI identifies gaps', 'Gemini finds exactly what\'s missing, vague, or incorrect in your explanation.'],
                ['4', 'Fill the gaps', 'Go back to your resources, then try again until your score improves.'],
              ].map(([n, t, d]) => (
                <div key={n} className="flex gap-3 mb-4 last:mb-0">
                  <div className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                    {n}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{t}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{d}</p>
                  </div>
                </div>
              ))}
              <div className="mt-4 bg-white rounded-xl p-3 border border-blue-100">
                <p className="text-xs text-blue-700 font-semibold">💡 Pro tip</p>
                <p className="text-xs text-slate-600 mt-0.5">A low score isn't failure — it's a map of exactly what to study next. That's the power of this technique!</p>
              </div>
              {history.length > 0 && (
                <div className="mt-3 bg-white rounded-xl p-3 border border-blue-100">
                  <p className="text-xs text-slate-500 font-semibold mb-1">📈 Your best score</p>
                  <p className="font-bold text-blue-700 text-lg">
                    {Math.max(...history.map(h => h.gapAnalysis?.score || 0))}/100
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── RESULT ── */}
        {tab === 'result' && (
          <motion.div key="result"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {result ? (
              <div className="space-y-4">
                {/* Score banner */}
                <div className="card">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                    <ScoreRing score={result.gapAnalysis.score} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h2 className="font-display font-bold text-slate-800">{result.topic}</h2>
                        {result.subject && <span className="badge-blue">{result.subject}</span>}
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">{result.gapAnalysis.overallAssessment}</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          result.gapAnalysis.score >= 70 ? 'bg-green-100 text-green-700' :
                          result.gapAnalysis.score >= 50 ? 'bg-blue-100 text-blue-700'   :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {result.gapAnalysis.score >= 70 ? '✓ Strong understanding' :
                           result.gapAnalysis.score >= 50 ? 'Room to improve' : 'Needs more study'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Gaps */}
                  <div className="card">
                    <h3 className="font-display font-bold text-rose-700 mb-3">
                      ⚠️ Knowledge Gaps ({result.gapAnalysis.gaps?.length || 0})
                    </h3>
                    {!result.gapAnalysis.gaps?.length ? (
                      <p className="text-muted text-sm">No significant gaps found — excellent explanation!</p>
                    ) : (
                      <div className="space-y-2">
                        {result.gapAnalysis.gaps?.map((g, i) => (
                          <div key={i} className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`badge-${g.severity === 'high' ? 'rose' : g.severity === 'medium' ? 'amber' : 'green'}`}>
                                {g.severity}
                              </span>
                              <span className="font-semibold text-slate-800 text-sm">{g.concept}</span>
                            </div>
                            <p className="text-xs text-slate-600">{g.explanation}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Strengths */}
                    <div className="card">
                      <h3 className="font-display font-bold text-green-700 mb-2">✅ Strengths</h3>
                      {result.gapAnalysis.strengths?.length ? (
                        <ul className="space-y-1.5">
                          {result.gapAnalysis.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <span className="text-green-500 mt-0.5 shrink-0">•</span>{s}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted text-sm">Keep going — strengths will emerge!</p>
                      )}
                    </div>
                    {/* Recommendations */}
                    <div className="card">
                      <h3 className="font-display font-bold text-blue-700 mb-2">💡 Next Steps</h3>
                      <ul className="space-y-1.5">
                        {result.gapAnalysis.recommendations?.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-blue-500 mt-0.5 shrink-0 font-bold">{i + 1}.</span>{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={reset} className="btn-secondary">← Analyse Another Topic</button>
                  <button onClick={() => setTab('history')} className="btn-ghost">View History</button>
                </div>
              </div>
            ) : (
              <EmptyState icon="🔍" title="No result yet"
                message="Run an analysis to see your results here."
                action={<button onClick={() => setTab('analyze')} className="btn-primary">Start Analysing</button>}
              />
            )}
          </motion.div>
        )}

        {/* ── HISTORY ── */}
        {tab === 'history' && (
          <motion.div key="history"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {history.length === 0 ? (
              <EmptyState icon="📚" title="No history yet"
                message="Your Feynman sessions will appear here after your first analysis."
                action={<button onClick={() => setTab('analyze')} className="btn-primary">Start Your First Analysis</button>}
              />
            ) : (
              <>
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: 'Total Sessions', value: history.length },
                    { label: 'Best Score',     value: Math.max(...history.map(h => h.gapAnalysis?.score || 0)) + '/100' },
                    { label: 'Avg Score',      value: Math.round(history.reduce((a, h) => a + (h.gapAnalysis?.score || 0), 0) / history.length) + '/100' },
                  ].map(({ label, value }) => (
                    <div key={label} className="card-sm text-center">
                      <div className="font-display font-bold text-xl text-slate-800">{value}</div>
                      <div className="text-xs text-slate-500">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {history.map(h => (
                    <div key={h._id}
                      className="card hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => { setResult(h); setTab('result'); }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-display font-bold text-slate-800 text-sm truncate flex-1 pr-2">{h.topic}</div>
                        <div className="font-extrabold text-lg shrink-0"
                          style={{ color: (h.gapAnalysis?.score || 0) >= 70 ? '#22c55e' : (h.gapAnalysis?.score || 0) >= 50 ? '#3b82f6' : '#f59e0b' }}>
                          {h.gapAnalysis?.score || 0}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{h.subject || 'General'} · {fmtRelative(h.createdAt)}</p>
                      <p className="text-xs text-slate-600 line-clamp-2">{h.gapAnalysis?.overallAssessment}</p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {h.gapAnalysis?.gaps?.slice(0, 2).map((g, i) => (
                          <span key={i} className={`badge-${g.severity === 'high' ? 'rose' : g.severity === 'medium' ? 'amber' : 'green'}`}>
                            {g.concept?.slice(0, 20)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
