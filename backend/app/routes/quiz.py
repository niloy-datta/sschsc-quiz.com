from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from ..models.quiz import QuizSubmission, QuizResultResponse
from ..core.security import require_user
from ..core.rate_limit import check_rate_limit
from ..services.scoring import score_submission
from ..services.answer_loader import load_answers
from ..services.firebase_service import update_user_stats_in_background
from ..services.submission_idempotency import claim_or_get_cached, store_submission_result

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


@router.post("/submit", response_model=QuizResultResponse)
async def submit_quiz(
    payload: QuizSubmission,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_user)
):
    token_uid = current_user.get("id")
    if not token_uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="অপ্রমাণিত টোকেন। অনুগ্রহ করে আবার লগইন করুন।"
        )

    if payload.userId != token_uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="অননুমোদিত: পে-লোড ইউজার আইডি ও টোকেন ইউজার আইডি মিলছে না।"
        )

    submission_id = (payload.submissionId or "").strip()
    if not submission_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="submissionId is required",
        )

    check_rate_limit(token_uid)

    cached = await claim_or_get_cached(
        user_id=token_uid,
        submission_id=submission_id,
        quiz_id=payload.quizId,
        subject=payload.subject,
    )
    if cached:
        return cached

    user_elo = int(current_user.get("elo") or 1200)

    results = score_submission(
        subject=payload.subject,
        quiz_id=payload.quizId,
        submitted_answers=[{"id": a.id, "ans": a.ans} for a in payload.answers],
        user_rating=user_elo
    )

    total_q = results["correctCount"] + results["wrongCount"] + results["skippedCount"]
    if total_q > 0:
        results["timePerQuestion"] = round(payload.timeTaken / total_q, 1)

    await store_submission_result(token_uid, submission_id, results)

    questions_path = (payload.questionsPath or f"{payload.subject}/{payload.quizId}").strip("/")
    exam_name = (payload.examName or questions_path.replace("/", " - ").replace("-", " ")).strip()
    answer_indexes = list(payload.answerIndexes or [])
    if not answer_indexes and payload.answers:
        answer_indexes = [-1] * len(payload.answers)
    user_answers_str = ",".join(str(i) for i in answer_indexes)

    background_tasks.add_task(
        update_user_stats_in_background,
        user_id=token_uid,
        subject=payload.subject,
        chapter=payload.quizId,
        quiz_id=payload.quizId,
        correct_count=results["correctCount"],
        wrong_count=results["wrongCount"],
        skipped_count=results["skippedCount"],
        time_taken=payload.timeTaken,
        elo_delta=results["eloRatingChange"],
        weak_topics=results["weakTopics"],
        exam_name=exam_name,
        questions_path=questions_path,
        user_answers_str=user_answers_str,
    )

    return results


@router.get("/review-meta")
async def get_review_meta(
    questionsPath: str = Query(..., min_length=3, max_length=200),
    current_user: dict = Depends(require_user),
):
    del current_user
    parts = questionsPath.strip("/").split("/", 1)
    if len(parts) != 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="questionsPath must be subject/quizId",
        )

    subject, quiz_id = parts
    answers = load_answers(subject, quiz_id)
    if not answers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review metadata not found for this quiz",
        )

    meta = {
        qid: {
            "answerIndex": int(data.get("answerIndex", 0) or 0),
            "explanation": str(data.get("explanation") or ""),
        }
        for qid, data in answers.items()
    }
    return {"questionsPath": questionsPath, "answers": meta}
