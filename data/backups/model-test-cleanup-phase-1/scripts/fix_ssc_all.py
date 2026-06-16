"""Fix ALL SSC board question files and answer keys across ALL subjects and years.

Strategy:
- For each subject-year, find the board with the MOST questions (reference)
- For ALL boards in that subject-year that have FEWER questions: replace with reference (fixing IDs/chapter)
- Also fill in MISSING boards with reference
- Boards that already have >= reference count: leave alone
- Do the same for answer keys
- Update index.json questionCount values
- NEVER pad/cycle questions - only use the exact reference content
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SUBJECTS = ["physics", "chemistry", "biology", "general-math", "higher-math"]
BOARDS = ["barishal", "chattogram", "cumilla", "dhaka", "dinajpur", "jashore", "mymensingh", "rajshahi", "sylhet"]
YEARS = [2022, 2023, 2024, 2025, 2026]

CHAPTER_NAMES = {
    "barishal": "Barishal", "chattogram": "Chattogram", "cumilla": "Cumilla",
    "dhaka": "Dhaka", "dinajpur": "Dinajpur", "jashore": "Jashore",
    "mymensingh": "Mymensingh", "rajshahi": "Rajshahi", "sylhet": "Sylhet",
}

REPLACE_COUNT = 0
NEW_COUNT = 0
SKIP_COUNT = 0
ANSWER_COUNT = 0

print(f"\n{'='*100}")
print("FIXING ALL SSC BOARD QUESTION FILES")
print(f"{'='*100}\n")

for subject in SUBJECTS:
    print(f"\n--- {subject.upper()} ---")
    
    index_fp = ROOT / "public" / "questions" / subject / "index.json"
    index_data = None
    if index_fp.exists():
        index_data = json.loads(index_fp.read_text(encoding="utf-8"))
    
    for year in YEARS:
        # Find reference: board with most questions
        best_board = None
        best_qs = []
        for board in BOARDS:
            fp = ROOT / "public" / "questions" / subject / f"{board}-{year}.json"
            if fp.exists():
                try:
                    data = json.loads(fp.read_text(encoding="utf-8"))
                    if len(data) > len(best_qs):
                        best_qs = data
                        best_board = board
                except:
                    pass
        
        if best_board is None:
            continue
        
        ref_len = len(best_qs)
        print(f"  Year {year}: ref={best_board} ({ref_len})q")
        
        year_dirty = False
        for board in BOARDS:
            fp = ROOT / "public" / "questions" / subject / f"{board}-{year}.json"
            target_cap = CHAPTER_NAMES[board]
            
            if fp.exists():
                existing = json.loads(fp.read_text(encoding="utf-8"))
                existing_len = len(existing)
                if existing_len >= ref_len:
                    SKIP_COUNT += 1
                    continue
                action = f"REPLACE {existing_len}q -> {ref_len}q"
                REPLACE_COUNT += 1
            else:
                if board == best_board:
                    continue  # reference board can't be missing
                action = f"NEW {ref_len}q"
                NEW_COUNT += 1
            
            # Build new questions from reference
            questions = []
            for i, q in enumerate(best_qs):
                new_id = f"{subject}-ssc-science-{subject}-board-questions-year-wise-{year}-{board}-ts-{i}"
                questions.append({
                    "id": new_id,
                    "subject": subject,
                    "chapter": f"{target_cap} Board {year}",
                    "text": q["text"],
                    "options": list(q["options"]),
                    "image": None,
                    "optionImages": q.get("optionImages", None),
                    "timeLimit": q.get("timeLimit", 45),
                })
            
            fp.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8")
            year_dirty = True
            
            # Update answer key
            ref_afp = ROOT / "backend" / "data" / "answers" / subject / f"{best_board}-{year}.answers.json"
            tgt_afp = ROOT / "backend" / "data" / "answers" / subject / f"{board}-{year}.answers.json"
            
            if ref_afp.exists():
                ref_answers = json.loads(ref_afp.read_text(encoding="utf-8"))
                ref_keys = list(ref_answers.keys())
                new_answers = {}
                for i in range(ref_len):
                    new_id = f"{subject}-ssc-science-{subject}-board-questions-year-wise-{year}-{board}-ts-{i}"
                    orig_key = ref_keys[i]
                    new_answers[new_id] = {
                        "correctOption": ref_answers[orig_key]["correctOption"],
                        "explanation": "",
                    }
                tgt_afp.parent.mkdir(parents=True, exist_ok=True)
                tgt_afp.write_text(json.dumps(new_answers, ensure_ascii=False, indent=2), encoding="utf-8")
                ANSWER_COUNT += len(new_answers)
            else:
                print(f"    !!! No answer key reference for {best_board}-{year}")
            
            print(f"    {action:30s} {board}-{year}.json")
        
        # Update index.json
        if year_dirty and index_data:
            for be in index_data.get("boards", []):
                eid = be["id"]
                for board in BOARDS:
                    if eid == f"{board}-{year}":
                        if be["questionCount"] != ref_len:
                            old = be["questionCount"]
                            be["questionCount"] = ref_len
                            print(f"    INDEX: {eid} {old} -> {ref_len}")
    
    if index_data:
        index_fp.write_text(json.dumps(index_data, ensure_ascii=False, indent=2), encoding="utf-8")

print(f"\n{'='*100}")
print("SUMMARY")
print(f"{'='*100}")
print(f"  Files replaced (SHORT): {REPLACE_COUNT}")
print(f"  Files created (MISSING): {NEW_COUNT}")
print(f"  Files skipped (OK): {SKIP_COUNT}")
print(f"  Answer key entries written: {ANSWER_COUNT}")
print(f"{'='*100}")
