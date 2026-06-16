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
| Phase 1 Data Integrity | Partial | Answer sidecars synced; 532 source-needed MCQ issues remain |
| Phase 2 Missing Chapter Data | Blocked by source quality | SSC Biology and HSC Higher Math 2nd local imports were tested and rolled back due duplicate-stem QA failures |
| Phase 3 Board Recovery | Pending | Source/OCR needed |
| Phase 4 SVG/Image | Pending | Run missing SVG audit first |
| Phase 5 Firebase/API | Pending | Env verification needed |
| Phase 6 Student Features | Pending | Wrong/Saved priority |
| Phase 7 Polish | Pending | Error/loading/admin route |
| Phase 8 Launch QA | Pending | Final gate |

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
  - Created 260 missing backend answer files by copying canonical answer files only when public question IDs were fully covered.
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
  - `data:audit-answers-sync` is now `SUCCESS`: 1670 answer files, 1670 public question files, 0 missing, 0 orphan, 0 leaked public answers.
  - MCQ QA now has 532 errors, down from 547. Remaining: 520 duplicate options, 8 duplicate stems, 4 empty options.
  - `data:audit-papers` still reports 73 issues: 50 duplicate, 12 missing/serial-gap, 11 unusual count.
  - `npm run lint` still runs zero Turbo tasks, so lint coverage is not meaningful yet.
  - `npm run build` passes, but Next still warns about missing SWC lockfile dependency metadata.
- Next action:
  - Use `data/mcq-source-needed-report.json` to repair duplicate/empty options from verified source only.
  - Add verified chapter-wise data for SSC Biology and HSC Higher Math 2nd Paper.
  - Review HSC Chemistry 2nd Paper chapter-wise coverage; currently only chapter 05 is low.
- Launch risk:
  - Medium/high for content quality until the 532 source-needed MCQ issues and 73 paper-audit issues are resolved.

---

## Session 3 - Dev Server and Phase 2 Source Trial

**Date:** 2026-06-17

### Summary

- What I checked:
  - Started the dev server at `http://127.0.0.1:3000`.
  - Verified the homepage responds with HTTP 200.
  - Checked local chapter-wise candidates for SSC Biology and HSC Higher Math 2nd Paper.
  - Re-ran `data:audit`, `data:audit-answers-sync`, and `data:validate-mcq`.
- What I changed:
  - Temporarily imported SSC Biology chapter-wise from `ssc_biology_premium.json`: 140 sets / 3500 MCQs.
  - Temporarily imported HSC Higher Math 2nd chapter-wise from `hsc_selected_subjects_chapterwise_10_high_priority_sets_master.json`: 90 sets / 2250 MCQs.
  - Rolled both imports back from live data because MCQ QA errors jumped from 532 to 4493.
  - Rebuilt `public/quiz-data/manifest.json` after rollback.
  - Regenerated `data/mcq-source-needed-report.json` from the restored clean baseline.
- Files changed:
  - `public/quiz-data/manifest.json`
  - `scripts/missing-quiz-report.md`
  - `scripts/answers-public-sync-report.json`
  - `data/mcq-qa-report.json`
  - `data/mcq-source-needed-report.json`
- Commands run:
  - `npm run dev -- --hostname 127.0.0.1 --port 3000`
  - `node scripts/import-ssc-chapter-premium.js biology ssc_biology_premium.json`
  - `node scripts/import-hsc-master-subject-chapters.js higher-math-2nd-paper`
  - `node scripts/delete-model-test-sets.js ssc biology ssc-biology-chapter-`
  - `node scripts/delete-model-test-sets.js hsc higher-math-2nd-paper hsc-higher-math-2nd-paper-chapter-`
  - `node scripts/rebuild-manifest.js`
  - `npm run data:audit`
  - `npm run data:audit-answers-sync`
  - `npm run data:validate-mcq`
- Errors found:
  - The tested SSC Biology source produced 2410 structural QA errors, mostly duplicate stems.
  - The tested HSC Higher Math 2nd source produced 1551 structural QA errors, mostly duplicate stems.
  - After rollback, MCQ QA returned to 532 errors: 520 duplicate options, 8 duplicate stems, 4 empty options.
  - Answer sync remains `SUCCESS`: 1670 answer files, 1670 public question files, 0 missing, 0 orphan, 0 leaked public answers.
- Next action:
  - Do not import `ssc_biology_premium.json` or the HSC master Higher Math 2nd slice as live content without cleanup/source review.
  - Fix the 532 source-needed MCQ issues first, starting with high-volume Higher Math duplicate options.
  - Find or create a verified non-repetitive source for SSC Biology and HSC Higher Math 2nd chapter-wise coverage.
- Launch risk:
  - Phase 2 remains blocked by source quality, not by app code.

---

## Session 4 - Mobile Quiz UI and Current Gate Check

**Date:** 2026-06-17

### Summary

- What I checked:
  - Re-checked the active shared ChatGPT objective link; it currently exposes only the ChatGPT login/shell page, not the underlying shared requirements.
  - Used the repository reports and current worktree as authoritative context.
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
  - Headless Playwright viewport check for `/ssc/physics/model-tests/ssc-physics-chapter-01-model-test-01`
- Errors found:
  - Data audit remains stable: 34806 total questions, 107 chapters, 880 model tests, 513 board sets, 11 complete, 2 partial, 1 missing (ICT intentionally not live).
  - Answer sync remains `SUCCESS`: 1670 answer files, 1670 public question files, 0 missing, 0 orphan, 0 leaked public answers.
  - MCQ QA remains at 532 source-needed errors: 520 duplicate options, 8 duplicate stems, 4 empty options.
  - Paper/model audit remains at 73 issues: 50 duplicate, 12 missing, 11 other/unusual count.
  - The 4 empty-option errors are two HSC Physics 2nd Paper Rajshahi 2024 questions with blank `গ` and `ঘ` options; local backup has the same blanks, so no verified source is available in-repo.
  - `npm run lint` still runs zero Turbo tasks, so lint coverage is not meaningful yet.
  - `npm run build` passes, but Next still warns about missing SWC lockfile dependency metadata.
- Next action:
  - Continue Phase 1 content QA from verified sources only; do not invent the missing/duplicate MCQ options.
  - Prioritize high-volume Higher Math duplicate-option files from `data/mcq-source-needed-report.json`.
  - Find a verified non-repetitive source for SSC Biology and HSC Higher Math 2nd Paper chapter-wise coverage before importing live data.
- Launch risk:
  - App code path is stable for this UI fix.
  - Launch content risk remains medium/high until the 532 source-needed MCQ issues and partial chapter coverage are resolved.

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
