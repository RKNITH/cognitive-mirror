import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
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

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

connectDB();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiLimiter);

// ─── Socket.IO: Real-time Focus Rooms ───────────────────────────────────────
const focusRooms = new Map(); // roomId => Map<socketId, participantData>

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join-room', ({ roomId, userId, username }) => {
    socket.join(roomId);
    if (!focusRooms.has(roomId)) focusRooms.set(roomId, new Map());
    focusRooms.get(roomId).set(socket.id, {
      userId, username, status: 'focusing', joinedAt: Date.now(),
    });
    io.to(roomId).emit('room-update', {
      participants: Array.from(focusRooms.get(roomId).values()),
    });
    console.log(`${username} joined room ${roomId}`);
  });

  socket.on('focus-status', ({ roomId, status }) => {
    const room = focusRooms.get(roomId);
    if (room && room.has(socket.id)) {
      room.get(socket.id).status = status;
      io.to(roomId).emit('room-update', {
        participants: Array.from(room.values()),
      });
    }
  });

  socket.on('send-message', ({ roomId, message, username }) => {
    io.to(roomId).emit('new-message', {
      message: message?.slice(0, 500),
      username,
      timestamp: Date.now(),
    });
  });

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;
      const room = focusRooms.get(roomId);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) {
          focusRooms.delete(roomId);
        } else {
          io.to(roomId).emit('room-update', {
            participants: Array.from(room.values()),
          });
        }
      }
    }
  });

  socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
});

// ─── API Routes ─────────────────────────────────────────────────────────────
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

app.get('/api/health', (req, res) => {
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

const PORT = parseInt(process.env.PORT) || 5000;
httpServer.listen(PORT, () => {
  console.log(`\n🧠 Cognitive Mirror API running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 CORS origin: ${process.env.CLIENT_URL || 'http://localhost:5173'}\n`);
});

export { io };
