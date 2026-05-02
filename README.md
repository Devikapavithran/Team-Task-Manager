# TaskFlow AI — Unified Work Platform

> **Live Demo:** https://taskflow-ai-b1ql.onrender.com

A full-stack, production-grade team task management platform built specifically for **AI/LLM post-training workflows** — covering annotation, evaluation, validation, and labeling pipelines with role-based access control and quality scoring.

---

## 🚀 Live Demo

**URL:** https://taskflow-ai-b1ql.onrender.com

---

## ✨ Features

### Core
- **Authentication** — Signup/Login with JWT, persistent sessions
- **Role-Based Access Control** — Admin, Reviewer, Member with different permissions
- **Projects** — Kanban board + list views, color coding, progress tracking
- **Tasks** — Full CRUD with status, priority, assignee, due dates
- **Dashboard** — Real-time charts, 7-day completion trends, overdue tracking
- **Team Management** — View all members, assign roles (Admin only)
- **Notifications** — In-app notifications for assignments and status changes
- **Comments** — Per-task threaded comments

### AI Workflow Pipeline (Built for LLM Post-Training)
- **Annotation Tasks** — Label and categorize training data with structured schemas
- **Evaluation Tasks** — Score LLM prompt-response pairs on accuracy, relevance, coherence (0–10)
- **Validation Tasks** — Quality checks for guideline adherence and SLA compliance
- **Labeling Tasks** — Structured/unstructured data labeling with reviewer feedback loops
- **Quality Evaluation Panel** — Submit detailed scoring with written feedback on any AI task
- **Workflow Dashboard** — Pipeline overview with radar chart for team quality metrics

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS |
| State Management | Zustand + React Query |
| Charts | Recharts |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Auth | JWT (JSON Web Tokens) |
| Deployment | Render.com |
| Version Control | Git + GitHub |

---

## 📁 Project Structure

```
taskflow-ai/
├── frontend/                  # React + Vite frontend
│   ├── src/
│   │   ├── pages/             # Route pages
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ProjectsPage.jsx
│   │   │   ├── ProjectDetailPage.jsx
│   │   │   ├── TasksPage.jsx
│   │   │   ├── TaskDetailPage.jsx
│   │   │   ├── WorkflowPage.jsx
│   │   │   ├── TeamPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   ├── components/        # Shared components
│   │   │   ├── Layout.jsx
│   │   │   └── Modal.jsx
│   │   ├── store/             # Zustand global state
│   │   └── api/               # Axios API client
│   ├── index.html
│   └── vite.config.js
├── backend/                   # Express REST API
│   ├── routes/
│   │   ├── auth.js            # Signup, Login, Profile
│   │   ├── projects.js        # Project CRUD + members
│   │   ├── tasks.js           # Task CRUD + comments + evaluation
│   │   └── misc.js            # Dashboard, Team, Notifications
│   ├── middleware/
│   │   └── auth.js            # JWT + role guards
│   ├── db/
│   │   └── index.js           # PostgreSQL + auto schema init
│   └── server.js
├── package.json               # Root build scripts
└── README.md
```

---

## 🗄 Database Schema

Auto-initialized on first boot — no manual setup needed.

- `users` — Auth, roles, avatar color
- `projects` — Project metadata, owner, status
- `project_members` — Many-to-many membership
- `tasks` — Tasks with type, priority, status, assignee
- `task_comments` — Threaded comments
- `workflow_evaluations` — Quality scores (accuracy, relevance, coherence, overall)
- `notifications` — In-app notification feed

---

## 🔐 Role Permissions

| Feature | Admin | Reviewer | Member |
|---|---|---|---|
| Create/delete projects | ✅ | ❌ | ❌ |
| Manage team roles | ✅ | ❌ | ❌ |
| Submit quality evaluations | ✅ | ✅ | ❌ |
| Create/manage tasks | ✅ | ✅ | ✅ |
| Comment on tasks | ✅ | ✅ | ✅ |

---

## 🌐 API Endpoints

```
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/me

GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/members
DELETE /api/projects/:id/members/:uid

GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id
POST   /api/tasks/:id/comments
POST   /api/tasks/:id/evaluate

GET    /api/dashboard
GET    /api/team
PUT    /api/team/:id/role
GET    /api/notifications
PUT    /api/notifications/read-all
GET    /api/health
```

---

## ⚙️ Local Development

```bash
git clone https://github.com/Devikapavithran/Team-Task-Manager.git
cd Team-Task-Manager

# Install & run backend
cd backend && npm install
# Create .env with DATABASE_URL=your_local_postgres_url
node server.js

# Install & run frontend (new terminal)
cd frontend && npm install && npm run dev
```

Open http://localhost:5173

---

## ☁️ Deployment

Deployed on **Render.com**

- Build command: `npm run build`
- Start command: `npm start`
- Database: Render PostgreSQL (auto-connected via DATABASE_URL)
- Tables auto-created on first boot

Environment variables required:
```
DATABASE_URL=<from Render PostgreSQL>
JWT_SECRET=<random secret string>
NODE_ENV=production
CORS_ORIGIN=*
```

---

## 👩‍💻 Author

**Devika S**
GitHub: [@Devikapavithran](https://github.com/Devikapavithran)

---

*Built for Ethara placement drive — Software Engineer role*
