import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api.js';
import PageHeader from '../components/common/PageHeader.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import toast from 'react-hot-toast';
import { categoryLabel, categoryBadge, fmtRelative } from '../utils/helpers.js';

const CATS = [
  { value: 'knowledge_gap',    label: 'Knowledge Gap',    desc: 'Missing or incorrect factual knowledge', icon: '📚', color: 'rose'   },
  { value: 'processing_error', label: 'Processing Error', desc: 'Understood but applied incorrectly',      icon: '⚙️', color: 'amber'  },
  { value: 'cognitive_slip',   label: 'Cognitive Slip',   desc: 'Knew it but made a careless mistake',     icon: '🧩', color: 'blue'   },
];

export default function TaxonomyPage() {
  const [tab, setTab]         = useState('log');
  const [form, setForm]       = useState({ subject: '', topic: '', question: '', userAnswer: '', correctAnswer: '', category: '' });
  const [saving, setSaving]   = useState(false);
  const [profile, setProfile] = useState(null);
  const [mistakes, setMistakes] = useState([]);
  const [filter, setFilter]   = useState({ resolved: 'false', category: '' });
  const [expanded, setExpanded] = useState(null);

  const loadProfile = () => {
    api.get('/taxonomy/profile').then(r => setProfile(r.data.profile)).catch(() => {});
  };

  const loadMistakes = () => {
    const p = new URLSearchParams();
    if (filter.resolved !== '') p.append('resolved', filter.resolved);
    if (filter.category)        p.append('category', filter.category);
    api.get('/taxonomy/mistakes?' + p.toString()).then(r => setMistakes(r.data.data || [])).catch(() => {});
  };

  useEffect(() => { loadProfile(); }, []);
  useEffect(() => { loadMistakes(); }, [filter]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.category) return toast.error('Select a mistake category');
    setSaving(true);
    try {
      const { data } = await api.post('/taxonomy/mistake', form);
      toast.success(data.isRecurring ? '⚠️ Recurring mistake noted! Keep an eye on this one.' : '✅ Mistake logged & AI analysed!');
      setForm({ subject: '', topic: '', question: '', userAnswer: '', correctAnswer: '', category: '' });
      loadProfile();
      loadMistakes();
      setTab('mistakes');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log mistake');
    } finally { setSaving(false); }
  };

  const resolve = async (id) => {
    try {
      await api.patch('/taxonomy/mistake/' + id + '/resolve');
      toast.success('Mistake resolved! +5 XP 🎉');
      loadMistakes();
      loadProfile();
    } catch { toast.error('Failed to resolve'); }
  };

  const topSubject = profile?.bySubject
    ? Object.entries(profile.bySubject).sort(([,a],[,b]) => b - a)[0]?.[0]
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <PageHeader icon="🔍" title="Mistake Taxonomy"
        subtitle="Categorise errors and get AI-driven improvement strategies" />

      {/* Profile strip */}
      {profile && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Mistakes',   value: profile.total,                        bg: 'bg-slate-50',  color: 'text-slate-800' },
            { label: 'Knowledge Gaps',   value: profile.byCategory.knowledge_gap,     bg: 'bg-rose-50',   color: 'text-rose-700'  },
            { label: 'Processing Errs',  value: profile.byCategory.processing_error,  bg: 'bg-amber-50',  color: 'text-amber-700' },
            { label: 'Cognitive Slips',  value: profile.byCategory.cognitive_slip,    bg: 'bg-blue-50',   color: 'text-blue-700'  },
          ].map(({ label, value, bg, color }) => (
            <div key={label} className={`card-sm ${bg} text-center`}>
              <div className={`font-display font-bold text-2xl ${color}`}>{value}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Weak area nudge */}
      {topSubject && profile?.total > 2 && (
        <div className="card-sm bg-amber-50 border border-amber-100 flex items-center gap-3">
          <span className="text-2xl shrink-0">⚠️</span>
          <div>
            <p className="font-semibold text-amber-800 text-sm">Most mistakes in: <span className="font-bold">{topSubject}</span></p>
            <p className="text-xs text-amber-700">Focus extra revision time here — you have {profile.bySubject[topSubject]} logged mistakes.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto sm:inline-flex">
        {[
          { id: 'log',      label: 'Log Mistake' },
          { id: 'mistakes', label: `View Mistakes${mistakes.length > 0 ? ` (${mistakes.length})` : ''}` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={['flex-1 sm:flex-none px-5 py-1.5 rounded-lg text-sm font-semibold transition-colors',
              tab === t.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'].join(' ')}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'log' && (
          <motion.div key="log" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <div className="grid lg:grid-cols-2 gap-5">
              <div className="card">
                <h3 className="section-title">Log a Mistake</h3>
                <form onSubmit={submit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Subject *</label>
                      <input className="input" placeholder="e.g. Mathematics"
                        value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="label">Topic <span className="text-slate-400 font-normal">(optional)</span></label>
                      <input className="input" placeholder="e.g. Integration"
                        value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Question / Task *</label>
                    <textarea rows={2} className="input resize-none" placeholder="What was the question or task?"
                      value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} required />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Your answer <span className="text-slate-400 font-normal">(optional)</span></label>
                      <input className="input" placeholder="What you answered"
                        value={form.userAnswer} onChange={e => setForm(f => ({ ...f, userAnswer: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Correct answer <span className="text-slate-400 font-normal">(optional)</span></label>
                      <input className="input" placeholder="The right answer"
                        value={form.correctAnswer} onChange={e => setForm(f => ({ ...f, correctAnswer: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Category * <span className="text-slate-400 font-normal">(Gemini will analyse based on this)</span></label>
                    <div className="space-y-2">
                      {CATS.map(c => (
                        <button key={c.value} type="button"
                          onClick={() => setForm(f => ({ ...f, category: c.value }))}
                          className={[
                            'w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-colors',
                            form.category === c.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-blue-200 bg-white',
                          ].join(' ')}>
                          <span className="text-xl mt-0.5 shrink-0">{c.icon}</span>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{c.label}</p>
                            <p className="text-xs text-slate-500">{c.desc}</p>
                          </div>
                          {form.category === c.value && (
                            <span className="ml-auto text-blue-600 font-bold shrink-0">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="btn-primary w-full" disabled={saving}>
                    {saving ? '🤖 Gemini analysing mistake…' : '📌 Log Mistake & Get AI Analysis'}
                  </button>
                </form>
              </div>

              {/* Subject breakdown */}
              <div className="space-y-4">
                {profile && Object.keys(profile.bySubject || {}).length > 0 ? (
                  <div className="card">
                    <h3 className="section-title">Mistakes by Subject</h3>
                    <div className="space-y-3">
                      {Object.entries(profile.bySubject)
                        .sort(([,a],[,b]) => b - a)
                        .map(([subj, count]) => (
                          <div key={subj}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-semibold text-slate-700">{subj}</span>
                              <span className="text-sm text-slate-500">{count} mistake{count > 1 ? 's' : ''}</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div className="h-full bg-blue-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: Math.min(100, (count / profile.total) * 100) + '%' }}
                                transition={{ duration: 0.7 }} />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="card bg-slate-50 border-dashed">
                    <EmptyState icon="📊" title="No data yet" message="Log your first mistake to see subject breakdown" />
                  </div>
                )}

                <div className="card bg-blue-50 border-blue-100">
                  <h4 className="font-semibold text-blue-800 text-sm mb-2">💡 How AI Analysis Works</h4>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    When you log a mistake, Gemini analyses the category, subject, and your answer to generate a specific improvement strategy. The more detail you provide, the better the analysis.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'mistakes' && (
          <motion.div key="mistakes" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <select className="input w-auto text-sm"
                  value={filter.resolved}
                  onChange={e => setFilter(f => ({ ...f, resolved: e.target.value }))}>
                  <option value="false">🔴 Unresolved</option>
                  <option value="true">✅ Resolved</option>
                  <option value="">All</option>
                </select>
                <select className="input w-auto text-sm"
                  value={filter.category}
                  onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}>
                  <option value="">All categories</option>
                  {CATS.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                </select>
              </div>

              {mistakes.length === 0 ? (
                <EmptyState icon="✅" title="No mistakes here!"
                  message={filter.resolved === 'false' ? "Great job — all resolved! Try changing the filter." : "Try changing the filter."}
                  action={<button onClick={() => setTab('log')} className="btn-primary">Log a Mistake</button>}
                />
              ) : (
                <div className="space-y-3">
                  {mistakes.map(m => (
                    <motion.div key={m._id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="card hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setExpanded(expanded === m._id ? null : m._id)}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={categoryBadge(m.category)}>{categoryLabel(m.category)}</span>
                            <span className={`badge-${m.severity === 'high' ? 'rose' : m.severity === 'medium' ? 'amber' : 'green'}`}>
                              {m.severity}
                            </span>
                            {m.recurrence > 1 && (
                              <span className="badge-rose">⚠️ Recurring ×{m.recurrence}</span>
                            )}
                          </div>
                          <p className="font-semibold text-slate-800 text-sm">{m.question}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{m.subject}{m.topic ? ` · ${m.topic}` : ''} · {fmtRelative(m.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!m.resolved ? (
                            <button
                              onClick={e => { e.stopPropagation(); resolve(m._id); }}
                              className="btn-secondary text-xs py-1.5 px-3">
                              ✓ Resolve
                            </button>
                          ) : (
                            <span className="badge-green">✓ Resolved</span>
                          )}
                          <span className="text-slate-400 text-sm">{expanded === m._id ? '▲' : '▼'}</span>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expanded === m._id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-slate-100 space-y-2 overflow-hidden">
                            {m.aiAnalysis && (
                              <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">AI Analysis</p>
                                <p className="text-sm text-slate-700">{m.aiAnalysis}</p>
                              </div>
                            )}
                            {m.improvementStrategy && (
                              <div className="bg-blue-50 px-3 py-2.5 rounded-xl border border-blue-100">
                                <p className="text-xs font-bold text-blue-600 mb-1">💡 Improvement Strategy</p>
                                <p className="text-sm text-slate-700">{m.improvementStrategy}</p>
                              </div>
                            )}
                            {m.userAnswer && (
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-rose-50 rounded-lg px-2.5 py-2 border border-rose-100">
                                  <p className="font-bold text-rose-600 mb-0.5">Your answer</p>
                                  <p className="text-slate-700">{m.userAnswer}</p>
                                </div>
                                {m.correctAnswer && (
                                  <div className="bg-green-50 rounded-lg px-2.5 py-2 border border-green-100">
                                    <p className="font-bold text-green-600 mb-0.5">Correct answer</p>
                                    <p className="text-slate-700">{m.correctAnswer}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
