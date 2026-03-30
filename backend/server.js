import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import bioRhythmRoutes from './routes/bioRhythm.js';
import feynmanRoutes from './routes/feynman.js';
import taxonomyRoutes from './routes/taxonomy.js';
import studyCommonsRoutes from './routes/studyCommons.js';
import burnoutRoutes from './routes/burnout.js';
import quizRoutes from './routes/quiz.js';
import analyticsRoutes from './routes/analytics.js';
import aiRoutes from './routes/ai.js';

// ─── Lazy DB connection (cached across warm invocations) ─────────────────────
// In serverless, top-level connectDB() would run on every cold start but the
// connection would be dropped between invocations. We cache it instead.
let isDBConnected = false;
const ensureDB = async () => {
  if (!isDBConnected) {
    await connectDB();
    isDBConnected = true;
  }
};

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── DB connection middleware (runs before every request) ────────────────────
// This ensures the DB is connected before any route handler runs,
// and reuses the existing connection on warm invocations.
app.use(async (req, res, next) => {
  try {
    await ensureDB();
    next();
  } catch (err) {
    console.error('DB connection failed:', err);
    res.status(503).json({ success: false, message: 'Database unavailable' });
  }
});

app.use('/api', apiLimiter);

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bio-rhythm', bioRhythmRoutes);
app.use('/api/feynman', feynmanRoutes);
app.use('/api/taxonomy', taxonomyRoutes);
app.use('/api/study-commons', studyCommonsRoutes);
app.use('/api/burnout', burnoutRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Cognitive Mirror API',
    version: '1.0.0',
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

// ─── Local dev only: start HTTP server when not on Vercel ───────────────────
// On Vercel, the file is imported as a module and `app` is the default export.
// Locally, we still want `node server.js` to work normally.
if (process.env.NODE_ENV !== 'production') {
  const PORT = parseInt(process.env.PORT) || 5000;
  app.listen(PORT, () => {
    console.log(`\n🧠 Cognitive Mirror API running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 CORS origin: ${process.env.CLIENT_URL || 'http://localhost:5173'}\n`);
  });
}

// ─── Vercel expects a default export of the Express app ─────────────────────
export default app;