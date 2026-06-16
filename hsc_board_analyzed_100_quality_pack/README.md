# HSC Board-Analyzed 100-Quality Pack

## What was done
- Parsed uploaded `hsc_all_questions.txt`.
- Removed duplicate repeated questions.
- Kept standalone MCQs only for premium sets.
- Quarantined stimulus/image-dependent questions for review.
- Generated paper-wise clean banks and exam-ready practice sets.

## Counts
- Raw parsed questions: 16847
- Unique after deduplication: 6660
- Accepted standalone clean questions: 5999
- Review-needed questions: 661

## Practice set summary
| Paper | Clean available | Generated sets | Questions in sets | Note |
|---|---:|---:|---:|---|
| HSC Biology 1st Paper | 575 | 10 | 250 | Full 10 sets generated from clean source. |
| HSC Biology 2nd Paper | 524 | 10 | 250 | Full 10 sets generated from clean source. |
| HSC Chemistry 1st Paper | 680 | 10 | 250 | Full 10 sets generated from clean source. |
| HSC Chemistry 2nd Paper | 335 | 10 | 250 | Full 10 sets generated from clean source. |
| HSC Higher Math 1st Paper | 1515 | 10 | 250 | Full 10 sets generated from clean source. |
| HSC Higher Math 2nd Paper | 199 | 7 | 175 | No duplicate/fake filler used. Sets limited by clean uploaded source. |
| HSC Physics 1st Paper | 1645 | 10 | 250 | Full 10 sets generated from clean source. |
| HSC Physics 2nd Paper | 526 | 10 | 250 | Full 10 sets generated from clean source. |

## Files
- `hsc_board_analyzed_standalone_bank.json` — full clean standalone bank.
- `hsc_board_analyzed_exam_ready_practice_sets.json` — app-ready premium practice sets.
- `subjects/*_standalone_clean_bank.json` — paper-wise clean banks.
- `review_needed/hsc_review_needed_stimulus_or_low_quality_questions.json` — excluded questions needing image/stimulus/context.
- `reports/analysis_report.json` — machine-readable counts.
- `reports/hsc_deduped_audit_all_unique_questions.json` — full dedupe audit.

## Guarantee note
No MCQ pack can guarantee exact common questions. This pack is generated from uploaded board/question-bank content using strict quality filtering.