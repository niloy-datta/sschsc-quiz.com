import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import HTTPException, status

from .. import firestore


def _doc_id(user_id: str, submission_id: str) -> str:
    return f"{user_id}_{submission_id}"


def _parse_result(doc: Optional[dict]) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    raw = doc.get("resultJson")
    if not raw:
        return None
    try:
        return json.loads(raw)
    except (TypeError, json.JSONDecodeError):
        return None


async def claim_or_get_cached(
    user_id: str,
    submission_id: str,
    quiz_id: str,
    subject: str,
) -> Optional[Dict[str, Any]]:
    """
    Returns cached grading result if this submissionId was already processed.
    Returns None when this request should proceed with fresh scoring.
    Raises 409 if another in-flight request owns the same submissionId.
    """
    doc_id = _doc_id(user_id, submission_id)
    existing = await firestore.get_document("processed_submissions", doc_id)
    cached = _parse_result(existing)
    if cached:
        return cached

    if existing and existing.get("status") == "processing":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Submission already in progress",
        )

    claimed = await firestore.try_create_document(
        "processed_submissions",
        doc_id,
        {
            "userId": user_id,
            "submissionId": submission_id,
            "quizId": quiz_id,
            "subject": subject,
            "status": "processing",
            "createdAt": datetime.now(timezone.utc).isoformat(),
        },
    )
    if claimed:
        return None

    raced = await firestore.get_document("processed_submissions", doc_id)
    cached = _parse_result(raced)
    if cached:
        return cached
    if raced and raced.get("status") == "processing":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Submission already in progress",
        )
    return None


async def store_submission_result(
    user_id: str,
    submission_id: str,
    results: Dict[str, Any],
) -> None:
    doc_id = _doc_id(user_id, submission_id)
    await firestore.update_document(
        "processed_submissions",
        doc_id,
        {
            "resultJson": json.dumps(results, ensure_ascii=False),
            "status": "complete",
            "completedAt": datetime.now(timezone.utc).isoformat(),
        },
    )
