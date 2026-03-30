import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api.js';
import PageHeader from '../components/common/PageHeader.jsx';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const STARTERS = [
  'How do I overcome exam anxiety?',
  'What is the best way to use spaced repetition?',
  'I feel burned out — what should I do?',
  'Help me create a study schedule for finals week',
  'How can I improve my focus during long study sessions?',
  'Explain the Pomodoro Technique',
];

function TypingDots() {
  return (
    <div className="flex gap-1.5 items-center px-4 py-3">
      {[0,1,2].map(i => (
        <div key={i} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
          style={{ animationDelay: i * 0.15 + 's' }} />
      ))}
    </div>
  );
}

export default function AICoachPage() {
  const { user } = useSelector(s => s.auth);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your Cognitive Mirror AI Coach.\n\nI can help you with study strategies, burnout prevention, memory techniques, and meta-learning. What's on your mind today?`
    }
  ]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setError(null);
    const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
    setMessages(m => [...m, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', { message: msg, history });
      setMessages(m => [...m, { role: 'assistant', content: data.response }]);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'AI unavailable';
      setError(errMsg);
      // Show helpful error if API key issue
      const hint = errMsg.includes('API') || errMsg.includes('key') || err.response?.status === 500
        ? 'Check that GEMINI_API_KEY is set correctly in your backend .env file.'
        : 'Please try again.';
      setMessages(m => [...m, {
        role: 'assistant',
        content: `Sorry, I ran into an issue. ${hint}`,
        isError: true
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your Cognitive Mirror AI Coach.\n\nI can help you with study strategies, burnout prevention, memory techniques, and meta-learning. What's on your mind today?`
    }]);
    setError(null);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="flex items-center justify-between mb-4">
        <PageHeader icon="🤖" title="AI Coach" subtitle="Powered by Gemini — your personalised meta-learning coach" />
        {messages.length > 1 && (
          <button onClick={clearChat} className="btn-secondary text-xs py-1.5 shrink-0 mb-6">
            Clear chat
          </button>
        )}
      </div>

      {/* Chat window */}
      <div className="card flex-1 flex flex-col overflow-hidden p-0">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2.5 max-w-[85%] sm:max-w-lg ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 font-bold ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : m.isError
                        ? 'bg-rose-100 text-rose-600'
                        : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                  }`}>
                    {m.role === 'user' ? (user?.name?.[0] || 'U') : '🤖'}
                  </div>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-md'
                      : m.isError
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 rounded-tl-md'
                        : 'bg-slate-100 text-slate-800 rounded-tl-md'
                  }`}>
                    {m.content}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-sm">🤖</div>
                <div className="bg-slate-100 rounded-2xl rounded-tl-md">
                  <TypingDots />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Starters */}
        {messages.length <= 1 && (
          <div className="px-5 pb-3">
            <p className="text-xs text-slate-400 font-semibold mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map(s => (
                <button key={s} onClick={() => send(s)} disabled={loading}
                  className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors font-medium disabled:opacity-50">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-slate-100">
          {error && (
            <p className="text-xs text-rose-500 mb-2 px-1">⚠️ {error}</p>
          )}
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              className="input flex-1 resize-none"
              placeholder="Ask your AI coach anything… (Enter to send)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
              style={{ minHeight: '42px', maxHeight: '120px' }}
            />
            <button
              onClick={() => send()}
              className="btn-primary px-5 shrink-0"
              disabled={loading || !input.trim()}
            >
              {loading ? '…' : '↑'}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 px-1">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
