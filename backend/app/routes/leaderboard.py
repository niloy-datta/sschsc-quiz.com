from fastapi import APIRouter

from ..services.leaderboard_service import fetch_top_100_entries

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])


@router.get("")
async def get_leaderboard():
    """
    Returns precomputed top-100 from a single Firestore document:
    leaderboards/top_100 (1 read, no collection scan).
    """
    try:
        return await fetch_top_100_entries()
    except Exception as e:
        print(f"[ERROR] Failed to fetch leaderboard: {e}")
        return []
