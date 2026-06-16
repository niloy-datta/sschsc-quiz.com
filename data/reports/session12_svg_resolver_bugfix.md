# Session 12 — SVG Resolver Bugfix

Date: 2026-06-17
Repo: `niloy-datta/sschsc-quiz.com`

## Goal

Fix code-side SVG bugs without changing quiz question content or answer keys.

## Completed

| File | Change |
| --- | --- |
| `src/lib/quiz/quiz-diagrams.ts` | Rebuilt the frontend SVG resolver around trusted slugs only. Added existing biology SVG slugs to the trusted map. Removed resolver paths that pointed to missing assets. Logic-gate text now maps to existing `nor-gate.svg`. |
| `scripts/lib/diagram-topic-resolver.js` | Aligned script-side resolver with real library assets. Removed missing `ssc-wave-crests`, `bio-logic-gate`, and `ssc-cylinder` library returns. Exact missing diagrams now fall back to generated SVG flow. |
| `scripts/ci-check-premium-svgs.js` | Removed duplicate outdated resolver logic and switched the CI check to the shared script resolver. |

## Bug fixed

The frontend resolver and script resolver were not aligned. Some paths attempted to resolve to SVG slugs that did not exist in `public/images/quiz/`, while some existing biology SVG files were not included in the trusted frontend asset map.

## Safety policy followed

- No quiz JSON content was modified.
- No board question content was created or edited.
- No answer key was changed.
- No ICT subject/questions were added.

## Required verification

Run:

```bash
npm run data:detect-missing-svg
npm run lint
npm run typecheck
npm run test
npm run build
```
