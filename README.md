# বিজ্ঞান র্যাঙ্কার — SSC/HSC Science MCQ Platform

SSC ও HSC বিজ্ঞান বিভাগের MCQ কুইজ প্ল্যাটফর্ম।

## Architecture

| Layer | Stack |
| --- | --- |
| **Frontend** | Next.js 14 (App Router), React, TypeScript, Tailwind |
| **Backend** | FastAPI in `backend/` |
| **Auth** | Firebase client sign-in + FastAPI JWT `httponly` session cookie |
| **Database** | Firestore REST (active) |
| **Quiz data** | `scratch/parsed_quizzes.json`, `data/hsc-board-questions/` |
| **Legacy** | Prisma/MySQL in `packages/database/` — unused; `app/static/` vanilla SPA — not removed yet |

## Prerequisites

- Node.js 20+
- pnpm
- Python 3.11+ (3.12 recommended; 3.14 may need `--break-system-packages` for some deps)

## Frontend setup

```bash
pnpm install
cp .env.local.example .env.local   # if not present
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Frontend env (`.env.local`)

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_USE_API_PROXY` | `true` — same-origin `/api/*` via Next rewrite (default) |
| `NEXT_PUBLIC_API_URL` | Empty when proxy mode; or `http://localhost:8000` for direct mode |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase web client config |

## Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- API: [http://localhost:8000](http://localhost:8000)
- Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)

Env loads from `backend/.env` then project root `.env`. Copy `backend/.env.example` to `backend/.env` or use root `.env`.

### Backend env

| Variable | Description |
| --- | --- |
| `ENVIRONMENT` | `development` or `production` |
| `FRONTEND_URL` | Next.js origin, e.g. `http://localhost:3000` |
| `APP_URL` | App origin (same as frontend in local dev) |
| `JWT_SECRET` | Session token secret |
| `ADMIN_PASSWORD` | Admin login password |
| `FIREBASE_PROJECT_ID` | Firestore project ID |
| `FIREBASE_*` | Firebase web/server config |
| `DATABASE_URL` | Legacy/unused (Prisma only) |

## Local dev (both servers)

```bash
# Terminal 1 — backend
cd backend && uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend
pnpm dev
```

Next.js rewrites `/api/:path*` → `http://localhost:8000/api/:path*` when `NEXT_PUBLIC_USE_API_PROXY=true` (local only; disabled on Vercel).

## Vercel deployment

| Component | Entry |
| --- | --- |
| **Frontend** | Next.js (`@vercel/next` via `package.json`) |
| **API** | `api/index.py` → imports `backend/app/main.py` |
| **Routing** | `vercel.json`: `/api/*` → Python; all other routes → Next.js |

### Vercel env — frontend (client-safe)

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_USE_API_PROXY` | `true` |
| `NEXT_PUBLIC_API_URL` | empty (same-origin `/api/*`) |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase web config |

### Vercel env — backend (server only, never `NEXT_PUBLIC_`)

| Variable | Value |
| --- | --- |
| `ENVIRONMENT` | `production` |
| `FRONTEND_URL` | `https://your-domain.com` |
| `APP_URL` | `https://your-domain.com` |
| `JWT_SECRET` | strong random secret |
| `ADMIN_PASSWORD` | strong admin password |
| `FIREBASE_PROJECT_ID` | your Firebase project |
| `FIREBASE_*` | Firebase server config |

`DATABASE_URL` is not required (Firestore REST is active). Production cookies: `SameSite=Lax`, `Secure=true`, `HttpOnly=true`.

Python runtime: 3.12 (see `vercel.json`). `firebase-admin` is optional; Firestore REST works without it.

## Key routes

| Route | Purpose |
| --- | --- |
| `/ssc`, `/hsc` | SSC/HSC quiz hubs |
| `/ssc/[subject]/chapter/[slug]` | Chapter MCQ |
| `/hsc/[subject]/[paper]/model-tests/[id]` | Model tests |
| `/hsc-board-questions/**` | Board question images |
| `/login`, `/dashboard`, `/admin`, `/leaderboard` | Auth & admin |

## Data folders (do not delete)

- `scratch/parsed_quizzes.json` — local quiz pool for API fallback
- `data/hsc-board-questions/` — board question JSON
- `src/data/` — additional board TS data
- `docs/raw-questions/` — raw source questions
- `app/static/` — legacy static SPA (still served by FastAPI locally)

## Project structure

```
api/index.py         # Vercel serverless adapter (imports backend)
app/                 # Next.js pages only (no FastAPI)
backend/
  app/
    main.py          # FastAPI app
    config.py
    firestore.py
    schemas.py
src/                 # React components, lib, context
scratch/             # Parsed quiz JSON
data/                # Board question data
```
