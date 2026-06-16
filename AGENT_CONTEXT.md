# Agent Context — SSC/HSC Quiz Website

This is the canonical instruction file for coding agents working on this repository.

## Project

- Repository: `niloy-datta/sschsc-quiz.com`
- Product: `বিজ্ঞান র্যাঙ্কার` — SSC/HSC Science MCQ platform
- Frontend: Next.js 14 App Router, React, TypeScript, Tailwind
- Backend: FastAPI under `backend/app/`
- Auth/database: Firebase client auth + JWT session cookie + Firestore REST
- Runtime quiz data:
  - public quiz metadata: `public/quiz-data/`
  - public questions without answers: `public/questions/`
  - private answer sidecars: `backend/data/answers/`

## Non-negotiable rules

1. Work on this existing website only. Do not rebuild the project from scratch.
2. Do not add ICT as a subject and do not add ICT questions.
3. Do not invent missing quiz questions, board questions, answer keys, or explanations.
4. Use verified source only for content imports or data correction.
5. If source is missing, mark/report it as `source_needed`.
6. If an answer is uncertain, mark/report it as `answer_review_needed`.
7. Public question JSON must not expose answer keys.
8. Keep backend answer sidecars synced with public question IDs.
9. Do not delete quiz data as a first fix; backup/quarantine/report before destructive data cleanup.
10. Keep reports concise and evidence-based.

## Canonical files to read first

1. `README.md`
2. `AGENT_CONTEXT.md`
3. `WORKFLOW_REPORT.md`
4. `MASTER_PLAN.md`
5. `PROJECT_MAINTAINABILITY.md`
6. `DEPLOYMENT_CHECKLIST.md`
7. `package.json`
8. `.github/workflows/autonomous-launch-gate.yml`

## Commands before claiming launch readiness

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

## Current important known limits

- Content QA issues that need verified sources must not be guessed.
- Board-question/content gaps must not be filled without verified source data.
- SVG fixes should only attach trusted SVGs or add clearly generic educational schematics where the resolver already expects that slug.
