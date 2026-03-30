import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api.js';
import StatCard from '../components/common/StatCard.jsx';

const MODULES = [
  { to:'/bio-rhythm',    icon:'🌙', title:'Bio-Rhythm Engine',   desc:'Track sleep, meals & activity for cognitive forecasts', bg:'#eff6ff', border:'#bfdbfe' },
  { to:'/feynman',       icon:'🧠', title:'Feynman Analysis',    desc:'Record explanations — Gemini identifies your gaps',     bg:'#f0fdf4', border:'#bbf7d0' },
  { to:'/taxonomy',      icon:'🔍', title:'Mistake Taxonomy',    desc:'Categorise errors and build improvement strategies',    bg:'#fffbeb', border:'#fde68a' },
  { to:'/study-commons', icon:'👥', title:'Study Commons',       desc:'Real-time body-doubling focus rooms with XP rewards',   bg:'#fdf4ff', border:'#e9d5ff' },
  { to:'/burnout',       icon:'🔥', title:'Burnout Detector',    desc:'Monitor fatigue and trigger AI recovery protocols',     bg:'#fff1f2', border:'#fecdd3' },
  { to:'/quiz',          icon:'📝', title:'AI Quiz',             desc:'Gemini-generated adaptive assessments earn you XP',     bg:'#f0fdfa', border:'#99f6e4' },
];

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="w-10 h-10 bg-slate-100 rounded-xl mb-3" />
      <div className="h-7 bg-slate-100 rounded w-20 mb-1" />
      <div className="h-4 bg-slate-100 rounded w-28" />
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useSelector(s => s.auth);
  const [stats, setStats]       = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/dashboard').then(r => setStats(r.data.stats)).catch(() => {}),
      api.get('/bio-rhythm/forecast').then(r => setForecast(r.data.forecast)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const cogData  = stats?.cognitiveTimeline?.slice().reverse().map((d,i) => ({ i:'D'+(i+1), v:d.score })) || [];
  const burnData = stats?.burnoutTimeline  ?.slice().reverse().map((d,i) => ({ i:'D'+(i+1), v:d.score })) || [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* Welcome banner */}
      <motion.div initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}}
        className="rounded-2xl p-5 lg:p-6 text-white relative overflow-hidden"
        style={{background:'linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)'}}>
        <div className="absolute inset-0 opacity-10"
          style={{backgroundImage:'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)'}} />
        <h1 className="font-display font-extrabold text-xl lg:text-2xl mb-1 relative">
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-blue-200 text-sm relative">
          {forecast
            ? `Today's cognitive forecast: ${forecast.score}/100 — trend is ${forecast.trend}`
            : 'Log your lifestyle data to unlock your personalised cognitive forecast.'}
        </p>
        <div className="flex flex-wrap gap-2 mt-4 relative">
          <Link to="/bio-rhythm" className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            Log Today's Data →
          </Link>
          <Link to="/ai-coach" className="bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            Chat with AI Coach
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {loading ? (
          [0,1,2,3].map(i => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard title="XP Points"       value={user?.xp || 0}                  icon="⚡" color="amber" delay={0}    subtitle="Earned through learning"  />
            <StatCard title="Study Streak"    value={(user?.streak || 0) + 'd'}       icon="🔥" color="rose"  delay={0.05} subtitle="Consecutive days active"  />
            <StatCard title="Cognitive Score" value={stats?.avgCognitiveScore || '—'} icon="🧠" color="blue"  delay={0.1}  subtitle="7-day average"            />
            <StatCard title="Quizzes Done"    value={stats?.totalQuizzes || 0}        icon="📝" color="green" delay={0.15} subtitle="AI-generated sessions"    />
          </>
        )}
      </div>

      {/* Charts — only show if there is real data */}
      {(cogData.length > 1 || burnData.length > 1) && (
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { title:'Cognitive Score', data:cogData,  color:'#3b82f6', grad:'cogG' },
            { title:'Burnout Score',   data:burnData, color:'#f43f5e', grad:'brnG' },
          ].filter(c => c.data.length > 1).map(({ title, data, color, grad }) => (
            <motion.div key={title} initial={{opacity:0}} animate={{opacity:1}} className="card">
              <h3 className="font-display font-bold text-slate-800 mb-3 text-sm">{title} — Last {data.length} Days</h3>
              <ResponsiveContainer width="100%" height={130}>
                <AreaChart data={data} margin={{top:4,right:4,bottom:0,left:-20}}>
                  <defs>
                    <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={color} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={color} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="i" tick={{fontSize:10,fill:'#94a3b8'}} />
                  <YAxis domain={[0,100]} tick={{fontSize:10,fill:'#94a3b8'}} />
                  <Tooltip contentStyle={{borderRadius:'10px',border:'1px solid #e2e8f0',fontSize:'12px'}} />
                  <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={'url(#'+grad+')'} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          ))}
        </div>
      )}

      {/* No data nudge — show only when user has no bio data */}
      {!loading && cogData.length <= 1 && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}}
          className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 flex flex-col sm:flex-row items-center gap-4">
          <div className="text-4xl shrink-0">📊</div>
          <div className="flex-1 text-center sm:text-left">
            <p className="font-display font-bold text-slate-800">Your charts will appear here</p>
            <p className="text-slate-500 text-sm mt-0.5">Start logging your bio-rhythm and burnout data to see trends over time.</p>
          </div>
          <Link to="/bio-rhythm" className="btn-primary shrink-0">Start Logging →</Link>
        </motion.div>
      )}

      {/* Modules */}
      <div>
        <h2 className="font-display font-bold text-slate-800 mb-3">Learning Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map(({ to, icon, title, desc, bg, border }, i) => (
            <motion.div key={to} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}>
              <Link to={to}
                className="block card hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group"
                style={{background:bg, borderColor:border}}>
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-display font-bold text-slate-800 text-sm mb-1 group-hover:text-blue-700 transition-colors">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick summary — only when stats exist */}
      {stats && (stats.unresolvedMistakes > 0 || stats.feynmanAvgScore > 0 || stats.avgBurnoutScore > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon:'⚠️', label:'Unresolved Mistakes', value: stats.unresolvedMistakes || 0,                                     bg:'#fff1f2', show: stats.unresolvedMistakes > 0 },
            { icon:'🎯', label:'Feynman Avg Score',   value: (stats.feynmanAvgScore   || 0) + '/100',                           bg:'#eff6ff', show: stats.feynmanAvgScore > 0 },
            { icon:'😓', label:'Avg Burnout Score',   value: (stats.avgBurnoutScore   || 0) + '/100',                           bg:'#fffbeb', show: stats.avgBurnoutScore > 0 },
          ].filter(s => s.show).map(({ icon, label, value, bg }) => (
            <div key={label} className="card-sm flex items-center gap-3" style={{background:bg}}>
              <span className="text-2xl shrink-0">{icon}</span>
              <div>
                <div className="font-bold text-slate-800">{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
