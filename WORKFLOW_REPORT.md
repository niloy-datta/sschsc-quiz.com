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
| Phase 0 Backup | Pending verification | Must run/verify on `sschsc-quiz.com` |
| Phase 1 Data Integrity | Pending verification | Must verify duplicates, indexes, ICT deletion |
| Phase 2 Missing Chapter Data | Pending | Do not start before Phase 1 verification |
| Phase 3 Board Recovery | Pending | Source/OCR needed |
| Phase 4 SVG/Image | Pending | Run missing SVG audit first |
| Phase 5 Firebase/API | Pending | Env verification needed |
| Phase 6 Student Features | Pending | Wrong/Saved priority |
| Phase 7 Polish | Pending | Error/loading/admin route |
| Phase 8 Launch QA | Pending | Final gate |

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
