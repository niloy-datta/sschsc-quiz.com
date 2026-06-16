# SSC/HSC Quiz Platform — Master Completion Plan

Repository: `niloy-datta/sschsc-quiz.com`
Project: **বিজ্ঞান র্যাঙ্কার — SSC/HSC Science MCQ Platform**

This plan is the single execution roadmap for finishing the existing Next.js + FastAPI quiz platform safely. The project must be completed step by step without rebuilding from zero and without inventing quiz data.

---

## 0. CTO Decision

**Current strategy:** Stabilize the existing project, then fill missing quiz coverage, then validate UI/API/deployment.

**Non-negotiable rules**

1. Do not rebuild the project from zero.
2. Do not invent MCQ, answer, chapter, board, or OCR data.
3. Always back up quiz data before cleanup/import scripts.
4. Every fix must have a report file.
5. Every phase must pass validation before the next phase starts.
6. ICT must stay blocked unless verified clean data exists.
7. Missing quiz data must be imported only from verified source JSON/text/PDF/image.
8. If answer keys are uncertain, mark `answer_review_needed: true`.

---

## 1. Architecture Snapshot

| Layer | Current Direction |
| --- | --- |
| Frontend | Next.js 14 App Router, React, TypeScript, Tailwind |
| Backend | FastAPI under `backend/` |
| Auth | Firebase client sign-in + FastAPI JWT httpOnly session cookie |
| Database | Firestore REST |
| Quiz data | Static JSON under `public/quiz-data/` and `public/questions/` |
| Deployment | Vercel frontend + Python API route via `api/index.py` |

Main commands:

```bash
pnpm install
pnpm dev
pnpm run dev:backend
pnpm run typecheck
pnpm test
pnpm build
npm run data:audit
npm run data:validate-mcq
npm run data:validate-mcq:strict
npm run data:detect-missing-svg
```

---

## 2. Phase Order

### Phase 0 — Safety Backup and Baseline

**Goal:** Make the project safe before any data mutation.

Tasks:

- Create working branch.
- Back up `public/quiz-data/`.
- Back up `public/questions/`.
- Back up `public/images/quiz/`.
- Back up `public/images/board-scanned/` if available.
- Back up `scripts/` and `package.json`.
- Run baseline audit.

Commands:

```bash
git checkout -b fix/master-completion-plan
mkdir -p data/backups/master-plan-phase-0
cp -r public/quiz-data data/backups/master-plan-phase-0/quiz-data
cp -r public/questions data/backups/master-plan-phase-0/questions
cp -r public/images/quiz data/backups/master-plan-phase-0/images-quiz 2>/dev/null || true
cp -r public/images/board-scanned data/backups/master-plan-phase-0/board-scanned 2>/dev/null || true
cp -r scripts data/backups/master-plan-phase-0/scripts
cp package.json data/backups/master-plan-phase-0/package.json
git status
npm run data:audit
npm run data:validate-mcq
```

Definition of Done:

- Backup folder exists.
- Baseline audit report exists.
- No cleanup/import script has run before backup.

---

### Phase 1 — Model Test and MCQ Data Integrity

**Goal:** Remove duplicate/broken model-test data and sync indexes.

Tasks:

- Run model-test audit.
- Remove confirmed duplicate full sets.
- Remove within-set duplicate questions.
- Remove or quarantine incomplete/bad sets.
- Keep ICT blocked unless verified.
- Rebuild question indexes and manifests.
- Validate MCQ schema.

Commands:

```bash
npm run data:audit-papers
npm run data:fix-integrity
npm run data:rebuild-index
npm run data:sync-questions-index
npm run data:validate-mcq
npm run data:validate-mcq:strict
npm run typecheck
```

Definition of Done:

- Duplicate full-set groups are 0 or documented.
- Within-set duplicates are 0 or documented.
- Incomplete sets are removed/quarantined or documented.
- All `*.model-tests.index.json` files match live data.
- Typecheck passes.

Reports:

- `data/reports/model_test_baseline_report.md`
- `data/reports/duplicate_model_tests_removed.csv`
- `data/reports/within_set_duplicates_removed.csv`
- `data/reports/model_test_index_sync_report.csv`
- `data/reports/model_test_phase_1_validation_report.md`

---

### Phase 2 — Missing Chapter-Wise Quiz Implementation

**Goal:** Implement missing chapter-wise quizzes only from verified source files.

Priority subjects:

1. SSC Biology
2. HSC Physics 2nd Paper
3. HSC Chemistry 1st Paper
4. HSC Biology 1st Paper
5. HSC Higher Math 1st Paper
6. HSC Higher Math 2nd Paper
7. HSC Chemistry 2nd Paper chapters 01–04 if verified source exists

Source discovery locations:

- `data/`
- `data/imports/`
- `docs/raw-questions/`
- `public/quiz-data/`
- `public/questions/`
- uploaded OCR/text/JSON source packs

Commands to use when sources exist:

```bash
npm run data:import-hsc-chemistry-1st-chapterwise
npm run data:import-hyper-mega-higher-math-2nd-5sets
node scripts/import-hsc-chapterwise-json.js <source-file> <target-subject>
node scripts/import-ssc-chapter-premium.js <source-file> <target-subject>
npm run data:validate-mcq
npm run data:audit
```

Definition of Done:

- Target subject has chapter buckets.
- Each imported set has valid MCQ schema.
- Each imported question has options.
- Answer key is verified or marked review-needed.
- No subject/paper/chapter mixing.
- Routes load without crash.

Reports:

- `data/reports/phase2_source_discovery_report.md`
- `data/reports/phase2_before_chapter_status.csv`
- `data/reports/phase2_import_log.csv`
- `data/reports/phase2_after_chapter_status.csv`
- `data/reports/phase2_source_needed_list.csv`

---

### Phase 3 — Board Question Recovery

**Goal:** Complete missing board-question sets only from verified board sources.

Priority:

1. HSC Physics 2nd Paper — missing/underfilled years 2022, 2023, 2025
2. HSC Chemistry 2nd Paper underfilled board sets
3. HSC Biology 1st/2nd Paper underfilled board sets
4. HSC Higher Math 1st/2nd Paper underfilled board sets
5. SSC board subjects audit

Rules:

- Use JSON if available.
- Use scanned images/PDF only after OCR.
- OCR output must be manually cleaned before JSON import.
- If answer key is uncertain, set `answer_review_needed: true`.
- Do not mix board/year/paper/subject.

Commands:

```bash
npm run data:import-board
npm run data:validate-mcq
npm run data:validate-mcq:strict
```

Reports:

- `data/reports/board_question_recovery_plan.md`
- `data/reports/source_needed_list.csv`
- `data/reports/answer_key_needed.csv`
- `data/reports/ocr_needed_list.csv`

Definition of Done:

- Board routes render existing data.
- Missing board sets are either imported or documented as source-needed.
- No fake/guessed answer key enters production.

---

### Phase 4 — SVG / Chitro / Image Integrity

**Goal:** Ensure every diagram/image reference is valid and safe.

Tasks:

- Check every `imageUrl` in quiz JSON.
- Check files under `public/images/quiz/`.
- Check board scans under `public/images/board-scanned/`.
- Detect broken image paths.
- Detect SVG exists but not connected.
- Detect answer-revealing SVGs.
- Generate/attach only neutral diagrams.

Commands:

```bash
npm run data:detect-missing-svg
npm run data:export-missing-svg-now
npm run data:generate-premium-svg
npm run data:strip-bad-diagrams
npm run data:validate-mcq
```

Definition of Done:

- Missing SVG count = 0 or documented.
- Broken imageUrl count = 0 or documented.
- Answer-revealing SVG count = 0.
- SVG labels are neutral only.

Reports:

- `data/reports/svg_missing_report.csv`
- `data/reports/svg_required_list.csv`
- `data/reports/broken_imageurl_report.csv`
- `data/reports/answer_revealing_svg_report.csv`

---

### Phase 5 — Firebase, API, Dashboard, Leaderboard

**Goal:** Make user-facing dynamic features actually work.

Tasks:

- Configure `.env.local`.
- Configure `backend/.env`.
- Verify Firebase client config.
- Verify server Firebase/Firestore config.
- Verify quiz submission.
- Verify dashboard real stats.
- Verify leaderboard real data.
- Verify user progress save.

Important files:

- `backend/app/main.py`
- `backend/app/config.py`
- `backend/app/firestore.py`
- `backend/app/routes/quiz.py`
- `backend/app/routes/user.py`
- `backend/app/routes/leaderboard.py`
- `app/dashboard/page.tsx`
- `app/leaderboard/page.tsx`
- `src/components/quiz/`

Commands:

```bash
pnpm run dev:backend
pnpm dev
npm run typecheck
npm run test
```

Definition of Done:

- Login works.
- Quiz submit works.
- Dashboard reflects submitted quiz.
- Leaderboard updates.
- API errors are visible, not silent.

---

### Phase 6 — Student Features

**Goal:** Remove fake/stub user features or implement them properly.

Feature decisions:

| Feature | Decision |
| --- | --- |
| Wrong Answers | Implement before final launch if possible |
| Saved Questions | Implement before final launch if possible |
| Full Book Test | Can be Coming Soon if no full-book data exists |
| Live Test | Can be Coming Soon if no live-test backend exists |
| Final Focus | Keep only if backed by real data |
| Tier-A Hot | Keep if real sets exist |

Files:

- `app/[level]/wrong-answers/page.tsx`
- `app/[level]/saved-questions/page.tsx`
- `app/[level]/full-book-test/page.tsx`
- `app/[level]/final-focus/page.tsx`
- `app/[level]/tier-a-hot/page.tsx`
- `app/live-test/page.tsx`
- `src/store/`
- `src/components/quiz/`

Definition of Done:

- No fake UI pretending to be live.
- Deferred features clearly show Coming Soon.
- Wrong/Saved features either work or are visibly deferred.

---

### Phase 7 — Production Polish and Error Handling

**Goal:** No crash pages, no broken empty states.

Tasks:

- Add/verify `app/error.tsx`.
- Add/verify `app/not-found.tsx`.
- Add loading states for heavy routes.
- Protect admin route.
- Remove debug-only UI.
- Improve empty states.
- Ensure invalid routes do not crash.

Commands:

```bash
npm run typecheck
npm run build
```

Definition of Done:

- Invalid URLs show clean 404.
- Runtime errors show recoverable UI.
- Admin route is protected.
- Build passes.

---

### Phase 8 — Final QA and Launch

**Goal:** Full launch gate.

Commands:

```bash
npm run data:audit
npm run data:audit-papers
npm run data:audit-answers-sync
npm run data:validate-mcq
npm run data:validate-mcq:strict
npm run data:detect-missing-svg
npm run typecheck
npm run test
npm run build
npm run data:audit-website
```

Launch checklist:

- Data duplicate count = 0 or documented.
- Within-set duplicate count = 0 or documented.
- All indexes synced.
- Missing source list documented.
- ICT blocked unless fixed.
- Quiz submission works.
- Dashboard works.
- Leaderboard works.
- Wrong/Saved not fake.
- SVG missing count = 0 or documented.
- Typecheck passes.
- Tests pass.
- Build passes.
- Vercel env vars configured.
- Firestore rules reviewed.
- Admin protected.

Final decision format:

```text
Readiness Score: __/100
Launch Decision: GO / CONDITIONAL GO / NO-GO
Critical blockers:
High-priority blockers:
Medium-priority issues:
Next 5 actions:
```

---

## 3. Immediate Next Actions

1. Run Phase 0 backup if not already done on this repo.
2. Run `npm run data:audit` and `npm run data:audit-papers`.
3. Verify Phase 1 cleanup result from current branch.
4. Start Phase 2 source discovery for missing chapter-wise quizzes.
5. Import only verified missing quiz data and validate after every import.

---

## 4. Status Tracker

| Phase | Status | Notes |
| --- | --- | --- |
| Phase 0 Backup | Pending verification | Must confirm in this repo |
| Phase 1 Data Integrity | Pending verification | Prior cleanup claimed; must verify on current repo |
| Phase 2 Missing Chapter Data | Not started | Source discovery first |
| Phase 3 Board Recovery | Not started | OCR/source needed |
| Phase 4 SVG/Image | Not started | Audit first |
| Phase 5 Firebase/API | Not started | Env needed |
| Phase 6 Student Features | Not started | Wrong/Saved priority |
| Phase 7 Polish | Not started | Error/loading/admin |
| Phase 8 Launch QA | Not started | Final gate |

---

## 5. Operating Instruction

Work one phase at a time. Do not jump ahead. Do not make claims without report evidence. Do not add invented quiz content. Every missing data item must become either:

- imported from verified source,
- marked `source_needed`, or
- marked `answer_review_needed`.
