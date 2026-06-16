# ICT Removal — Delegated to Command Code / Ollama

**User rule:** ICT website-এ থাকবে না। Cursor agent কোড করবে না — শুধু Command Code বা Ollama।

## Current state (audit)

| Item | Status |
|------|--------|
| HSC hub (`quiz-catalog.ts`, `registry.ts`) | ICT **নেই** — hub-এ দেখায় না |
| Dynamic route `/hsc/ict` | **খোলা** — `app/[level]/[subject]/page.tsx` যেকোনো slug নেয় |
| `public/questions/ict/` | **50 JSON** — সাইটে লোড হতে পারে |
| `scripts/fix-quiz-data-integrity.js` | ICT SUBJECTS-এ আছে |
| 34 missing answer audit | সব ICT — fix করার দরকার নেই যদি ICT সরানো হয় |

## Command Code (preferred — নেট ঠিক থাকলে)

```powershell
cd "C:\Users\Niloy Chandra\Documents\dev-quiz-dashboard"
& "$env:APPDATA\npm\command-code.cmd" -p --trust --yolo --skip-onboarding --max-turns 35 --model deepseek/deepseek-v4-flash "Remove HSC ICT from website: move public/questions/ict and backend/data/answers/ict to data/quarantine/ict-removed; remove ict from scripts/fix-quiz-data-integrity.js SUBJECTS; block /hsc/ict and /ssc/ict with notFound in app/[level]/[subject]/page.tsx; run npm run data:rebuild-index; npm run typecheck; npm run build; update WORKFLOW_REPORT.md"
```

Pro plan থাকলে: `--model claude-opus-4-8`

## Ollama (local — planning only)

Ollama ফাইল এডিট করতে পারে না। শুধু পরিকল্পনা/স্ক্রিপ্ট টেক্সট দেয়।

```powershell
ollama run qwen2.5-coder:7b "Read data/ICT-REMOVAL-DELEGATION.md and write a Node.js script scripts/quarantine-ict.js"
```

## Delegation attempts (2026-06-16)

- Command Code `deepseek-v4-flash`: **network error** (exit 6)
- Ollama `qwen2.5-coder:7b`: hung / incomplete
- Ollama `llama3.2:1b`: generic steps (not repo-specific)
