# বিজ্ঞান র্যাঙ্কার — SSC/HSC Science MCQ Platform

SSC ও HSC বিজ্ঞান বিভাগের MCQ কুইজ প্ল্যাটফর্ম।

## Agent context

Before using any coding agent, read `AGENT_CONTEXT.md`. It is the canonical project instruction file. Old prompt or roadmap text files are not source of truth.

## Hosting target

Do not deploy the full app to GitHub Pages. This project uses Next.js plus a Python FastAPI backend, so production hosting should use Vercel with `api/index.py` for the backend entry.

## Architecture

| Layer | Stack |
| --- | --- |
| Frontend | Next.js 14 App Router, React, TypeScript, Tailwind |
| Backend | FastAPI in `backend/` |
| Auth | Firebase client sign-in plus FastAPI JWT `httponly` session cookie |
| Database | Firestore REST |
| Quiz data | `public/quiz-data/`, `public/questions/`, `backend/data/answers/` |
| Legacy | Prisma/MySQL and old static SPA are not active runtime paths |

## Prerequisites

- Node.js 20+
- pnpm
- Python 3.11+; Python 3.12 recommended for Vercel

## Frontend setup

```bash
pnpm install
cp .env.local.example .env.local
pnpm dev
```

## Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

For macOS/Linux, activate the venv with `source .venv/bin/activate`.

## Environment

Frontend `.env.local`:

```env
NEXT_PUBLIC_USE_API_PROXY=true
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SITE_URL=https://sschsc-quiz.com
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Backend/server env:

```env
ENVIRONMENT=production
FRONTEND_URL=https://your-domain.com
APP_URL=https://your-domain.com
JWT_SECRET=use-a-strong-random-value
ADMIN_PASSWORD=use-a-strong-admin-password
FIREBASE_PROJECT_ID=your-project-id
```

Never expose `JWT_SECRET`, `ADMIN_PASSWORD`, or service account JSON as `NEXT_PUBLIC_*`.

## Vercel deployment

| Component | Entry |
| --- | --- |
| Frontend | Next.js via `package.json` |
| API | `api/index.py` imports `backend/app/main.py` |
| Routing | `vercel.json` routes `/api/*` to Python |

## Quality gate

Run before claiming launch readiness:

```bash
npm run data:audit
npm run data:audit-papers
npm run data:audit-answers-sync
npm run data:validate-mcq
npm run data:validate-mcq:strict
npm run data:detect-missing-svg
npm run lint
npm run typecheck
npm run test
npm run build
```

## Key routes

| Route | Purpose |
| --- | --- |
| `/ssc`, `/hsc` | SSC/HSC quiz hubs |
| `/ssc/[subject]/chapter/[slug]` | Chapter MCQ |
| `/hsc/[subject]/[paper]/model-tests/[id]` | Model tests |
| `/hsc-board-questions/**` | Board question images |
