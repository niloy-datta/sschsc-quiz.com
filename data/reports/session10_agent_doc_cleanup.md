# Session 10 — Agent Documentation Cleanup

Date: 2026-06-17
Repo: `niloy-datta/sschsc-quiz.com`

## Goal

Reduce agent confusion by keeping one canonical instruction source and removing obsolete prompt-style text files.

## Canonical instruction source added

- `AGENT_CONTEXT.md`

Agents should use this file first, then `WORKFLOW_REPORT.md`, `MASTER_PLAN.md`, `PROJECT_MAINTAINABILITY.md`, and `DEPLOYMENT_CHECKLIST.md`.

## Removed files

| File | Reason |
| --- | --- |
| `DEBUG_PROMPTS.md` | Old debug prompt collection; not canonical. |
| `PROJECT_PLAN.md` | Superseded broad blueprint that conflicted with current repo state. |
| `docs/prompts.md` | Old prompt roadmap; not current architecture source. |
| `docs/prompts/ULTRA_STRICT_WEBSITE_LAUNCH_PROMPT_BN.md` | Old agent prompt; replaced by `AGENT_CONTEXT.md`. |
| `detect_missing_svg.txt` | Old text spec duplicated by `scripts/detect-missing-svg.js`. |
| `scripts/prompts/mcq-qa-engine.txt` | Old prompt text that could encourage unverified question generation. |
| `.cursor/rules/mcq-qa-engine.mdc` | Old editor rule that could conflict with verified-source-only policy. |

## Superseded but kept as stub

| File | Reason |
| --- | --- |
| `docs/prompts/HOT_MEGA_LAUNCH_PROMPT_BN.md` | Direct deletion was blocked by the connector safety layer, so it was reduced to a short superseded notice pointing to `AGENT_CONTEXT.md`. |

## Code cleanup

- `scripts/detect-missing-svg.js` no longer references the deleted `detect_missing_svg.txt` file.
- Fixed the `LEKHOCHITRA_OPT` regex grouping while editing the SVG audit script.

## Safety policy followed

- No quiz data was deleted.
- No answer keys were changed.
- No board question content was created or edited.
- No ICT subject/questions were added.
