# Session 13 — CI and Next.js Gate Implementation

Date: 2026-06-17
Repo: `niloy-datta/sschsc-quiz.com`

## Goal

Implement the remaining safe engineering tasks identified after the SVG resolver work, without modifying quiz content, board questions, or answer keys.

## Completed

| File | Change |
| --- | --- |
| `.github/workflows/autonomous-launch-gate.yml` | Replaced duplicate `pnpm/action-setup` version pin with Corepack, moved to Node 22, used `pnpm run` consistently, and added `node scripts/ci-check-premium-svgs.js` to the launch gate. |
| `.github/workflows/phase0-phase1-audit.yml` | Replaced duplicate pnpm setup with Corepack, moved to Node 22, switched audit commands to `pnpm run`, and added missing/premium SVG checks. |
| `.github/workflows/phase2-missing-quiz-import.yml` | Replaced duplicate pnpm setup with Corepack, moved to Node 22, switched import/validation commands to `pnpm run`, and added SVG checks after import. |
| `api/requirements.txt` | Added `google-auth>=2.29.0` so the Vercel Python API entry has the same auth dependency expected by the backend import graph. |
| `package.json` | Split lint into `lint:repo` and `lint:code`; `lint` now runs both repo sanity checks and Next.js ESLint. Added ESLint dependencies. |
| `.eslintrc.json` | Added `next/core-web-vitals` lint config with runtime data/archive directories ignored. |
| `scripts/deployment-readiness-check.js` | Added static checks for API requirements, ESLint config, Corepack workflow setup, no duplicate pnpm action, and premium SVG gate. |

## Why this was needed

- GitHub Actions could fail before actual project checks because workflows specified a pnpm version while `package.json` also pins `packageManager`.
- The previous lint command only ran custom repo sanity checks, not framework-level Next.js/React linting.
- The Vercel Python API entry imports backend code, but `api/requirements.txt` did not include `google-auth`.
- SVG drift tooling existed but was not enforced in all release gates.

## Safety policy followed

- No quiz JSON content was modified.
- No board question content was created, edited, or imported.
- No answer keys were changed.
- No ICT subject/questions were added.

## Required verification

After GitHub Actions starts for the latest commit, verify these workflows:

1. `Autonomous Launch Gate`
2. `Phase 0-1 Audit`
3. `Phase 2 Missing Quiz Import` only when intentionally triggered or workflow path changes require it.

Local equivalent:

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
