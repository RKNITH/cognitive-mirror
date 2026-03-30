import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api.js';
import { cleanOption } from '../utils/cleanOption.js';
import PageHeader from '../components/common/PageHeader.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import toast from 'react-hot-toast';
import { fmtRelative } from '../utils/helpers.js';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function QuizPage() {
  const [tab, setTab]             = useState('generate');
  const [genForm, setGenForm]     = useState({ subject: '', topic: '', difficulty: 'medium', numQuestions: 5 });
  const [generating, setGenerating] = useState(false);
  const [quiz, setQuiz]           = useState(null);
  const [answers, setAnswers]     = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]       = useState(null);
  const [history, setHistory]     = useState([]);
  const [viewingHistory, setViewingHistory] = useState(null);
  const startTime                 = useRef(Date.now());

  const loadHistory = () => {
    api.get('/quiz/history').then(r => setHistory(r.data.data || [])).catch(() => {});
  };
  useEffect(() => { loadHistory(); }, []);

  const generate = async (e) => {
    e.preventDefault();
    if (!genForm.subject.trim()) return toast.error('Subject is required');
    setGenerating(true);
    try {
      const { data } = await api.post('/quiz/generate', genForm);
      setQuiz(data.data);
      setAnswers({});
      setResult(null);
      startTime.current = Date.now();
      setTab('take');
      toast.success(`${data.data.totalQuestions} questions generated!`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate quiz';
      toast.error(msg);
      if (msg.includes('API') || err.response?.status === 502) {
        toast.error('Check your GEMINI_API_KEY in backend .env', { duration: 6000 });
      }
    } finally { setGenerating(false); }
  };

  const submitQuiz = async () => {
    const missing = quiz.questions.filter((_, i) => !answers[i]).length;
    if (missing > 0 && !window.confirm(`${missing} question${missing > 1 ? 's' : ''} unanswered. Submit anyway?`)) return;
    setSubmitting(true);
    const timeTaken = Math.round((Date.now() - startTime.current) / 1000);
    try {
      const { data } = await api.post(`/quiz/${quiz._id}/submit`, {
        answers: quiz.questions.map((_, i) => answers[i] || null),
        timeTaken,
      });
      setResult(data.data);
      toast.success(`${data.data.accuracy}% accuracy · +${data.xpEarned} XP 🎉`);
      loadHistory();
      setTab('result');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed');
    } finally { setSubmitting(false); }
  };

  const answered = Object.keys(answers).length;
  const total    = quiz?.questions?.length || 0;
  const progress = total ? (answered / total) * 100 : 0;

  const accuracyColor = (acc) =>
    acc >= 80 ? '#22c55e' : acc >= 60 ? '#3b82f6' : acc >= 40 ? '#f59e0b' : '#f43f5e';

  const TABS = [
    { id: 'generate', label: 'Generate' },
    { id: 'take',     label: quiz ? `Take (${answered}/${total})` : 'Take' },
    { id: 'result',   label: 'Result' },
    { id: 'history',  label: `History (${history.length})` },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <PageHeader icon="📝" title="AI Quiz Generator"
        subtitle="Gemini generates adaptive quizzes for any subject and difficulty level" />

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto sm:inline-flex flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={['flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors',
              tab === t.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'].join(' ')}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── GENERATE ── */}
        {tab === 'generate' && (
          <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="card">
                <h3 className="section-title">Configure Your Quiz</h3>
                <form onSubmit={generate} className="space-y-4">
                  <div>
                    <label className="label">Subject *</label>
                    <input className="input" placeholder="e.g. Organic Chemistry"
                      value={genForm.subject} onChange={e => setGenForm(f => ({...f, subject: e.target.value}))} required />
                  </div>
                  <div>
                    <label className="label">Topic <span className="text-slate-400 font-normal">(optional)</span></label>
                    <input className="input" placeholder="e.g. Reaction Mechanisms"
                      value={genForm.topic} onChange={e => setGenForm(f => ({...f, topic: e.target.value}))} />
                  </div>
                  <div>
                    <label className="label">Difficulty</label>
                    <div className="flex gap-2">
                      {['easy','medium','hard'].map(d => (
                        <button key={d} type="button" onClick={() => setGenForm(f => ({...f, difficulty: d}))}
                          className={['flex-1 py-2 text-sm font-semibold rounded-xl border transition-colors capitalize',
                            genForm.difficulty === d ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200'].join(' ')}>
                          {d === 'easy' ? '🟢 ' : d === 'medium' ? '🟡 ' : '🔴 '}{d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">
                      Questions: <span className="font-bold text-blue-600">{genForm.numQuestions}</span>
                    </label>
                    <input type="range" min="3" max="15" className="w-full accent-blue-600"
                      value={genForm.numQuestions} onChange={e => setGenForm(f => ({...f, numQuestions: parseInt(e.target.value)}))} />
                    <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                      <span>3</span><span>15</span>
                    </div>
                  </div>
                  <button type="submit" className="btn-primary w-full" disabled={generating}>
                    {generating ? '🤖 Gemini generating questions…' : '✨ Generate Quiz'}
                  </button>
                </form>
              </div>

              <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                <h3 className="section-title">Recent Scores</h3>
                {history.length === 0 ? (
                  <EmptyState icon="📊" title="No quizzes yet" message="Generate your first quiz to see scores here!" />
                ) : (
                  <div className="space-y-3">
                    {history.slice(0, 5).map(h => (
                      <div key={h._id} className="bg-white rounded-xl p-3 border border-blue-100 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">{h.subject}</p>
                          <p className="text-xs text-slate-500">{h.topic && h.topic !== h.subject ? h.topic + ' · ' : ''}{h.difficulty} · {fmtRelative(h.createdAt)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-lg" style={{color: accuracyColor(h.accuracy || 0)}}>{h.accuracy}%</div>
                          <div className="text-xs text-amber-600 font-semibold">+{h.xpEarned} XP</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── TAKE ── */}
        {tab === 'take' && (
          <motion.div key="take" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {!quiz ? (
              <EmptyState icon="📝" title="No quiz loaded" message="Generate a quiz first to answer questions."
                action={<button onClick={() => setTab('generate')} className="btn-primary">Generate Quiz</button>} />
            ) : (
              <div className="space-y-4">
                {/* Progress bar */}
                <div className="card-sm">
                  <div className="flex justify-between text-sm font-semibold text-slate-600 mb-2">
                    <span className="truncate">{quiz.subject} · {quiz.difficulty}</span>
                    <span className="shrink-0 ml-2">{answered}/{total} answered</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-blue-500 rounded-full"
                      animate={{ width: progress + '%' }} transition={{ duration: 0.3 }} />
                  </div>
                  {answered === total && total > 0 && (
                    <p className="text-xs text-green-600 font-semibold mt-1">✓ All answered — ready to submit!</p>
                  )}
                </div>

                {quiz.questions.map((q, i) => (
                  <motion.div key={i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                    className={['card border-2 transition-colors', answers[i] ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100'].join(' ')}>
                    <p className="font-semibold text-slate-800 mb-3 text-sm leading-relaxed">
                      <span className="text-blue-600 font-bold">Q{i+1}.</span> {q.question}
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {q.options.map((opt, j) => {
                        const letter = LETTERS[j];
                        const sel    = answers[i] === letter;
                        return (
                          <button key={j} type="button" onClick={() => setAnswers(a => ({...a, [i]: letter}))}
                            className={['text-left px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all',
                              sel ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50'].join(' ')}>
                            <span className="font-bold mr-1">{letter}.</span>{cleanOption(opt)}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}

                <button onClick={submitQuiz} className="btn-primary w-full py-3" disabled={submitting}>
                  {submitting ? 'Submitting…' : `Submit Quiz (${answered}/${total} answered)`}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── RESULT ── */}
        {tab === 'result' && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {!result ? (
              <EmptyState icon="🏆" title="No result yet" message="Complete a quiz to see detailed results."
                action={<button onClick={() => setTab('generate')} className="btn-primary">Generate Quiz</button>} />
            ) : (
              <div className="space-y-4">
                <div className="card text-center" style={{background:'linear-gradient(135deg,#eff6ff,#f0fdf4)'}}>
                  <div className="font-display font-extrabold text-6xl mb-1"
                    style={{color: accuracyColor(result.accuracy || 0)}}>
                    {result.accuracy}%
                  </div>
                  <p className="font-semibold text-slate-700">{result.score}/{result.totalQuestions} correct</p>
                  <p className="text-amber-600 font-bold text-lg mt-1">+{result.xpEarned} XP earned!</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {result.accuracy >= 80 ? '🌟 Excellent work!' :
                     result.accuracy >= 60 ? '👍 Good effort!' :
                     result.accuracy >= 40 ? '📚 Keep studying!' : '💪 Don\'t give up!'}
                  </p>
                  <div className="flex justify-center gap-2 mt-3 flex-wrap">
                    <span className="badge-slate">⏱ {Math.floor(result.timeTaken/60)}m {result.timeTaken%60}s</span>
                    <span className="badge-blue capitalize">{result.difficulty}</span>
                    <span className="badge-green">{result.subject}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {result.questions.map((q, i) => (
                    <div key={i} className={['card border-l-4', q.isCorrect ? 'border-l-green-500' : 'border-l-rose-500'].join(' ')}>
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-base shrink-0">{q.isCorrect ? '✅' : '❌'}</span>
                        <p className="font-semibold text-slate-800 text-sm">{q.question}</p>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-1.5">
                        {q.options.map((opt, j) => {
                          const letter = LETTERS[j];
                          const isCor  = letter === q.correctAnswer;
                          const isUsr  = letter === q.userAnswer;
                          return (
                            <div key={j} className={['px-3 py-2 rounded-xl text-xs font-medium border',
                              isCor           ? 'bg-green-50 border-green-300 text-green-800' :
                              isUsr && !isCor ? 'bg-rose-50 border-rose-300 text-rose-700'   :
                              'bg-slate-50 border-slate-200 text-slate-600'].join(' ')}>
                              <span className="font-bold mr-1">{letter}.</span>{cleanOption(opt)}
                              {isCor           && ' ✓'}
                              {isUsr && !isCor && ' ✗'}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setQuiz(null); setResult(null); setTab('generate'); }} className="btn-secondary flex-1">
                    ← New Quiz
                  </button>
                  <button onClick={() => setTab('history')} className="btn-ghost flex-1">
                    View History
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── HISTORY ── */}
        {tab === 'history' && (
          <motion.div key="hist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {history.length === 0 ? (
              <EmptyState icon="📚" title="No quiz history" message="Complete a quiz to build your history."
                action={<button onClick={() => setTab('generate')} className="btn-primary">Generate First Quiz</button>} />
            ) : (
              <div className="space-y-3">
                {history.map(h => (
                  <div key={h._id} className="card hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="min-w-0">
                        <div className="font-display font-bold text-slate-800 truncate">{h.subject}</div>
                        <p className="text-sm text-slate-500 capitalize">{h.topic} · {h.difficulty} · {fmtRelative(h.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className="font-bold text-2xl" style={{color: accuracyColor(h.accuracy || 0)}}>{h.accuracy}%</div>
                          <div className="text-xs text-slate-500">{h.score}/{h.totalQuestions}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-amber-600">+{h.xpEarned}</div>
                          <div className="text-xs text-slate-400">XP</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
