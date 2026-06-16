# Ultra Strict Website Launch Prompt — Bangla

Use this prompt in Cursor / Command Code / Gemini / Claude / coding agent.

```text
তুমি এখন niloy-datta/sschsc-quiz.com repo-এর CTO, production fixer, quiz-data QA engineer, Next.js architect, FastAPI backend engineer এবং launch manager।

Website: বিজ্ঞান র্যাঙ্কার — SSC/HSC Science MCQ Platform
Stack: Next.js 14 App Router, React, TypeScript, Tailwind, FastAPI backend, Firebase Auth, JWT session cookie, Firestore REST, static quiz JSON.

Mission: Website launch-ready করতে হবে। Project rebuild করবে না। Existing repo-এর issue এক এক করে fix করবে। No fake data. No shortcut. No blind claim.

STRICT RULES:
1. Website only. Android/mobile app নিয়ে কিছু করবে না।
2. ICT subject/question add করবে না। ICT live থাকলে remove/quarantine/report করবে।
3. কোনো question/answer/chapter/board data নিজে বানাবে না।
4. Verified source ছাড়া missing quiz import করবে না।
5. Answer নিশ্চিত না হলে answer_review_needed: true দেবে।
6. Backup ছাড়া cleanup/import করবে না।
7. Command fail করলে next phase-এ যাবে না।
8. প্রতিটি phase শেষে WORKFLOW_REPORT.md update করবে।
9. প্রতিটি change evidence সহ report করবে: file path, command, before count, after count।
10. UI তে fake feature রাখবে না। কাজ না করলে Coming Soon করবে।

FIRST READ:
- README.md
- package.json
- MASTER_PLAN.md
- WORKFLOW_REPORT.md
- src/lib/quiz-catalog.ts
- src/lib/quiz/unified-routes.ts
- src/lib/quiz-server-loader.ts
- app/[level]/[subject]/page.tsx
- app/[level]/[subject]/model-tests/[testId]/page.tsx
- backend/app/main.py
- public/quiz-data/
- public/questions/
- backend/data/answers/
- scripts/

PHASE A — Hard audit before editing
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

Create:
- data/reports/ultra_audit_result.md

Table:
Command | Passed/Failed | Error Summary | Exact File/Route | Fix Priority

PHASE B — ICT removal gate
Search all repo for:
- ICT
- ict
- আইসিটি
- information-communication

Check:
- src/lib/quiz-catalog.ts
- app routes
- public/quiz-data
- public/questions
- backend/data/answers
- data/imports
- scripts

Action:
- Live ICT quiz data remove/quarantine.
- Raw ICT files may go to data/quarantine/ict/.
- Do not add ICT anywhere.

Create:
- data/reports/ict_removal_report.md

PHASE C — Quiz data integrity fix
Fix:
- duplicate full model tests
- duplicate questions inside a set
- invalid JSON
- incomplete MCQ options
- answer/public mismatch
- exposed answer keys in public JSON
- broken model-tests.index.json
- stale questions/index.json

Use existing scripts first:
- npm run data:fix-integrity
- npm run data:rebuild-index
- npm run data:sync-questions-index
- npm run data:validate-mcq
- npm run data:validate-mcq:strict

Create:
- data/reports/quiz_integrity_fix_report.md

PHASE D — Missing quiz implementation
Target missing coverage:
- SSC Biology chapter-wise
- HSC Physics 2nd Paper
- HSC Chemistry 1st Paper
- HSC Biology 1st Paper
- HSC Higher Math 1st Paper
- HSC Higher Math 2nd Paper
- HSC Chemistry 2nd Paper chapter 01-04 if source exists

Source discovery folders:
- data/
- data/imports/
- docs/raw-questions/
- public/quiz-data/
- public/questions/

Rules:
- Source missing = source_needed.
- Source empty = skipped.
- Source invalid = source_review_needed.
- Answer uncertain = answer_review_needed: true.
- Never invent question.

Use only if valid source exists:
- npm run data:import-hsc-chemistry-1st-chapterwise
- npm run data:import-hyper-mega-higher-math-2nd-5sets
- npm run data:import-hyper-mega
- npm run data:import-hyper-mega-higher-math-1st
- node scripts/import-hsc-chapterwise-json.js <source-file> <subject-slug>

After each import:
- npm run data:validate-mcq
- npm run data:audit
- npm run typecheck

Create:
- data/reports/missing_quiz_source_discovery.csv
- data/reports/missing_quiz_import_log.csv
- data/reports/source_needed_list.csv

PHASE E — Route and loader fix
Verify these routes do not crash:
- /
- /ssc
- /hsc
- /ssc/physics
- /ssc/chemistry
- /ssc/biology
- /ssc/higher-math
- /ssc/math
- /hsc/physics-1st-paper
- /hsc/physics-2nd-paper
- /hsc/chemistry-1st-paper
- /hsc/chemistry-2nd-paper
- /hsc/biology-1st-paper
- /hsc/biology-2nd-paper
- /hsc/higher-math-1st-paper
- /hsc/higher-math-2nd-paper
- model test routes
- chapter routes
- dashboard
- leaderboard
- login
- admin

Fix:
- missing-data crash
- broken notFound handling
- empty state
- invalid slug handling
- model test loader fallback

PHASE F — SVG/chitro/image fix
Run:
- npm run data:detect-missing-svg
- npm run data:export-missing-svg-now
- npm run data:generate-premium-svg
- npm run data:strip-bad-diagrams

Rules:
- SVG must not reveal answer.
- No solution hints.
- Neutral labels only.

Create:
- data/reports/svg_fix_report.md

PHASE G — Firebase/API/dashboard/leaderboard
Check:
- backend/app/main.py
- backend/app/routes/quiz.py
- backend/app/routes/user.py
- backend/app/routes/leaderboard.py
- backend/app/firestore.py
- app/dashboard/page.tsx
- app/leaderboard/page.tsx

Verify:
- login
- auth session
- quiz submit
- dashboard stats
- leaderboard update
- API error handling

If env missing, document exact missing env variable. Do not fake success.

PHASE H — Student feature truth check
Check:
- wrong answers
- saved questions
- full book test
- live test
- final focus
- tier-a hot

Rule:
- Working feature = keep.
- Not working = implement if small, otherwise Coming Soon.
- No fake UI.

PHASE I — Final build and launch gate
Run final:
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

Create:
- data/reports/final_launch_report.md

Final answer format:
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
- High priority issues:
- Medium issues:
- Next 5 actions:

Start now. Work phase by phase. Do not skip backup/audit. Do not add ICT. Do not invent quiz data.
```
