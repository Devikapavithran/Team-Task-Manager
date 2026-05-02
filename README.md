# TaskFlow AI — Unified Work Platform

A full-stack team task management system built for AI/LLM annotation, evaluation, and collaboration workflows.

## Features

- **Authentication** — Signup/Login with JWT, role-based access (Admin / Reviewer / Member)
- **Projects** — Create & manage projects, Kanban board + list views, progress tracking
- **Tasks** — Full CRUD with status, priority, assignee, due dates, AI workflow types
- **AI Workflows** — Dedicated pipeline for annotation, evaluation, validation, labeling tasks with quality scoring (accuracy, relevance, coherence)
- **Team Management** — View all members, assign roles (Admin only)
- **Notifications** — Real-time in-app notifications
- **Dashboard** — Charts, completion trends, overdue tracking

## Tech Stack

- **Frontend**: React 18 + Vite, TailwindCSS, React Query, Zustand, Recharts
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (auto-initializes schema on first run)

---

## 🚀 Deploy on Railway (3 steps)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/taskflow-ai.git
git push -u origin main
```

### 2. Create Railway project
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repo

### 3. Add PostgreSQL database
1. In Railway dashboard → New → Database → Add PostgreSQL
2. Railway will automatically inject `DATABASE_URL` into your service

### 4. Set environment variables
In Railway → your service → Variables, add:
```
JWT_SECRET=<generate a random 64-char string>
NODE_ENV=production
```

That's it. Railway will auto-build and deploy. The app auto-creates all database tables on first boot.

---

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL running locally

### Setup
```bash
# Install all dependencies
npm run install:all

# Create backend .env
cp .env.example backend/.env
# Edit backend/.env with your local DB connection

# Start backend (port 5000)
cd backend && npm start

# In another terminal, start frontend (port 5173)
cd frontend && npm run dev
```

Open http://localhost:5173

---

## Project Structure

```
taskflow-ai/
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── pages/          # Route pages
│   │   ├── components/     # Shared components
│   │   ├── store/          # Zustand state
│   │   └── api/            # API client
│   ├── index.html
│   └── vite.config.js
├── backend/                # Express API
│   ├── routes/             # API routes
│   ├── middleware/         # Auth middleware
│   ├── db/                 # DB connection & schema
│   └── server.js
├── railway.toml            # Railway deployment config
└── package.json            # Root build scripts
```

## Live Demo

Deploy link: *Add your Railway URL after deployment*

## Video Demo

*Link to 2-5 minute demo video*
