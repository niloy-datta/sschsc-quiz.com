# VS Code Agent Instructions

Use these instructions for GitHub Copilot, Codex, Cursor, Continue, or any VS Code coding agent working in this repository.

## Repository

- Repo: `niloy-datta/sschsc-quiz.com`
- Product: `বিজ্ঞান র্যাঙ্কার`
- Stack: Next.js 14 App Router, React, TypeScript, Tailwind, FastAPI backend, Firebase auth, JWT cookie, Firestore REST

## First files to read

Before editing code, read:

1. `AGENT_CONTEXT.md`
2. `README.md`
3. `WORKFLOW_REPORT.md`
4. `MASTER_PLAN.md`
5. `PROJECT_MAINTAINABILITY.md`
6. `DEPLOYMENT_CHECKLIST.md`
7. `package.json`
8. `.github/workflows/autonomous-launch-gate.yml`

## Non-negotiable rules

1. Work on the existing website only. Do not rebuild the app from scratch.
2. Do not add ICT as a subject and do not add ICT questions.
3. Do not invent missing quiz questions, board questions, answer keys, explanations, or source text.
4. Use verified source only for content imports or data correction.
5. If source is missing, mark/report it as `source_needed`.
6. If an answer is uncertain, mark/report it as `answer_review_needed`.
7. Public question JSON under `public/questions/` must not expose answer keys.
8. Keep backend answer sidecars under `backend/data/answers/` synced with public question IDs.
9. Do not delete quiz data as a first fix. Backup, quarantine, and report before destructive data cleanup.
10. Keep reports concise and evidence-based.

## Safe work areas

Good tasks:

- Fix TypeScript/React/Next.js errors.
- Fix FastAPI routing/config/runtime issues.
- Improve UI/UX without changing question content.
- Fix SVG resolver bugs using existing trusted assets.
- Add generic educational SVGs only when the resolver already expects that slug and no answer/content is implied.
- Improve CI, lint, typecheck, build, local dev, deployment scripts, documentation, and reports.
- Remove obsolete prompt/report files that confuse agents, after documenting the cleanup.

Unsafe tasks unless verified source is provided:

- Filling missing board questions.
- Guessing MCQ options.
- Guessing correct answers.
- Adding explanations from memory.
- Adding ICT content.
- Modifying public question data and private answer sidecars without a clear sync/audit plan.

## Required verification before claiming done

Run as many as applicable:

```bash
corepack enable
pnpm install --frozen-lockfile=false
node scripts/deployment-readiness-check.js
pnpm run data:audit
pnpm run data:audit-papers
pnpm run data:audit-answers-sync
pnpm run data:validate-mcq
pnpm run data:validate-mcq:strict
pnpm run data:detect-missing-svg
node scripts/ci-check-premium-svgs.js
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```

## Output style

When done, report:

- files changed
- what was fixed
- commands run and pass/fail result
- anything blocked and why
- confirmation that no quiz content, answer keys, board content, or ICT was invented
