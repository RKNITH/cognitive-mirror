# 🧠 Cognitive Mirror — AI-Powered Meta-Learning Ecosystem

A full-stack MERN application with Google Gemini AI integration.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Google Gemini API key ([get free key](https://aistudio.google.com/app/apikey))
- Brevo SMTP account (free tier: 300 emails/day)

### 1. Clone & Setup

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your actual values

# Frontend
cd ../frontend
cp .env.example .env
# Edit VITE_API_URL if needed
```

### 3. Run Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open http://localhost:5173

---

## 🏗 Architecture

```
cognitive-mirror/
├── backend/
│   ├── config/          # DB + Gemini AI config
│   ├── controllers/     # Business logic (10 controllers)
│   ├── middleware/       # Auth, rate limiting, error handling
│   ├── models/          # 7 Mongoose schemas
│   ├── routes/          # 10 Express route files
│   ├── utils/           # Email, JWT, helpers
│   └── server.js        # Express + Socket.IO entry point
└── frontend/
    ├── src/
    │   ├── components/  # Reusable React components
    │   ├── pages/       # 10 full-featured pages
    │   ├── store/       # Redux Toolkit state management
    │   └── utils/       # API client, helpers
    └── index.html
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/verify-otp | Verify email OTP |
| POST | /api/auth/login | Login |
| GET  | /api/auth/me | Get current user |
| POST | /api/bio-rhythm/log | Log lifestyle data |
| GET  | /api/bio-rhythm/forecast | Get AI cognitive forecast |
| POST | /api/feynman/analyze | Gemini gap analysis |
| POST | /api/taxonomy/mistake | Log mistake |
| GET  | /api/taxonomy/profile | Mistake profile |
| POST | /api/study-commons/rooms | Create focus room |
| POST | /api/burnout/log | Log focus session |
| GET  | /api/burnout/history | Burnout history |
| POST | /api/quiz/generate | AI quiz generation |
| POST | /api/quiz/:id/submit | Submit quiz |
| POST | /api/ai/chat | AI Coach chat |
| GET  | /api/analytics/dashboard | Dashboard stats |

## 🚢 Deployment

**Backend (Render.com)**
- Connect GitHub repo, set root to `/backend`
- Add all environment variables
- Build: `npm install`, Start: `node server.js`

**Frontend (Vercel)**
- Connect GitHub repo, set root to `/frontend`
- Set `VITE_API_URL=https://your-render-url.onrender.com/api`
- Build: `npm run build`, Output: `dist`
