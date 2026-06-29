# Contributing to sschsc-quiz.com

Thank you for contributing to the SSC/HSC Quiz Platform! Please follow this guide to ensure a smooth and safe contribution workflow.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Branch Naming Rules](#branch-naming-rules)
- [Contribution Workflow](#contribution-workflow)
- [Pre-PR Checklist](#pre-pr-checklist)
- [Opening a Pull Request](#opening-a-pull-request)
- [Important Rules](#important-rules)

---

## Code of Conduct

Be respectful. Focus on academic quality and correctness. Do not add or edit questions with incorrect answer keys.

---

## Getting Started

### Option A — You have write access (team member)

```bash
git clone https://github.com/niloy-datta/sschsc-quiz.com.git
cd sschsc-quiz.com
npm install
git fetch origin
git checkout -b fix/your-branch-name origin/main
```

### Option B — Fork-based workflow (external contributor)

1. Fork the repo on GitHub: https://github.com/niloy-datta/sschsc-quiz.com
2. Clone your fork:
   ```bash
   git clone https://github.com/<your-username>/sschsc-quiz.com.git
   cd sschsc-quiz.com
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/niloy-datta/sschsc-quiz.com.git
   ```
4. Fetch upstream:
   ```bash
   git fetch upstream
   git checkout -b <your-branch> upstream/main
   ```
5. Install dependencies:
   ```bash
   npm install
   ```

---

## Branch Naming Rules

Use descriptive, slash-prefixed branch names:

| Type | Pattern | Example |
|------|---------|---------|
| Bug fix | `fix/<description>` | `fix/svg-broken-path` |
| Feature | `feat/<description>` | `feat/add-chapter-09-questions` |
| Data fix | `data/<description>` | `data/upgrade-chemistry-ch08-questions` |
| Docs | `docs/<description>` | `docs/update-contributing-guide` |
| Scripts | `scripts/<description>` | `scripts/add-svg-quality-audit` |
| Test | `test/<description>` | `test/validate-question-format` |

**❌ NEVER push directly to `main`.**

---

## Contribution Workflow

```bash
# 1. Start from latest main

# If team member (write access):
git fetch origin
git checkout -b fix/your-branch-name origin/main

# If external contributor (fork-based):
# git fetch upstream
# git checkout -b fix/your-branch-name upstream/main

# 2. Make your changes
# ... edit files ...

# 3. Run validation before committing
npm run lint
npm run typecheck
npm run test
npm run build

# 4. Commit with a clear message
git add <changed-files>
git commit -m "fix: describe what you fixed"

# 5. Push your branch
git push origin fix/your-branch-name  # fork-based
# or
git push origin fix/your-branch-name  # team member

# 6. Open a Pull Request on GitHub
```

---

## Pre-PR Checklist

Run all of the following before opening a PR and paste the results in the PR description:

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

If any command fails:
- Fix the error first.
- Rerun the command.
- Include the final result in the PR.

---

## Opening a Pull Request

1. Go to https://github.com/niloy-datta/sschsc-quiz.com/pulls
2. Click **"New pull request"**
3. Set base to `main`
4. Set compare to your branch (or fork branch)
5. Fill in the Pull Request template (see `.github/pull_request_template.md`)
6. Request review from a maintainer

---

## Important Rules

- ✅ Always work on a feature/fix branch
- ✅ Run lint, typecheck, test, and build before PR
- ✅ Never expose answer keys in public question files (`public/questions/**`)
- ✅ Always update `backend/data/answers/**` when editing questions
- ✅ Keep `answerIndex` aligned with option order
- ❌ Do NOT push directly to `main`
- ❌ Do NOT disable branch protection
- ❌ Do NOT commit `.env.local` or any secret files
- ❌ Do NOT use fake or placeholder SVGs for diagram questions
- ❌ Do NOT change correct board questions unless you have justification

---

## Data Quality Rules

When adding or editing quiz questions:

1. Question text must be meaningful and concept-based (not one-liner recall)
2. Options must be plausible distractors — not random
3. Answer key in backend must match selected option text
4. Explanation must be present in the backend answer file
5. SVG images must be valid (has `xmlns`, `viewBox`, `role="img"`, `aria-label`)
6. No answer-revealing text in SVG content (no "ধ্রুব রেখা" hints)

---

## Need Help?

Open an issue at: https://github.com/niloy-datta/sschsc-quiz.com/issues
