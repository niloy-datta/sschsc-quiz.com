from fastapi import APIRouter, Depends, HTTPException, status
from ..core.security import require_user
from .. import firestore

router = APIRouter(prefix="/api/user", tags=["user"])


@router.get("/progress")
async def get_user_progress(current_user: dict = Depends(require_user)):
    """
    Fetches the user's current progress across subjects and profile stats.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized"
        )

    # List of subjects we check progress for
    subjects = [
        "physics-1st-paper", "physics-2nd-paper",
        "chemistry-1st-paper", "chemistry-2nd-paper",
        "biology-1st-paper", "biology-2nd-paper",
        "higher-math-1st-paper", "higher-math-2nd-paper",
        "physics", "chemistry", "biology", "general-math", "higher-math"
    ]

    progress_summary = []
    
    # Query progress documents for each subject
    for sub in subjects:
        try:
            # path: progress/{user_id}/{subject}
            docs = await firestore.get_all_documents(f"progress/{user_id}/{sub}")
            if docs:
                for doc in docs:
                    # Enrich with subject slug
                    doc["subject"] = sub
                    progress_summary.append(doc)
        except Exception:
            # Ignore silent errors (e.g. if subcollection does not exist)
            pass

    return {
        "stats": {
            "elo": int(current_user.get("elo") or 1200),
            "totalAttempts": int(current_user.get("totalAttempts") or 0),
            "totalCorrect": int(current_user.get("totalCorrect") or 0),
            "totalWrong": int(current_user.get("totalWrong") or 0),
            "accuracy": float(current_user.get("accuracy") or 0.0),
            "streak": int(current_user.get("streak") or 0)
        },
        "progress": progress_summary
    }
