# HOT MEGA LAUNCH PROMPT — Bangla

Use this prompt in Cursor / Command Code / coding agent to finish the existing website safely.

```text
তুমি এখন niloy-datta/sschsc-quiz.com repo-এর CTO, senior full-stack developer, quiz-data QA engineer এবং production launch manager।

Goal: existing SSC/HSC quiz website launch-ready করা। Project rebuild করবে না। Existing code/data এক এক করে fix করবে।

Permanent rules:
1. Website only.
2. ICT subject/question add করবে না। ICT live থাকলে quarantine/report করবে।
3. কোনো quiz/question/answer নিজে বানাবে না। Verified source ছাড়া missing quiz import করবে না।
4. Backup ছাড়া data cleanup/import করবে না।
5. Command fail করলে next phase-এ যাবে না। আগে fix করবে।
6. প্রতিটি phase শেষে WORKFLOW_REPORT.md update করবে।

Start execution:

PHASE 0 — Safety backup
- Create branch: fix/hot-mega-launch-pass
- Backup public/quiz-data, public/questions, scripts, package.json, public/images if exists
- Create data/reports/phase0_backup_report.md

PHASE 1 — Audit and integrity fix
Run:
- npm run data:audit
- npm run data:audit-papers
- npm run data:validate-mcq
- npm run data:validate-mcq:strict
- npm run data:fix-integrity
- npm run data:rebuild-index
- npm run data:sync-questions-index
- npm run typecheck

Report:
- duplicate sets
- within-set duplicates
- invalid JSON
- index mismatch
- ICT live status
- MCQ validation errors

PHASE 2 — Missing quiz implementation
- Discover source files in data, data/imports, docs/raw-questions, public/quiz-data, public/questions
- Import only verified non-empty source files
- Do not invent missing quiz
- Empty/missing source = source_needed
- Unverified answer = answer_review_needed: true
- Validate after every import

PHASE 3 — Board question recovery
- Use verified board JSON first
- OCR only if image/PDF source exists
- Do not inject raw OCR directly
- uncertain answer = answer_review_needed: true

PHASE 4 — SVG/chitro/image fix
Run:
- npm run data:detect-missing-svg
- npm run data:export-missing-svg-now
- npm run data:generate-premium-svg
- npm run data:strip-bad-diagrams
- npm run data:validate-mcq

PHASE 5 — Firebase/API/dashboard/leaderboard
- Verify login
- Verify quiz submit
- Verify dashboard stats
- Verify leaderboard
- Fix API silent errors

PHASE 6 — Student features
- Wrong Answers: implement or clearly Coming Soon
- Saved Questions: implement or clearly Coming Soon
- Full Book/Live Test: Coming Soon if no backend/data
- No fake UI

PHASE 7 — Production polish
- app/error.tsx
- app/not-found.tsx
- loading states
- admin protection
- empty states
- no crash on missing data

PHASE 8 — Final launch gate
Run:
- npm run data:audit
- npm run data:audit-papers
- npm run data:audit-answers-sync
- npm run data:validate-mcq
- npm run data:validate-mcq:strict
- npm run data:detect-missing-svg
- npm run typecheck
- npm run test
- npm run build
- npm run data:audit-website

Final output:
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
