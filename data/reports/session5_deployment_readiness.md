# Session 5 — Deployment Readiness

Date: 2026-06-16
Repo: `niloy-datta/sschsc-quiz.com`

## Completed

| File | Change |
| --- | --- |
| `requirements.txt` | Aligned Python dependency list for Firestore REST deployment by adding/confirming `google-auth`. |
| `DEPLOYMENT_CHECKLIST.md` | Added Vercel deployment checklist, env variables, commands, and launch decision rules. |
| `PROJECT_MAINTAINABILITY.md` | Added maintainability rules and project structure policy. |

## User policy confirmed

- Do not delete quiz questions.
- Do not add ICT questions.
- Do not invent missing questions.
- Use verified source only for imports.

## Deployment readiness status

| Area | Status |
| --- | --- |
| Vercel config | Present |
| FastAPI serverless entry | Present |
| Root Python requirements | Updated |
| Env checklist | Documented |
| Build/test result | Not verified in this connector session |
| Live deploy | Not executed in this connector session |

## Next action

Run these before deploy:

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

Then deploy from Vercel after environment variables are set.
