# Lovable Agent Prompt Key

Use this prompt in the Lovable editor for the `বিজ্ঞান র্যাঙ্কার` project.

Project URL:

```text
https://lovable.dev/projects/602e1043-3469-4038-8321-39ca7eabdcd1
```

## Master Prompt

Copy and paste this into Lovable whenever you want Lovable to continue the project safely:

```text
Continue working on the existing Lovable project “বিজ্ঞান র্যাঙ্কার”. Do not rebuild from scratch. Work only inside the current app and improve it step by step.

Project identity:
- Bengali SSC/HSC Science MCQ learning platform.
- Dark premium mobile-first UI.
- Glassmorphism cards.
- Cyan/purple/gold accents.
- Ethical student study loop: weak chapter → quick MCQ → retake mistakes → rank feedback.

Strict rules:
1. Do not add ICT as a subject.
2. Do not add ICT questions.
3. Do not invent real board questions.
4. Do not invent answer keys.
5. Do not invent explanations.
6. If content is missing, show source_needed.
7. If an answer is uncertain, show answer_review_needed.
8. Demo questions must be clearly labelled demo/source_needed and must not be presented as real board questions.
9. Public UI must not expose answer keys.
10. Keep all text suitable for Bangladeshi SSC/HSC science students.

Main implementation priority:
1. Make navigation work across all pages.
2. Improve Home page CTA and study loop.
3. Build Dashboard with daily mission, streak, recent attempts, weak subject suggestions, and empty states.
4. Build SSC hub and HSC hub.
5. Build Subject detail and Chapter practice pages.
6. Build safe Quiz player with option selection, progress indicator, result screen, and retake wrong answers CTA.
7. Build Board Questions page with filters: level, subject, board, year, status.
8. Build Model Tests page with status cards.
9. Build Leaderboard with weekly/all-time tabs and empty state.
10. Build Admin Content Safety page with source_needed, answer_review_needed, public answer leak warning, and verified source checklist.

Reusable components to create or improve:
- StatusBadge
- SubjectCard
- ProgressCard
- EmptyState
- QuizOption
- SafetyNotice
- StudyLoopCard
- PageHeader
- FilterBar

Design rules:
- Mobile-first responsive layout.
- Use Bengali-friendly typography and spacing.
- Premium dark background.
- Clear CTA buttons.
- Smooth hover/active states.
- Avoid clutter.
- Use icons and simple inline SVG visuals where helpful.

When done, summarize:
- pages improved
- components created
- features implemented
- what remains blocked because verified source is needed
- confirmation that no ICT, fake board questions, fake answer keys, or fake explanations were added
```

## Quick Prompt

```text
Continue the existing বিজ্ঞান র্যাঙ্কার Lovable app. Do not rebuild. Improve the next missing page/component. Keep SSC/HSC Science only, no ICT, no fake board questions, no fake answers. Missing content must show source_needed. Add premium mobile-first UI and summarize changes.
```

## How to use

1. Open Lovable project.
2. Paste the Master Prompt.
3. Let Lovable implement.
4. Review preview.
5. For next change, paste the Quick Prompt or a specific task prompt.

## Specific task prompt template

```text
In the existing বিজ্ঞান র্যাঙ্কার Lovable app, implement [TASK NAME]. Do not rebuild from scratch. Keep the same dark premium mobile-first design. Do not add ICT. Do not invent board questions, answers, or explanations. Use source_needed or answer_review_needed where content is missing. After implementation, summarize files/pages/components changed.
```
