import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const TITLES = {
  '/dashboard':     'Dashboard',
  '/bio-rhythm':    'Bio-Rhythm Engine',
  '/feynman':       'Feynman Gap Analysis',
  '/taxonomy':      'Mistake Taxonomy',
  '/study-commons': 'Study Commons',
  '/burnout':       'Burnout Detector',
  '/quiz':          'AI Quiz Generator',
  '/ai-coach':      'AI Coach',
  '/profile':       'My Profile',
};

export default function TopBar({ onMenuClick }) {
  const { pathname } = useLocation();
  const { user }     = useSelector(s => s.auth);
  const title        = TITLES[pathname] || 'Cognitive Mirror';

  return (
    <header
      className="bg-white border-b border-slate-100 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-10"
      style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger — only on mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div>
          <h2 className="font-display font-bold text-slate-900 text-sm lg:text-base leading-tight">{title}</h2>
          <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {user && (
        <div className="flex items-center gap-2">
          <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2 py-1 rounded-lg border border-amber-100">
            ⚡ {user.xp || 0}
          </span>
          <span className="bg-orange-50 text-orange-700 text-xs font-bold px-2 py-1 rounded-lg border border-orange-100 hidden sm:inline">
            🔥 {user.streak || 0}d
          </span>
        </div>
      )}
    </header>
  );
}
