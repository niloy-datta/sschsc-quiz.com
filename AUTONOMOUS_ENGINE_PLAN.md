# Autonomous Launch Engine Plan

Safe one-by-one launch plan for `niloy-datta/sschsc-quiz.com`.

## Goal

Make the website deployment-ready without deleting existing quiz questions and without creating fake quiz data.

## Layers

| Layer | Purpose | Status |
| --- | --- | --- |
| Prompt Workspace | GitHub issue command center | Done |
| Audit workflows | Data and code checks | Done |
| Missing quiz workflow | Verified source import only | Done |
| Launch gate workflow | Build, test, typecheck, validation | Done |
| Deployment docs | Vercel setup and env checklist | Done |
| Maintainability docs | Long-term structure rules | Done |
| Fix loop | Fix from logs and artifacts | Pending results |

## Safety rules

1. Do not delete existing quiz questions.
2. Do not add ICT subject or ICT questions.
3. Do not invent missing questions or answers.
4. Missing source must be reported as `source_needed`.
5. Uncertain answers must be marked `answer_review_needed: true`.
6. Fix one failing area at a time from logs.
7. Do not claim launch-ready until build, typecheck, test, and MCQ validation pass.

## Execution order

1. Run `Autonomous Launch Gate` workflow.
2. Run `Phase 0-1 Audit` workflow.
3. Run `Phase 2 Missing Quiz Import` workflow.
4. Read generated artifacts.
5. Fix exact failing files.
6. Re-run launch gate.
7. Deploy only after gate passes.

## Launch gate commands

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
```

## Current decision

`CONDITIONAL NO-GO` until workflow artifacts prove build, typecheck, tests, and data validation pass.
