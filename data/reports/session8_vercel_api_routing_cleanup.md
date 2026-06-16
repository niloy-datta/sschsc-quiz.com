# Session 8 — Vercel API Routing, Deploy Cleanup, and Project Lint

Date: 2026-06-17
Repo: `niloy-datta/sschsc-quiz.com`

## Completed

| File | Change |
| --- | --- |
| `vercel.json` | Added `/api/:path*` rewrite to the Python FastAPI entry at `api/index.py`. |
| `api/index.py` | Added a FastAPI `/api/health` endpoint served from the Vercel API entry. |
| `.vercelignore` | Added deployment ignore rules for archives, local state, reports, backups, and unrelated implementation dumps. |
| `scripts/deployment-readiness-check.js` | Added checks for `.vercelignore`, FastAPI health route, and Vercel API rewrite. |
| `.env.local.example` | Documented `NEXT_PUBLIC_SITE_URL` for sitemap and robots generation. |
| `scripts/lint-project.js` | Added dependency-free project sanity checks for required files, Vercel API rewrite, FastAPI health route, ICT catalog exposure, and public answer-key leakage. |
| `package.json` | Changed `npm run lint` from zero-task Turbo lint to `node scripts/lint-project.js`. |
| `.github/workflows/autonomous-launch-gate.yml` | Added `npm run lint` to the launch gate and watched `.vercelignore`. |
| `tmp_test.txt` | Removed temporary local setup note from the repository root. |

## Safety policy followed

- No quiz questions were deleted.
- No answer keys were invented.
- No board-question content was created or edited.
- No ICT subject or ICT questions were added.
- Only deploy/config/code hygiene files were changed.

## Why this was needed

The frontend API client uses same-origin `/api/*` requests in proxy mode. The README and Next config expect Vercel production to send `/api/*` to the Python FastAPI entry, but the previous `vercel.json` did not include that rewrite. The new rewrite makes the deployment configuration match the documented architecture.

The previous `npm run lint` command used Turbo but did not have package-level lint tasks to execute. The new lint script now performs repo-specific launch sanity checks without adding dependencies or changing quiz content.

The launch gate now runs this lint check, so the workflow can catch basic API routing, ICT catalog, and public answer-key leakage mistakes before deploy.

## Remaining blockers

- Content QA remains blocked by source quality, not by routing code.
- The last known MCQ QA state still had source-needed issues that must not be guessed.
- The launch gate workflow still needs to be run after these commits to verify build, tests, typecheck, data audit, lint, and deployment readiness.
