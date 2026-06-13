import json
import uuid
from datetime import datetime, timezone, date
from typing import Dict, Any, List, Optional
from .. import firestore
from .leaderboard_service import maybe_update_top_100

RECENT_EXAMS_MAX = 20


def _parse_recent_exams(raw: Any) -> List[dict]:
    if not raw:
        return []
    if isinstance(raw, list):
        return [item for item in raw if isinstance(item, dict)]
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
            return [item for item in parsed if isinstance(item, dict)] if isinstance(parsed, list) else []
        except Exception:
            return []
    return []


async def _append_recent_exam(
    user_id: str,
    *,
    exam_id: str,
    exam_name: str,
    score: int,
    total: int,
    user_answers_str: str,
    questions_path: str,
    now_str: str,
    elo: int = 0,
    elo_delta: int = 0,
) -> None:
    user_doc = await firestore.get_document("users", user_id) or {}
    recent = _parse_recent_exams(user_doc.get("recentExamsJson"))
    pct = round((score / total) * 100.0, 1) if total > 0 else 0.0
    recent.append(
        {
            "examId": exam_id,
            "examName": exam_name,
            "score": score,
            "total": total,
            "percentage": pct,
            "date": now_str,
            "userAnswers": user_answers_str,
            "questionsPath": questions_path,
            "elo": elo,
            "eloDelta": elo_delta,
        }
    )
    recent = recent[-RECENT_EXAMS_MAX:]
    await firestore.update_document(
        "users",
        user_id,
        {"recentExamsJson": json.dumps(recent, ensure_ascii=False)},
    )


async def update_user_stats_in_background(
    user_id: str,
    subject: str,
    chapter: str,
    quiz_id: str,
    correct_count: int,
    wrong_count: int,
    skipped_count: int,
    time_taken: int,
    elo_delta: int,
    weak_topics: List[str],
    exam_name: Optional[str] = None,
    questions_path: Optional[str] = None,
    user_answers_str: str = "",
):
    """
    Asynchronously writes quiz results, updates user ELO,
    recalculates streak, updates leaderboard, and tracks chapter progress.
    """
    now_str = datetime.now(timezone.utc).isoformat()
    today = date.today()

    # 1. FETCH & UPDATE USER PROFILE
    user_doc = await firestore.get_document("users", user_id)
    if not user_doc:
        # Fallback default profile
        user_doc = {
            "name": "User",
            "email": "user@example.com",
            "elo": 1200,
            "totalAttempts": 0,
            "totalCorrect": 0,
            "totalWrong": 0,
            "accuracy": 0.0,
            "streak": 0,
            "updatedAt": now_str,
            "createdAt": now_str
        }

    current_elo = int(user_doc.get("elo") or 1200)
    current_attempts = int(user_doc.get("totalAttempts") or 0)
    current_correct = int(user_doc.get("totalCorrect") or 0)
    current_wrong = int(user_doc.get("totalWrong") or 0)
    current_streak = int(user_doc.get("streak") or 0)
    last_updated_str = user_doc.get("updatedAt")

    # Calculate new ELO
    new_elo = max(100, current_elo + elo_delta)
    new_attempts = current_attempts + 1
    new_correct = current_correct + correct_count
    new_wrong = current_wrong + wrong_count
    new_accuracy = round((new_correct / (new_correct + new_wrong) * 100.0), 1) if (new_correct + new_wrong) > 0 else 0.0

    # Calculate streak
    new_streak = current_streak
    if last_updated_str:
        try:
            # Check if last update was yesterday, today, or earlier
            last_date = datetime.fromisoformat(last_updated_str.replace("Z", "+00:00")).date()
            delta = today - last_date
            if delta.days == 1:
                new_streak += 1
            elif delta.days > 1:
                new_streak = 1
            # If delta.days == 0 (same day), streak remains unchanged
        except Exception:
            new_streak = 1
    else:
        new_streak = 1

    updated_user = {
        "elo": new_elo,
        "totalAttempts": new_attempts,
        "totalCorrect": new_correct,
        "totalWrong": new_wrong,
        "accuracy": new_accuracy,
        "streak": new_streak,
        "updatedAt": now_str
    }

    total_q = correct_count + wrong_count + skipped_count

    # Save user doc
    await firestore.update_document("users", user_id, updated_user)

    # Pointer hack: compact answer indexes on user doc (FIFO cap)
    exam_slug = f"{subject}/{quiz_id}"
    resolved_exam_name = exam_name or exam_slug.replace("/", " - ").replace("-", " ")
    resolved_questions_path = questions_path or exam_slug
    try:
        await _append_recent_exam(
            user_id,
            exam_id=exam_slug,
            exam_name=resolved_exam_name,
            score=correct_count,
            total=total_q,
            user_answers_str=user_answers_str,
            questions_path=resolved_questions_path,
            now_str=now_str,
            elo=new_elo,
            elo_delta=elo_delta,
        )
    except Exception as exc:
        print(f"[WARN] Could not append recentExamsJson for {user_id}: {exc}")

    # 2. UPDATE PRECOMPUTED TOP-100 (single document, no collection scan)
    merged_user = {**user_doc, **updated_user}
    try:
        await maybe_update_top_100(
            user_id=user_id,
            user_doc=merged_user,
            new_elo=new_elo,
            new_accuracy=new_accuracy,
            new_attempts=new_attempts,
            new_streak=new_streak,
        )
    except Exception as exc:
        print(f"[WARN] Could not update top_100 leaderboard: {exc}")

    # 3. SAVE ATTEMPT
    attempt_id = str(uuid.uuid4())
    percentage = round((correct_count / total_q * 100.0), 1) if total_q > 0 else 0.0
    
    # Standard flat attempts doc for querying compatibility
    attempt_doc = {
        "id": attempt_id,
        "userId": user_id,
        "quizId": quiz_id,
        "subject": subject,
        "chapter": chapter,
        "score": correct_count,
        "totalQuestions": total_q,
        "correct": correct_count,
        "wrong": wrong_count,
        "skipped": skipped_count,
        "percentage": percentage,
        "timeTaken": time_taken,
        "createdAt": now_str
    }
    # Save in attempts/{user_id}/runs/{attempt_id}
    await firestore.update_document(f"attempts/{user_id}/runs", attempt_id, attempt_doc)

    # Mirror to exam_attempts for dashboard / legacy queries
    exam_slug = f"{subject}/{quiz_id}"
    exam_attempt_doc = {
        "userId": user_id,
        "examSlug": exam_slug,
        "examName": exam_slug.replace("/", " - ").replace("-", " "),
        "backUrl": None,
        "mode": "quiz-runner",
        "score": correct_count,
        "totalQuestions": total_q,
        "correctAnswers": correct_count,
        "wrongAnswers": wrong_count,
        "skippedAnswers": skipped_count,
        "percentage": percentage,
        "timeTaken": time_taken,
        "createdAt": now_str,
    }
    try:
        await firestore.add_document("exam_attempts", exam_attempt_doc)
    except Exception as exc:
        print(f"[WARN] Could not mirror attempt to exam_attempts: {exc}")

    # 4. UPDATE CHAPTER PROGRESS
    progress_col = f"progress/{user_id}/{subject}"
    prog_doc = await firestore.get_document(progress_col, chapter)
    
    prog_attempts = 1
    prog_best = correct_count
    if prog_doc:
        prog_attempts = int(prog_doc.get("attempts") or 0) + 1
        prog_best = max(int(prog_doc.get("bestScore") or 0), correct_count)

    prog_data = {
        "attempts": prog_attempts,
        "bestScore": prog_best,
        "accuracy": percentage,
        "weakTopics": weak_topics,
        "lastAttemptAt": now_str
    }
    await firestore.update_document(progress_col, chapter, prog_data)

    print(f"[BG TASK] Sync completed for user {user_id}: ELO change {elo_delta} -> {new_elo}")
