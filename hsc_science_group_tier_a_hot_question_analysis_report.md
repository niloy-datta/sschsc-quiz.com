# HSC Science Group Tier-A Hot Question Analysis Report

## Important honesty note

কোনো প্রশ্ন 99.9999% guaranteed common বলা যায় না। এই dataset uploaded previous-year board/model/chapter JSON থেকে high-priority, repeated-pattern, board-standard practice হিসেবে তৈরি।

## Files analyzed

- `physics-1st-paper.json` — physics-1st-paper
- `physics-2nd-paper.json` — physics-2nd-paper
- `chemistry-1st-paper.json` — chemistry-1st-paper
- `chemistry-2nd-paper.json` — chemistry-2nd-paper
- `biology-1st-paper(1).json` — biology-1st-paper
- `biology-2nd-paper.json` — biology-2nd-paper
- `higher-math-1st-paper.json` — higher-math-1st-paper
- `higher-math-2nd-paper.json` — higher-math-2nd-paper
- `ict.json` — missing, source-based ICT hot question generated করা হয়নি।

## Overall output

- Subject/paper covered: 8
- Tier-A model-test sets: 31
- Total Tier-A MCQ: 775
- MCQ per set: 25

## Subject-wise summary

### Physics 1st Paper
- Source file: `physics-1st-paper.json`
- Source questions after filtering: 1880
- Generated Tier-A sets: 5
- Generated MCQ: 125
- Source mix: {'board-question': 125}
- Top chapter/topic patterns:
  - Mixed / Board Pattern: 35
  - গতিবিদ্যা: 27
  - ভেক্টর: 25
  - কাজ, শক্তি ও ক্ষমতা: 14
  - মহাকর্ষ ও অভিকর্ষ: 11
  - পর্যাবৃত্ত গতি: 7
  - তরঙ্গ: 3
  - আদর্শ গ্যাস ও গ্যাসের গতিতত্ত্ব: 3

### Physics 2nd Paper
- Source file: `physics-2nd-paper.json`
- Source questions after filtering: 237
- Generated Tier-A sets: 5
- Generated MCQ: 125
- Source mix: {'board-question': 123, 'model-test': 2}
- Top chapter/topic patterns:
  - Mixed / Board Pattern: 50
  - তাপগতিবিদ্যা: 37
  - স্থির তড়িৎ: 13
  - জ্যামিতিক আলোকবিজ্ঞান: 6
  - চল তড়িৎ: 5
  - পরমাণু ও নিউক্লিয়ার পদার্থবিজ্ঞান: 4
  - তাড়িতচৌম্বক আবেশ ও AC: 3
  - সেমিকন্ডাক্টর ও ইলেকট্রনিক্স: 3

### Chemistry 1st Paper
- Source file: `chemistry-1st-paper.json`
- Source questions after filtering: 755
- Generated Tier-A sets: 5
- Generated MCQ: 125
- Source mix: {'board-question': 64, 'model-test': 61}
- Top chapter/topic patterns:
  - Mixed / Board Pattern: 85
  - রাসায়নিক পরিবর্তন: 22
  - মৌলের পর্যায়বৃত্ত ধর্ম ও রাসায়নিক বন্ধন: 11
  - গুণগত রসায়ন: 5
  - কর্মমুখী রসায়ন: 2

### Chemistry 2nd Paper
- Source file: `chemistry-2nd-paper.json`
- Source questions after filtering: 121
- Generated Tier-A sets: 4
- Generated MCQ: 100
- Source mix: {'board-question': 21, 'chapter-wise': 79}
- Top chapter/topic patterns:
  - অর্থনৈতিক রসায়ন: 79
  - Mixed / Board Pattern: 17
  - জৈব রসায়ন: 4

### Biology 1st Paper
- Source file: `biology-1st-paper(1).json`
- Source questions after filtering: 301
- Generated Tier-A sets: 5
- Generated MCQ: 125
- Source mix: {'board-question': 125}
- Top chapter/topic patterns:
  - কোষ ও এর গঠন: 31
  - Mixed / Board Pattern: 23
  - কোষ রসায়ন: 15
  - অনুজীব: 14
  - জীবের পরিবেশ, বিস্তার ও সংরক্ষণ: 13
  - উদ্ভিদ শারীরতত্ত্ব: 10
  - টিস্যু ও টিস্যুতন্ত্র: 9
  - কোষ বিভাজন: 4

### Biology 2nd Paper
- Source file: `biology-2nd-paper.json`
- Source questions after filtering: 476
- Generated Tier-A sets: 5
- Generated MCQ: 125
- Source mix: {'board-question': 41, 'chapter-wise': 19, 'model-test': 65}
- Top chapter/topic patterns:
  - প্রাণীর বিভিন্নতা ও শ্রেণিবিন্যাস: 29
  - রক্ত ও সঞ্চালন: 28
  - Mixed / Board Pattern: 15
  - সমন্বয় ও নিয়ন্ত্রণ: 11
  - চলন ও অঙ্গচালনা: 9
  - জিনতত্ত্ব ও বিবর্তন: 9
  - প্রাণীর পরিচিতি: 9
  - বর্জ্য ও নিষ্কাশন: 6

### Higher Math 1st Paper
- Source file: `higher-math-1st-paper.json`
- Source questions after filtering: 25
- Generated Tier-A sets: 1
- Generated MCQ: 25
- Source mix: {'board-question': 24, 'model-test': 1}
- Top chapter/topic patterns:
  - ম্যাট্রিক্স ও নির্ণায়ক: 8
  - সরলরেখা: 7
  - ত্রিকোণমিতিক অনুপাত: 6
  - অন্তরীকরণ: 3
  - ফাংশন ও গ্রাফ: 1

### Higher Math 2nd Paper
- Source file: `higher-math-2nd-paper.json`
- Source questions after filtering: 26
- Generated Tier-A sets: 1
- Generated MCQ: 25
- Source mix: {'board-question': 19, 'model-test': 6}
- Top chapter/topic patterns:
  - কনিক: 10
  - Mixed / Board Pattern: 7
  - জটিল সংখ্যা: 4
  - দ্বিপদী বিস্তৃতি: 4

## Warnings / source quality notes

- Chemistry 1st Paper file contained some Biology-like items in model-test naming/content; obvious contaminated items were filtered from Tier-A selection.
- Physics 2nd Paper has some OCR/graph-only style items; unrenderable/broken graphical options were filtered when detected.
- Higher Math 1st/2nd source files have fewer unique MCQ than other subjects, so only the strongest available source-based set(s) were generated.
- ICT file was not uploaded; source-based ICT generation was not included.

## Recommended app paths

```txt
public/quiz-data/hsc/hsc_science_group_tier_a_hot_question_bank.json
public/quiz-data/hsc/physics-1st-paper-tier-a-hot-questions.json
public/quiz-data/hsc/physics-2nd-paper-tier-a-hot-questions.json
public/quiz-data/hsc/chemistry-1st-paper-tier-a-hot-questions.json
public/quiz-data/hsc/chemistry-2nd-paper-tier-a-hot-questions.json
public/quiz-data/hsc/biology-1st-paper-tier-a-hot-questions.json
public/quiz-data/hsc/biology-2nd-paper-tier-a-hot-questions.json
public/quiz-data/hsc/higher-math-1st-paper-tier-a-hot-questions.json
public/quiz-data/hsc/higher-math-2nd-paper-tier-a-hot-questions.json
```