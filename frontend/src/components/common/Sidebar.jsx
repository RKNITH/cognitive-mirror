import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice.js';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/dashboard',     icon: '📊', label: 'Dashboard'        },
  { to: '/bio-rhythm',    icon: '🌙', label: 'Bio-Rhythm'       },
  { to: '/feynman',       icon: '🧠', label: 'Feynman Analysis' },
  { to: '/taxonomy',      icon: '🔍', label: 'Mistake Taxonomy' },
  { to: '/study-commons', icon: '👥', label: 'Study Commons'    },
  { to: '/burnout',       icon: '🔥', label: 'Burnout Detector' },
  { to: '/quiz',          icon: '📝', label: 'AI Quiz'          },
  { to: '/ai-coach',      icon: '🤖', label: 'AI Coach'         },
];

export default function Sidebar({ onClose }) {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { user }  = useSelector(s => s.auth);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out!');
    navigate('/login');
  };

  // Close sidebar immediately on nav click (mobile)
  const handleNav = () => {
    if (window.innerWidth < 1024) onClose?.();
  };

  return (
    <aside
      className="w-64 bg-white border-r border-slate-100 flex flex-col h-full"
      style={{ boxShadow: '1px 0 12px rgba(0,0,0,0.05)' }}
    >
      {/* Logo */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md shrink-0">
            <span className="text-white font-bold text-xs font-display">CM</span>
          </div>
          <div>
            <div className="font-display font-bold text-slate-900 text-sm leading-tight">Cognitive</div>
            <div className="font-display font-bold text-blue-600 text-sm leading-tight">Mirror</div>
          </div>
        </div>
        {/* Close button — only visible on mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Close sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* User chip */}
      {user && (
        <div className="mx-3 mt-3 px-3 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center font-bold text-blue-700 text-sm shrink-0">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{user.name}</p>
              <p className="text-xs text-blue-600 font-medium">⚡ {user.xp || 0} XP · 🔥 {user.streak || 0}d</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            onClick={handleNav}
            className={({ isActive }) =>
              isActive ? 'nav-item-active' : 'nav-item'
            }
          >
            <span className="text-base w-5 text-center shrink-0">{icon}</span>
            <span className="text-sm">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-slate-100 space-y-0.5">
        <NavLink
          to="/profile"
          onClick={handleNav}
          className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}
        >
          <span className="text-base w-5 text-center shrink-0">👤</span>
          <span className="text-sm">Profile</span>
        </NavLink>
        <button onClick={handleLogout} className="nav-item text-rose-500 hover:bg-rose-50 hover:text-rose-600">
          <span className="text-base w-5 text-center shrink-0">🚪</span>
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
