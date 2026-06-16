# Deployment Checklist — বিজ্ঞান র্যাঙ্কার

Repository: `niloy-datta/sschsc-quiz.com`
Target: Vercel deployment for Next.js frontend + Python FastAPI serverless entry.

## Non-negotiable data rules

- Do not delete existing quiz questions.
- Do not add ICT as a subject.
- Do not add ICT questions.
- Do not invent missing questions or answer keys.
- Only import verified, non-empty source files.
- If a source is missing, mark it as `source_needed`.
- If an answer key is uncertain, mark it as `answer_review_needed: true`.

## Deployment files checked

| File | Purpose | Status |
| --- | --- | --- |
| `vercel.json` | Vercel frontend build settings | Present |
| `api/index.py` | FastAPI serverless entrypoint | Present |
| `requirements.txt` | Root Python dependencies for deployment | Updated |
| `.env.local.example` | Local/prod env reference | Present |
| `package.json` | Build/test/data commands | Present |

## Required Vercel settings

Project framework:

```text
Next.js
```

Build command:

```bash
pnpm run build
```

Install command:

```bash
pnpm install
```

Output directory:

```text
.next
```

## Required environment variables

Set these in Vercel Project Settings → Environment Variables.

### Frontend public variables

```env
NEXT_PUBLIC_USE_API_PROXY=true
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Backend/server variables

```env
FRONTEND_URL=https://YOUR_DOMAIN_HERE
JWT_SECRET=CHANGE_THIS_TO_LONG_RANDOM_SECRET
ALGORITHM=HS256
FIREBASE_PROJECT_ID=
GOOGLE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT={...full service account json as one line...}
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

Do not expose `JWT_SECRET`, `ADMIN_PASSWORD`, or `FIREBASE_SERVICE_ACCOUNT` as `NEXT_PUBLIC_*`.

## Pre-deployment commands

Run before production deploy:

```bash
pnpm install
npm run data:audit
npm run data:audit-papers
npm run data:audit-answers-sync
npm run data:validate-mcq
npm run data:validate-mcq:strict
npm run typecheck
npm run test
npm run build
```

## Optional data workflows

Run only after backup and only when source files are verified:

```bash
npm run data:fix-integrity
npm run data:rebuild-index
npm run data:sync-questions-index
npm run data:import-hsc-chemistry-1st-chapterwise
npm run data:import-hyper-mega-higher-math-2nd-5sets
npm run data:import-hyper-mega
npm run data:import-hyper-mega-higher-math-1st
```

## GitHub Actions to run

1. `Phase 0-1 Audit`
2. `Phase 2 Missing Quiz Import`

After workflows complete, download/read artifacts:

- `phase0-phase1-audit-reports`
- `phase2-missing-quiz-import-reports`

## Launch decision rule

Launch only if:

- `npm run build` passes.
- `npm run typecheck` passes.
- `npm run data:validate-mcq` passes.
- `npm run data:validate-mcq:strict` passes or remaining items are documented and non-critical.
- No ICT subject is live.
- No answer keys are exposed in public quiz payloads.
- Firebase env variables are configured.

## Final status format

```text
Summary:
- What I checked:
- What I changed:
- Files changed:
- Commands run:
- Errors found:
- Next action:
- Launch risk:

CTO Decision:
- Readiness score: __/100
- Launch decision: GO / CONDITIONAL GO / NO-GO
- Critical blockers:
- Next 5 actions:
```
