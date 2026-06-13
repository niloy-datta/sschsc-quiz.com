import json
from pathlib import Path
from typing import Dict, Any, Optional
from ..core.config import PROJECT_ROOT

# In-memory cache mapping "subject/set_id" to the answers dictionary
_answers_cache: Dict[str, Dict[str, Any]] = {}


def load_answers(subject: str, set_id: str) -> Dict[str, Any]:
    """
    Lazy loads and caches the answers JSON file.
    Offers O(1) lookup times after the first request.
    """
    cache_key = f"{subject}/{set_id}"

    if cache_key in _answers_cache:
        return _answers_cache[cache_key]

    # Resolve path: backend/data/answers/{subject}/{set_id}.answers.json
    answers_file = (
        PROJECT_ROOT / "backend" / "data" / "answers" / subject / f"{set_id}.answers.json"
    )

    if not answers_file.is_file():
        print(f"[WARN] Answers file not found at: {answers_file}")
        # Try alternate path just in case of routing slash differences
        answers_file = (
            PROJECT_ROOT / "backend" / "data" / "answers" / subject.replace("-1st-paper", "").replace("-2nd-paper", "") / f"{set_id}.answers.json"
        )
        if not answers_file.is_file():
            return {}

    try:
        with open(answers_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            _answers_cache[cache_key] = data
            return data
    except Exception as e:
        print(f"[ERROR] Failed to load answers from {answers_file}: {e}")
        return {}


def get_answer_for_question(
    subject: str, set_id: str, question_id: str
) -> Optional[Dict[str, Any]]:
    """
    Looks up a question's answer in O(1) time.
    """
    answers = load_answers(subject, set_id)
    return answers.get(question_id)
