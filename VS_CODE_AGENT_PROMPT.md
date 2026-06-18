# VS Code Agent Prompt Key

Copy the prompt below and paste it into VS Code Copilot Chat, Codex, Cursor, Continue, or another coding-agent prompt box.

---

You are working in the repository `niloy-datta/sschsc-quiz.com`, the `বিজ্ঞান র্যাঙ্কার` SSC/HSC Science MCQ platform.

Before making changes, read and follow:

- `AGENT_CONTEXT.md`
- `.github/copilot-instructions.md`
- `README.md`
- `WORKFLOW_REPORT.md`
- `PROJECT_MAINTAINABILITY.md`
- `DEPLOYMENT_CHECKLIST.md`
- `package.json`
- `.github/workflows/autonomous-launch-gate.yml`

Your task:

1. Work only on the existing project. Do not rebuild from scratch.
2. Find and fix safe engineering issues one by one.
3. Prioritize build, typecheck, lint, runtime, API routing, SVG resolver, UI/UX, local dev, CI, and deploy-readiness problems.
4. Do not invent quiz questions, board questions, answer keys, options, explanations, or source text.
5. Do not add ICT subject/questions.
6. Public question JSON must never expose answer keys.
7. Keep private answer sidecars synced only when verified source and a safe audit plan exist.
8. If missing source is needed, report `source_needed` instead of guessing.
9. If an answer is uncertain, report `answer_review_needed` instead of guessing.
10. Before destructive changes, create a backup/quarantine/report.

Run verification where possible:

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

When you finish, provide:

- changed files
- exact fixes
- commands run and results
- remaining blockers
- confirmation that no quiz content, answer keys, board questions, or ICT were invented

Start now by scanning the repo for the highest-impact safe engineering issue, fix it, run the relevant checks, and continue to the next issue.

---

## Short command prompt

Use this shorter version when you want a quick action:

```text
Read AGENT_CONTEXT.md and .github/copilot-instructions.md. Work only on the existing SSC/HSC Science quiz website. Fix safe engineering bugs one by one. Do not invent quiz data, board questions, answers, explanations, or ICT content. Run relevant checks and report files changed, results, and blockers.
```
