import os
import json
import re
import ast
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PUBLIC_DIR = PROJECT_ROOT / "public"
QUIZ_DATA_DIR = PUBLIC_DIR / "quiz-data"
BACKEND_DIR = PROJECT_ROOT / "backend"
BACKEND_DATA_DIR = BACKEND_DIR / "data"

# Ensure output directories exist
def ensure_dir(path):
    path.mkdir(parents=True, exist_ok=True)

# Helper to map subject keys
def get_subject_slug(subject_name):
    s = subject_name.lower().strip()
    if s == "physics":
        return "physics"
    if s == "chemistry":
        return "chemistry"
    if s == "biology":
        return "biology"
    if s == "higher-math":
        return "higher-math"
    if s == "math" or s == "general-math":
        return "general-math"
    if s == "ict":
        return "ict"
    return s

def clean_opt(opt):
    if not opt:
        return ""
    return str(opt).strip()

def process_question_list(questions, subject_slug, set_id, chapter_title=""):
    public_questions = []
    private_answers = {}

    for idx, q in enumerate(questions):
        # Infer properties
        q_id = q.get("id") or f"{subject_slug}_{set_id}_q{idx+1}"
        text = q.get("questionText") or q.get("question") or q.get("text") or ""
        text = str(text).strip()
        if not text:
            continue
            
        # Parse options
        options = []
        if "options" in q and isinstance(q["options"], list):
            options = [clean_opt(o) for o in q["options"]]
        else:
            options = [
                clean_opt(q.get("optionA") or q.get("option_a") or ""),
                clean_opt(q.get("optionB") or q.get("option_b") or ""),
                clean_opt(q.get("optionC") or q.get("option_c") or ""),
                clean_opt(q.get("optionD") or q.get("option_d") or ""),
            ]
            
        # If options are empty, pad them
        while len(options) < 4:
            options.append(f"Option {len(options)+1}")
            
        options = options[:4]
        
        # Parse answer index
        correct_idx = None
        if "correctOptionIndex" in q:
            try:
                correct_idx = int(q["correctOptionIndex"])
            except (ValueError, TypeError):
                pass
        
        if correct_idx is None and "answerIndex" in q:
            try:
                correct_idx = int(q["answerIndex"])
            except (ValueError, TypeError):
                pass

        if correct_idx is None:
            # Map correctOption like 'A', 'B', 'C', 'D'
            co = str(q.get("correctOption") or q.get("correct") or "A").strip().upper()
            if co in ("A", "ক", "1"):
                correct_idx = 0
            elif co in ("B", "খ", "2"):
                correct_idx = 1
            elif co in ("C", "গ", "3"):
                correct_idx = 2
            elif co in ("D", "ঘ", "4"):
                correct_idx = 3
            else:
                correct_idx = 0

        # Safe boundaries
        correct_idx = max(0, min(3, correct_idx))
        correct_ans_text = options[correct_idx]

        # Difficulty & Explanation
        difficulty = q.get("difficulty") or 1200
        try:
            difficulty = int(difficulty)
        except (ValueError, TypeError):
            difficulty = 1200

        explanation = q.get("explanation") or q.get("shortSolution") or ""
        explanation = str(explanation).strip()

        topic = q.get("topic") or chapter_title or "General"
        topic = str(topic).strip()

        # Public Question Object
        pub_q = {
            "id": q_id,
            "subject": subject_slug,
            "chapter": chapter_title,
            "text": text,
            "options": options,
            "image": q.get("image") or None,
            "timeLimit": q.get("timeLimit") or 45
        }
        public_questions.append(pub_q)

        # Private Answer Object
        private_answers[q_id] = {
            "answer": correct_ans_text,
            "answerIndex": correct_idx,
            "difficulty": difficulty,
            "explanation": explanation,
            "topic": topic
        }

    return public_questions, private_answers

def parse_ts_file(filepath):
    """
    Parse questions array from TS files using basic AST-like literal evaluation.
    """
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the array brackets inside export const questions = [ ... ]
    match = re.search(r"export\s+const\s+questions\s*=\s*(\[.*?\])\s*;?\s*(export|default|$)", content, re.DOTALL)
    if not match:
        # Fallback if variable is different
        match = re.search(r"questions\s*=\s*(\[.*?\])", content, re.DOTALL)
        if not match:
            return []

    array_str = match.group(1)

    # Format into python literal evaluation format
    array_str = array_str.replace("true", "True").replace("false", "False").replace("null", "None")
    
    # Simple clean up of standard comments
    array_str = re.sub(r"//.*?\n", "\n", array_str)
    
    # Strip trailing commas inside arrays/dicts before parsing if Python ast complains
    # But ast.literal_eval supports trailing commas! So we just evaluate it directly.
    try:
        data = ast.literal_eval(array_str)
        return data
    except Exception as e:
        print(f"Failed ast evaluation for {filepath}: {e}")
        # Secondary fallback regex matching for individual items
        items = []
        item_matches = re.finditer(r"\{\s*question:\s*(.*?),\s*options:\s*(\[.*?\]),\s*correctOptionIndex:\s*(\d+)\s*\}", array_str, re.DOTALL)
        for m in item_matches:
            try:
                q_text = ast.literal_eval(m.group(1).strip())
                opts = ast.literal_eval(m.group(2).strip())
                idx = int(m.group(3).strip())
                items.append({
                    "question": q_text,
                    "options": opts,
                    "correctOptionIndex": idx
                })
            except Exception as ex:
                pass
        return items

def main():
    print("Starting Split Data Migration ETL...")

    # Lists to hold global parsed details for subject index creation
    subject_sets = {} # maps subject_slug -> { 'chapters': [], 'modelTests': [], 'boards': [] }

    # Helper to track registered sets to avoid duplicate index entry additions
    registered_sets = {}

    def register_set(subject_slug, set_type, set_id, display_title, count):
        key = f"{subject_slug}/{set_id}"
        if key in registered_sets:
            return
        registered_sets[key] = True

        if subject_slug not in subject_sets:
            subject_sets[subject_slug] = {
                "subject": subject_slug,
                "chapters": [],
                "modelTests": [],
                "boards": []
            }
        
        info = {
            "id": set_id,
            "title": display_title,
            "questionCount": count
        }

        if set_type == "chapter":
            subject_sets[subject_slug]["chapters"].append(info)
        elif set_type == "model-test":
            subject_sets[subject_slug]["modelTests"].append(info)
        elif set_type == "board":
            subject_sets[subject_slug]["boards"].append(info)

    # 1. PROCESS JSON FILES
    levels = ["hsc", "ssc"]
    for lvl in levels:
        lvl_dir = QUIZ_DATA_DIR / lvl
        if not lvl_dir.is_dir():
            continue

        for fpath in lvl_dir.glob("*.json"):
            # Skip index/manifest files
            if fpath.name.endswith(".model-tests.index.json") or fpath.name == "manifest.json":
                continue

            print(f"Parsing JSON database: {fpath.name}")
            with open(fpath, "r", encoding="utf-8") as f:
                try:
                    data = json.load(f)
                except Exception as e:
                    print(f"Error reading {fpath.name}: {e}")
                    continue

            subject_raw = data.get("subject") or fpath.stem
            subject_slug = get_subject_slug(subject_raw)

            # Chapters
            chapters = data.get("chapters") or {}
            for ch_slug, questions in chapters.items():
                if not questions:
                    continue
                pub_qs, pri_ans = process_question_list(questions, subject_slug, ch_slug, ch_slug)
                if not pub_qs:
                    continue

                # Save public questions
                pub_path = PUBLIC_DIR / "questions" / subject_slug / f"{ch_slug}.json"
                ensure_dir(pub_path.parent)
                with open(pub_path, "w", encoding="utf-8") as out:
                    json.dump(pub_qs, out, ensure_ascii=False, indent=2)

                # Save private answers
                pri_path = BACKEND_DATA_DIR / "answers" / subject_slug / f"{ch_slug}.answers.json"
                ensure_dir(pri_path.parent)
                with open(pri_path, "w", encoding="utf-8") as out:
                    json.dump(pri_ans, out, ensure_ascii=False, indent=2)

                register_set(subject_slug, "chapter", ch_slug, ch_slug.replace("-", " ").title(), len(pub_qs))

            # Model Tests
            model_tests = data.get("modelTests") or {}
            for mt_slug, questions in model_tests.items():
                if not questions:
                    continue
                pub_qs, pri_ans = process_question_list(questions, subject_slug, mt_slug, mt_slug)
                if not pub_qs:
                    continue

                # Save
                pub_path = PUBLIC_DIR / "questions" / subject_slug / f"{mt_slug}.json"
                ensure_dir(pub_path.parent)
                with open(pub_path, "w", encoding="utf-8") as out:
                    json.dump(pub_qs, out, ensure_ascii=False, indent=2)

                pri_path = BACKEND_DATA_DIR / "answers" / subject_slug / f"{mt_slug}.answers.json"
                ensure_dir(pri_path.parent)
                with open(pri_path, "w", encoding="utf-8") as out:
                    json.dump(pri_ans, out, ensure_ascii=False, indent=2)

                register_set(subject_slug, "model-test", mt_slug, mt_slug.replace("-", " ").title(), len(pub_qs))

            # Board Questions in JSON
            board_questions = data.get("boardQuestions") or {}
            for year, boards in board_questions.items():
                for board_name, questions in boards.items():
                    if not questions:
                        continue
                    set_id = f"{board_name}-{year}"
                    display_title = f"{board_name.title()} Board {year}"
                    pub_qs, pri_ans = process_question_list(questions, subject_slug, set_id, display_title)
                    if not pub_qs:
                        continue

                    # Save
                    pub_path = PUBLIC_DIR / "questions" / subject_slug / f"{set_id}.json"
                    ensure_dir(pub_path.parent)
                    with open(pub_path, "w", encoding="utf-8") as out:
                        json.dump(pub_qs, out, ensure_ascii=False, indent=2)

                    pri_path = BACKEND_DATA_DIR / "answers" / subject_slug / f"{set_id}.answers.json"
                    ensure_dir(pri_path.parent)
                    with open(pri_path, "w", encoding="utf-8") as out:
                        json.dump(pri_ans, out, ensure_ascii=False, indent=2)

                    register_set(subject_slug, "board", set_id, display_title, len(pub_qs))

    # 2. PROCESS TS BOARD FILES
    ts_data_dir = PROJECT_ROOT / "src" / "data" / "hsc" / "science" / "physics" / "1st-paper" / "board-questions" / "year-wise"
    if ts_data_dir.is_dir():
        print("Parsing TS files under physics board-questions...")
        subject_slug = "physics-1st-paper"
        for year_dir in ts_data_dir.iterdir():
            if not year_dir.is_dir():
                continue
            year = year_dir.name
            for ts_file in year_dir.glob("*.ts"):
                board = ts_file.stem
                questions = parse_ts_file(ts_file)
                if not questions:
                    continue

                set_id = f"{board}-{year}"
                display_title = f"{board.title()} Board {year}"
                pub_qs, pri_ans = process_question_list(questions, subject_slug, set_id, display_title)
                if not pub_qs:
                    continue

                # Save public
                pub_path = PUBLIC_DIR / "questions" / subject_slug / f"{set_id}.json"
                ensure_dir(pub_path.parent)
                with open(pub_path, "w", encoding="utf-8") as out:
                    json.dump(pub_qs, out, ensure_ascii=False, indent=2)

                # Save private
                pri_path = BACKEND_DATA_DIR / "answers" / subject_slug / f"{set_id}.answers.json"
                ensure_dir(pri_path.parent)
                with open(pri_path, "w", encoding="utf-8") as out:
                    json.dump(pri_ans, out, ensure_ascii=False, indent=2)

                register_set(subject_slug, "board", set_id, display_title, len(pub_qs))

    # 3. WRITE SUBJECT INDEX FILES
    board_order = [
        "barishal",
        "chattogram",
        "cumilla",
        "dhaka",
        "dinajpur",
        "jashore",
        "mymensingh",
        "rajshahi",
        "sylhet",
    ]

    def sort_board_index_entries(boards):
        def sort_key(entry):
            entry_id = entry.get("id", "")
            match = re.match(r"^(.+)-(\d{4})$", entry_id)
            if not match:
                return (9999, entry_id)
            board_name, year = match.group(1), int(match.group(2))
            try:
                board_idx = board_order.index(board_name)
            except ValueError:
                board_idx = 99
            return (year, board_idx)

        return sorted(boards, key=sort_key)

    for subject, index_data in subject_sets.items():
        index_data["boards"] = sort_board_index_entries(index_data.get("boards") or [])
        index_path = PUBLIC_DIR / "questions" / subject / "index.json"
        ensure_dir(index_path.parent)
        with open(index_path, "w", encoding="utf-8") as out:
            json.dump(index_data, out, ensure_ascii=False, indent=2)
        print(f"Created subject index: {index_path.relative_to(PROJECT_ROOT)}")

    print("Split Data Migration completed successfully!")

if __name__ == "__main__":
    main()
