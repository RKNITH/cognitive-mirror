import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from './store/slices/authSlice.js';
import Layout from './components/common/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import VerifyOTPPage from './pages/VerifyOTPPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import BioRhythmPage from './pages/BioRhythmPage.jsx';
import FeynmanPage from './pages/FeynmanPage.jsx';
import TaxonomyPage from './pages/TaxonomyPage.jsx';
import StudyCommonsPage from './pages/StudyCommonsPage.jsx';
import BurnoutPage from './pages/BurnoutPage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import AICoachPage from './pages/AICoachPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <span className="text-white font-bold text-lg font-display">CM</span>
        </div>
        <div className="flex gap-1.5 justify-center">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: i * 0.15 + 's' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Guard({ children }) {
  const token = useSelector(s => s.auth.token);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const dispatch = useDispatch();
  const { token, user } = useSelector(s => s.auth);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (token) dispatch(fetchMe()).finally(() => setReady(true));
    else setReady(true);
  }, []);

  if (!ready) return <Spinner />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route path="/verify-otp" element={<VerifyOTPPage />} />
      <Route path="/" element={<Guard><Layout /></Guard>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="bio-rhythm" element={<BioRhythmPage />} />
        <Route path="feynman" element={<FeynmanPage />} />
        <Route path="taxonomy" element={<TaxonomyPage />} />
        <Route path="study-commons" element={<StudyCommonsPage />} />
        <Route path="burnout" element={<BurnoutPage />} />
        <Route path="quiz" element={<QuizPage />} />
        <Route path="ai-coach" element={<AICoachPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}
