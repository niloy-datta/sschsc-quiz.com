# WORKFLOW REPORT — SSC/HSC Quiz Platform

Repository: `niloy-datta/sschsc-quiz.com`
Project: **বিজ্ঞান র্যাঙ্কার — SSC/HSC Science MCQ Platform**

This file must be updated after every work session so the project owner always has a clear summary of what was done, what changed, and what remains.

---

## Permanent Owner Instruction

1. Work on the existing website project only.
2. Fix one phase at a time.
3. Always give a short summary after every action/session.
4. Do not add any ICT questions.
5. Do not implement ICT as a quiz subject.
6. Remove/quarantine ICT data if found.
7. Keep ICT out of catalog, navigation, routes, indexes, board lists, and public quiz data.
8. Do not invent missing quiz questions or answer keys.
9. Missing quiz data must be handled as one of:
   - imported from verified source,
   - `source_needed`, or
   - `answer_review_needed`.
10. Run validation before declaring a phase complete.

---

## Current Verified Repo Facts

| Item | Status |
| --- | --- |
| Repo connected | Yes |
| Default branch | `main` |
| Project architecture | Next.js 14 App Router + FastAPI backend |
| Auth/database | Firebase + JWT session + Firestore REST |
| ICT in static catalog | Not present in `src/lib/quiz-catalog.ts` at the time of review |
| Master plan | Added as `MASTER_PLAN.md` |

---

## ICT Policy

**Decision:** ICT must be deleted/quarantined, not completed.

Implementation rule:

- If any of these paths exist, move/remove them from live data and document in report:
  - `public/quiz-data/hsc/ict.json`
  - `public/quiz-data/hsc/ict.model-tests.index.json`
  - `public/questions/ict/`
  - `data/imports/*ict*`
  - `data/*ICT*`
  - any route/nav/catalog entry showing ICT

Validation rule:

- Searching for ICT after cleanup should not expose ICT as a live subject.
- If raw ICT files are preserved, they must be under `data/quarantine/ict/` only.

---

## Session 1 — Master Plan and Operating Policy

**Date:** 2026-06-16

### Completed

- Connected GitHub repository: `niloy-datta/sschsc-quiz.com`.
- Read project README and package scripts.
- Created `MASTER_PLAN.md` with full phase-based production completion plan.
- Added this `WORKFLOW_REPORT.md` to track all future work.
- Confirmed owner instruction: no ICT question should be added; ICT subject should be removed/quarantined.

### Files Added

| File | Purpose |
| --- | --- |
| `MASTER_PLAN.md` | Full CTO-level project completion roadmap |
| `WORKFLOW_REPORT.md` | Running summary and task tracker |

### Immediate Next Action

Start **Phase 0 + Phase 1 verification** on this repo:

1. Confirm backup exists or create backup.
2. Run data audit.
3. Run model-test audit.
4. Verify duplicate cleanup status.
5. Verify ICT is absent from live catalog/routes/data.
6. Only then proceed to missing chapter-wise quiz implementation.

Commands to run locally or via coding agent:

```bash
npm run data:audit
npm run data:audit-papers
npm run data:validate-mcq
npm run data:validate-mcq:strict
npm run typecheck
```

---

## Phase Tracker

| Phase | Status | Notes |
| --- | --- | --- |
| Phase 0 Backup | Pending verification | No destructive migration or data deletion done this session |
| Phase 1 Data Integrity | Partial | Answer sidecars synced; source-needed MCQ issues remain |
| Phase 2 Missing Chapter Data | Blocked by source quality | SSC Biology and HSC Higher Math 2nd local imports were tested and rolled back due duplicate-stem QA failures |
| Phase 3 Board Recovery | Blocked by owner/content policy | Do not create/develop board question content without verified source |
| Phase 4 SVG/Image | Pending | Run missing SVG audit first |
| Phase 5 Firebase/API | Improved | Vercel `/api/*` rewrite and FastAPI health endpoint added; workflow gate still required |
| Phase 6 Student Features | Pending | Wrong/Saved priority |
| Phase 7 Polish | Partial | Error/loading/not-found pages present; mobile quiz UI fix completed earlier |
| Phase 8 Launch QA | Pending | Final gate workflow must run after current commits |

---

## Session 2 - Phase 1 Answer Sync and Audit Correction

**Date:** 2026-06-16

### Summary

- What I checked:
  - `scripts/missing-quiz-report.md`
  - `scripts/paper-model-audit-report.json`
  - `scripts/answers-public-sync-report.json`
  - `data/mcq-qa-report.json`
  - `public/quiz-data/**`
  - `public/questions/**`
  - `backend/data/answers/**`
- What I changed:
  - Added a safe alias answer-sidecar repair script.
  - Created missing backend answer files by copying canonical answer files only when public question IDs were fully covered.
  - Fixed the missing-quiz audit so chapter-scoped `modelTests` count as chapter-wise coverage, matching the app normalizer.
  - Relaxed MCQ QA so short formula questions such as `2⁻³ = ?` are not flagged as missing question text.
  - Generated `data/mcq-source-needed-report.json` for unresolved source-level MCQ issues.
- Files changed:
  - `scripts/fix-answer-alias-sidecars.js`
  - `scripts/answer-alias-sidecars-report.json`
  - `scripts/audit-missing-quizzes.js`
  - `scripts/missing-quiz-report.md`
  - `scripts/validate-mcq-quality.js`
  - `src/lib/validations/mcq-qa.ts`
  - `data/mcq-qa-report.json`
  - `data/mcq-source-needed-report.json`
  - `scripts/answers-public-sync-report.json`
  - `backend/data/answers/**` alias sidecar files
- Commands run:
  - `node scripts/fix-answer-alias-sidecars.js`
  - `npm run data:audit`
  - `npm run data:audit-answers-sync`
  - `npm run data:validate-mcq`
  - `npm run data:audit-papers`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
- Errors found:
  - `data:audit-answers-sync` reported success at that time.
  - Remaining MCQ QA problems required verified source review, not guessing.
  - `npm run lint` still ran zero Turbo tasks, so lint coverage was not meaningful.
  - `npm run build` passed, but Next warned about missing SWC lockfile dependency metadata.
- Next action:
  - Use `data/mcq-source-needed-report.json` to repair duplicate/empty options from verified source only.
  - Add verified chapter-wise data for SSC Biology and HSC Higher Math 2nd Paper only after source QA passes.
- Launch risk:
  - Medium/high for content quality until source-needed MCQ issues and paper-audit issues are resolved.

---

## Session 3 - Dev Server and Phase 2 Source Trial

**Date:** 2026-06-17

### Summary

- What I checked:
  - Started the dev server at `http://127.0.0.1:3000`.
  - Verified the homepage responded with HTTP 200.
  - Checked local chapter-wise candidates for SSC Biology and HSC Higher Math 2nd Paper.
  - Re-ran `data:audit`, `data:audit-answers-sync`, and `data:validate-mcq`.
- What I changed:
  - Temporarily imported SSC Biology chapter-wise from `ssc_biology_premium.json`.
  - Temporarily imported HSC Higher Math 2nd chapter-wise from a local master import file.
  - Rolled both imports back from live data because MCQ QA errors increased sharply.
  - Rebuilt `public/quiz-data/manifest.json` after rollback.
  - Regenerated `data/mcq-source-needed-report.json` from the restored baseline.
- Files changed:
  - `public/quiz-data/manifest.json`
  - `scripts/missing-quiz-report.md`
  - `scripts/answers-public-sync-report.json`
  - `data/mcq-qa-report.json`
  - `data/mcq-source-needed-report.json`
- Commands run:
  - `npm run dev -- --hostname 127.0.0.1 --port 3000`
  - Local import and rollback scripts
  - `node scripts/rebuild-manifest.js`
  - `npm run data:audit`
  - `npm run data:audit-answers-sync`
  - `npm run data:validate-mcq`
- Errors found:
  - Tested SSC Biology and HSC Higher Math 2nd sources produced too many duplicate-stem QA errors.
  - After rollback, source-needed MCQ problems remained.
  - Answer sync remained successful at that time.
- Next action:
  - Do not import the tested SSC Biology or HSC Higher Math 2nd sources as live content without cleanup/source review.
  - Fix source-needed MCQ issues from verified sources only.
- Launch risk:
  - Phase 2 remains blocked by source quality, not by app code.

---

## Session 4 - Mobile Quiz UI and Current Gate Check

**Date:** 2026-06-17

### Summary

- What I checked:
  - Re-checked the active shared objective link; it exposed only the ChatGPT login/shell page, not the underlying shared requirements.
  - Used repository reports and current worktree as authoritative context.
  - Re-ran current data health checks.
  - Inspected the quiz runner question-number navigator shown in the mobile screenshot.
  - Verified the navigator behavior with headless Playwright at 390px mobile and 1280px desktop widths.
- What I changed:
  - Hid the quiz question-number grid and legend on phone/tablet widths.
  - Kept the navigator visible on desktop with Tailwind `lg:flex`.
  - Restarted the dev server after `next build` touched `.next` and caused the running dev server to serve a stale chunk.
- Files changed:
  - `src/components/quiz/QuizRunner.tsx`
  - `WORKFLOW_REPORT.md`
- Commands run:
  - `npm run data:audit`
  - `npm run data:audit-answers-sync`
  - `npm run data:validate-mcq`
  - `npm run data:audit-papers`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
  - `npm run dev -- --hostname 127.0.0.1 --port 3000`
  - Headless Playwright viewport check for a quiz route
- Errors found:
  - Data audit was stable at that time.
  - Answer sync remained successful at that time.
  - MCQ QA and paper/model audit still had source-needed/content-quality issues.
  - `npm run lint` still ran zero Turbo tasks, so lint coverage was not meaningful.
  - `npm run build` passed, but Next warned about missing SWC lockfile dependency metadata.
- Next action:
  - Continue Phase 1 content QA from verified sources only; do not invent missing/duplicate MCQ options.
  - Prioritize high-volume duplicate-option files from `data/mcq-source-needed-report.json`.
- Launch risk:
  - App code path was stable for this UI fix.
  - Launch content risk remained medium/high until source-needed MCQ issues and partial chapter coverage were resolved.

---

## Session 8 - Vercel API Routing and Deploy Cleanup

**Date:** 2026-06-17

### Summary

- What I checked:
  - Repo connection and permissions.
  - `README.md`, `package.json`, `WORKFLOW_REPORT.md`.
  - `vercel.json`, `next.config.mjs`, `src/lib/api.ts`.
  - `api/index.py`, `app/api/health/route.ts`, `scripts/deployment-readiness-check.js`.
  - `.env.local.example`, `.gitignore`, and temporary root files.
- What I changed:
  - Added Vercel rewrite so production `/api/:path*` requests route to `api/index.py`.
  - Added FastAPI `/api/health` endpoint inside the Vercel API entry.
  - Added `.vercelignore` to keep unrelated archives, local state, reports, backups, and temporary files out of Vercel deployment payloads.
  - Updated deployment readiness static check to verify `.vercelignore`, API health route, and Vercel API rewrite.
  - Documented `NEXT_PUBLIC_SITE_URL` in `.env.local.example` for sitemap/robots production URL.
  - Deleted root `tmp_test.txt` temporary local setup note.
  - Added `data/reports/session8_vercel_api_routing_cleanup.md`.
- Files changed:
  - `vercel.json`
  - `api/index.py`
  - `.vercelignore`
  - `scripts/deployment-readiness-check.js`
  - `.env.local.example`
  - `tmp_test.txt` deleted
  - `data/reports/session8_vercel_api_routing_cleanup.md`
  - `WORKFLOW_REPORT.md`
- Commands run:
  - GitHub connector file fetch/update/create/delete operations.
  - No local `npm run build` or `npm run test` could be executed from this environment because the repository cannot be cloned from GitHub here.
- Errors found:
  - Deployment docs/README expected Vercel `/api/*` to reach Python, but previous `vercel.json` had no API rewrite.
  - A temporary root file existed and was removed.
  - Content QA blockers remain source-needed and must not be fixed by inventing board questions or answers.
- Next action:
  - Run the `Autonomous Launch Gate` workflow or locally run `npm run data:audit`, `npm run data:audit-papers`, `npm run data:audit-answers-sync`, `npm run data:validate-mcq`, `npm run data:validate-mcq:strict`, `npm run data:detect-missing-svg`, `npm run typecheck`, `npm run test`, and `npm run build`.
  - If the gate passes, deploy to Vercel and smoke-test `/`, `/api/health`, `/ssc`, `/hsc`, and `/login`.
- Launch risk:
  - API routing risk reduced.
  - Launch is still not final GO until workflow gate/build/test/data validation results are verified.
  - Content risk remains for source-needed MCQ issues; board-question content was intentionally not developed.

---

## Always Report in This Format

```text
Summary:
- What I checked:
- What I changed:
- Files changed:
- Commands run:
- Errors found:
- Next action:
- Launch risk:
```
