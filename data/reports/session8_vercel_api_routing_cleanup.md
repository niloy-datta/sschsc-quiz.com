# Session 8 — Vercel API Routing and Deploy Cleanup

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
| `tmp_test.txt` | Removed temporary local setup note from the repository root. |

## Safety policy followed

- No quiz questions were deleted.
- No answer keys were invented.
- No board-question content was created or edited.
- No ICT subject or ICT questions were added.
- Only deploy/config/code hygiene files were changed.

## Why this was needed

The frontend API client uses same-origin `/api/*` requests in proxy mode. The README and Next config expect Vercel production to send `/api/*` to the Python FastAPI entry, but the previous `vercel.json` did not include that rewrite. The new rewrite makes the deployment configuration match the documented architecture.

## Remaining blockers

- Content QA remains blocked by source quality, not by routing code.
- The last known MCQ QA state still had source-needed issues that must not be guessed.
- The launch gate workflow still needs to be run after these commits to verify build, tests, typecheck, data audit, and deployment readiness.
