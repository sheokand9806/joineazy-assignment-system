# Joineazy – Student, Group & Assignment Management System

A role-based full-stack app where **students** form groups and confirm assignment submissions, and **professors** post assignments and track group progress on a dashboard.

**Stack:** React 18 + Vite + Tailwind CSS · Node.js + Express · PostgreSQL · JWT auth · Docker

---

## 1. Overview of implementation

| Area | What's implemented |
|---|---|
| Auth | Register / login, bcrypt-hashed passwords, JWT (`student` / `admin` roles), role-protected routes on both API and UI |
| Students | Create a group, add members by **email or student ID**, leave / remove members, view assigned work, open OneDrive link, **two-step submission confirmation**, group progress bar |
| Professors | Create / edit / delete assignments (title, description, due date, OneDrive link), assign to **all students or specific groups**, group-wise and student-wise confirmation tracking, analytics (counts + completion bars) |
| Ops | Dockerfiles for both services, `docker-compose.yml` with Postgres, auto-migration and optional demo seed |

### Key behaviours
- **One group per student** (`group_members.user_id` is UNIQUE). A group has an owner who manages members; if the owner leaves, ownership transfers, and an empty group is deleted.
- **Submission is confirmed per group** (one confirmation covers every member), and records *which* member confirmed it and when. The professor's student-wise view shows each student's status derived from their group.
- **Two-step confirmation is enforced server-side**: step 1 (`/initiate`) returns a 2-minute signed token; step 2 (`/confirm`) must present it. A direct one-click call cannot confirm.
- Students only see assignments for **all** or **their group**; targeted assignments are never leaked to other groups.

---

## 2. Setup & run

### Option A – Docker (recommended)
```bash
docker compose up --build
```
- App: http://localhost:8080
- API: http://localhost:5000/api/health

The DB schema is created automatically and demo data is seeded on first start (`AUTO_SEED=true`).

### Option B – Local development
Prerequisites: Node 18+, PostgreSQL 14+.

```bash
# 1. database
createdb joineazy

# 2. backend
cd backend
cp .env.example .env        # edit DATABASE_URL / JWT_SECRET if needed
npm install
npm run dev                 # migrates schema + seeds demo data, listens on :5000

# 3. frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxies /api to :5000)
```

Useful scripts (backend): `npm run migrate`, `npm run seed` (`node src/seed.js --force` to add demo data to a non-empty DB).

### Render deployment

This repository contains separate `backend` and `frontend` applications. In the Render dashboard, configure the API service with:

- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm ci`
- **Start Command:** `npm start`
- **Health Check Path:** `/api/health`

Set `DATABASE_URL` to a Render PostgreSQL connection string and set a secure `JWT_SECRET`. The included [`render.yaml`](render.yaml) defines the backend and PostgreSQL database; deploy it through **Blueprint** in Render.

The `render.yaml` file does not configure a frontend static site. Deploy `frontend` separately as a **Static Site** with:

- **Root Directory:** `frontend`
- **Build Command:** `npm ci && npm run build`
- **Publish Directory:** `dist`
- **Environment Variable:** `VITE_API_URL=https://<your-backend-service>.onrender.com/api`

### Demo accounts (password `password123`)
| Role | Email |
|---|---|
| Professor | professor@joineazy.com |
| Student (in Team Alpha) | aarav@student.com, diya@student.com, kabir@student.com |
| Student (in Team Beta) | ishita@student.com, rohan@student.com |
| Student (no group) | sneha@student.com |

> Professor accounts can also be created via `POST /api/auth/register` with `role: "admin"` and the correct `adminCode`, only if the `ADMIN_SIGNUP_CODE` env var is set. Students self-register through the UI.

### Environment variables (backend)
| Var | Purpose | Default |
|---|---|---|
| `PORT` | API port | 5000 |
| `DATABASE_URL` | Postgres connection string | `postgres://postgres:postgres@localhost:5432/joineazy` |
| `JWT_SECRET` | Token signing secret – **set in production** | dev fallback |
| `JWT_EXPIRES_IN` | Token lifetime | 7d |
| `CORS_ORIGIN` | Comma-separated allowed origins | any |
| `AUTO_SEED` | Seed demo data if DB is empty | false |
| `ADMIN_SIGNUP_CODE` | Enables professor self-signup with this code | unset (disabled) |

---

## 3. API endpoints

All routes are under `/api`. Protected routes need `Authorization: Bearer <jwt>`. Errors return `{ "error": "message" }`.

### Auth
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | public | `{name, email, password, studentId?}` → `{token, user}` |
| POST | `/auth/login` | public | `{email, password}` → `{token, user}` |
| GET | `/auth/me` | any | Current user |

### Groups
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/groups/mine` | student | Own group with members (or `null`) |
| POST | `/groups` | student | `{name, members?: [email/ID]}` – create group; returns `skipped` list for members that couldn't be added |
| POST | `/groups/:id/members` | group owner | `{identifier}` – add student by email or student ID |
| DELETE | `/groups/:id/members/:userId` | owner / self | Remove a member or leave |
| GET | `/groups` | admin | All groups with members |

### Assignments
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/assignments` | any | Student: visible assignments + `confirmed` status for their group. Admin: all, with `totalGroups` / `confirmedGroups` |
| GET | `/assignments/:id` | admin | Detail with `summary`, `groups` (group-wise), `students` (student-wise) |
| POST | `/assignments` | admin | `{title, description, dueDate, onedriveLink, assignTo: 'all'｜'groups', groupIds?}` |
| PUT | `/assignments/:id` | admin | Same body as create |
| DELETE | `/assignments/:id` | admin | Delete (cascades confirmations) |
| POST | `/assignments/:id/submission/initiate` | student | Step 1 → `{confirmToken}` (valid 2 min) |
| POST | `/assignments/:id/submission/confirm` | student | Step 2: `{confirmToken}` → records group confirmation |

### Analytics
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/analytics` | admin | `counts`, `overallCompletion`, `perAssignment[]`, `perGroup[]` |

Status codes used: `400` validation, `401` unauthenticated, `403` wrong role/ownership, `404` not found, `409` conflict (duplicate email, already in group, already confirmed).

---

## 4. Database schema

```mermaid
erDiagram
    USERS ||--o{ GROUPS : "owns"
    USERS ||--o| GROUP_MEMBERS : "belongs to (max 1 group)"
    GROUPS ||--o{ GROUP_MEMBERS : "has"
    USERS ||--o{ ASSIGNMENTS : "creates (admin)"
    ASSIGNMENTS ||--o{ ASSIGNMENT_GROUPS : "targets (if assign_to=groups)"
    GROUPS ||--o{ ASSIGNMENT_GROUPS : "targeted by"
    ASSIGNMENTS ||--o{ SUBMISSIONS : "has"
    GROUPS ||--o{ SUBMISSIONS : "confirms"
    USERS ||--o{ SUBMISSIONS : "confirmed_by"

    USERS {
        int id PK
        varchar name
        varchar email UK
        varchar student_id UK
        text password_hash
        varchar role "student | admin"
    }
    GROUPS {
        int id PK
        varchar name
        int owner_id FK
    }
    GROUP_MEMBERS {
        int id PK
        int group_id FK
        int user_id FK "UNIQUE"
    }
    ASSIGNMENTS {
        int id PK
        varchar title
        text description
        timestamptz due_date
        text onedrive_link
        varchar assign_to "all | groups"
        int created_by FK
    }
    ASSIGNMENT_GROUPS {
        int assignment_id PK,FK
        int group_id PK,FK
    }
    SUBMISSIONS {
        int id PK
        int assignment_id FK
        int group_id FK
        int confirmed_by FK
        timestamptz confirmed_at
    }
```

Relationship notes:
- `group_members.user_id` UNIQUE → a student is in at most one group.
- `submissions (assignment_id, group_id)` UNIQUE → exactly one confirmation per group per assignment (also guards against double-click races via `ON CONFLICT DO NOTHING`).
- `assignment_groups` is only populated when `assignments.assign_to = 'groups'`; for `'all'` the target set is every group.
- Foreign keys use `ON DELETE CASCADE` so removing an assignment/group/user leaves no orphans.

Schema source: [`backend/src/schema.sql`](backend/src/schema.sql) (idempotent, run on every startup).

---

## 5. Architecture

```
┌────────────────────────┐   /api (JSON + JWT)   ┌───────────────────────────┐        ┌──────────────┐
│ React SPA (Vite)       │ ────────────────────▶ │ Express API               │ ─────▶ │ PostgreSQL   │
│ Tailwind, React Router │ ◀──────────────────── │ routes → middleware → db  │ ◀───── │ (pg Pool)    │
│ AuthContext + api.js   │                       │ auth / groups / assign /  │        └──────────────┘
└────────────────────────┘                       │ analytics                 │
   served by nginx (prod)                        └───────────────────────────┘
   or Vite dev server (dev)
```

**Backend (`backend/src`)**
- `routes/` – one router per resource (`auth`, `groups`, `assignments`, `analytics`)
- `middleware/auth.js` – JWT sign/verify, `authenticate`, `requireRole`
- `middleware/error.js` – `HttpError`, async wrapper, central error handler
- `schema.sql`, `migrate.js`, `seed.js`, `db.js` – persistence layer
- Multi-row writes (create group + members, assignment + target groups) run in **transactions**.

**Frontend (`frontend/src`)**
- `context/AuthContext.jsx` – session state; token in `localStorage`; auto-logout on 401
- `api.js` – fetch wrapper attaching the JWT
- `App.jsx` – role-guarded routes (`Protected role="admin|student"`)
- `pages/student/*`, `pages/admin/*`, shared `components/ui.jsx` (ProgressBar, Modal, Badge, CompletionChart)
- Responsive layouts (mobile-first Tailwind; modals become bottom sheets on small screens)

**Request flow – confirming a submission:** Student clicks *Confirm* → UI step 1 → `POST /initiate` (server checks group membership, assignment visibility, not already confirmed; returns signed 2-min token) → UI step 2 → `POST /confirm` with token → server re-validates and inserts into `submissions` → dashboard reloads and progress bars update.

---

## 6. Key design & deployment decisions

- **Group-level confirmation.** The brief says groups submit one piece of work, so one member confirming covers everyone. We store who confirmed for accountability, and derive student-wise status for the professor.
- **Server-enforced two-step flow** via a short-lived signed token, so the "double confirm" is a real safeguard and not just UI.
- **Authorization in the API, not just UI.** Role checks (`requireRole`), group-ownership checks, and assignment visibility checks are all server-side.
- **Parameterised SQL everywhere** (no string-built queries) and bcrypt password hashing; professor signup is disabled unless an env code is set.
- **No ORM / no chart library.** Plain `pg` keeps queries transparent and easy to explain; analytics use lightweight Tailwind bars, which keeps the bundle small (~62 kB gzipped).
- **One group per student** keeps progress semantics unambiguous (a student's progress = their group's progress).
- **Deployment:** three containers (Postgres, API, nginx+SPA). nginx serves the static build and reverse-proxies `/api`, so the browser talks to a single origin (no CORS in prod). The API retries DB connection on boot and runs idempotent migrations, so `docker compose up` works from a cold start. For a hosted demo, any container host works (Render/Railway/Fly: deploy the backend with a managed Postgres `DATABASE_URL` and set `JWT_SECRET`; build the frontend with `VITE_API_URL=https://<api-host>/api` and host it on Netlify/Vercel/static hosting, setting `CORS_ORIGIN` on the API).

### Possible next steps
Email invitations for group members, assignment file attachments, pagination, automated tests (Jest/Supertest), and refresh tokens.

---

## Repository layout
```
joineazy-assignment-system/
├── backend/            Express API (+ Dockerfile)
├── frontend/           React + Tailwind SPA (+ Dockerfile, nginx.conf)
├── docker-compose.yml
└── README.md
```
