import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from .. import firestore

MAX_TOP_ENTRIES = 100


def _parse_entries(doc: Optional[dict]) -> List[Dict[str, Any]]:
    if not doc:
        return []
    raw = doc.get("entriesJson")
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, list) else []
    except (TypeError, json.JSONDecodeError):
        return []


def _serialize_entries(entries: List[Dict[str, Any]]) -> str:
    return json.dumps(entries, ensure_ascii=False)


def _normalize_entry(entry: Dict[str, Any], rank: int) -> Dict[str, Any]:
    elo = int(entry.get("elo") or entry.get("points") or 1200)
    return {
        "userId": entry.get("userId") or "",
        "name": entry.get("name") or "শিক্ষার্থী",
        "picture": entry.get("picture") or "",
        "points": elo,
        "elo": elo,
        "examsTaken": int(entry.get("examsTaken") or entry.get("totalAttempts") or 0),
        "className": entry.get("className") or "",
        "level": entry.get("level") or "ssc",
        "examYear": int(entry.get("examYear") or entry.get("targetExamYear") or 2026),
        "accuracy": float(entry.get("accuracy") or 0.0),
        "streak": int(entry.get("streak") or 0),
        "badge": entry.get("badge") or "",
        "rank": rank,
        "collegeName": entry.get("collegeName") or entry.get("schoolName") or "",
        "schoolName": entry.get("schoolName") or entry.get("collegeName") or "",
    }


async def fetch_top_100_entries() -> List[Dict[str, Any]]:
    doc = await firestore.get_top_100_leaderboard()
    entries = _parse_entries(doc)
    entries.sort(key=lambda e: int(e.get("elo") or e.get("points") or 0), reverse=True)
    return [_normalize_entry(e, idx + 1) for idx, e in enumerate(entries[:MAX_TOP_ENTRIES])]


def _build_entry(
    user_id: str,
    user_doc: Dict[str, Any],
    new_elo: int,
    new_accuracy: float,
    new_attempts: int,
    new_streak: int,
) -> Dict[str, Any]:
    return {
        "userId": user_id,
        "name": user_doc.get("name") or "শিক্ষার্থী",
        "picture": user_doc.get("picture") or "",
        "elo": new_elo,
        "points": new_elo,
        "examsTaken": new_attempts,
        "totalAttempts": new_attempts,
        "className": user_doc.get("className") or "",
        "level": user_doc.get("level") or "ssc",
        "examYear": int(
            user_doc.get("examYear")
            or user_doc.get("targetExamYear")
            or 2026
        ),
        "accuracy": new_accuracy,
        "streak": new_streak,
        "badge": user_doc.get("badge") or "",
        "collegeName": user_doc.get("collegeName") or user_doc.get("schoolName") or "",
        "schoolName": user_doc.get("schoolName") or user_doc.get("collegeName") or "",
    }


async def maybe_update_top_100(
    user_id: str,
    user_doc: Dict[str, Any],
    new_elo: int,
    new_accuracy: float,
    new_attempts: int,
    new_streak: int,
) -> None:
    """
    Incrementally maintain leaderboards/top_100 after an ELO change.
    Reads/writes exactly one Firestore document.
    """
    if new_attempts <= 0:
        return

    doc = await firestore.get_top_100_leaderboard()
    entries = _parse_entries(doc)

    updated_entry = _build_entry(
        user_id, user_doc, new_elo, new_accuracy, new_attempts, new_streak
    )

    replaced = False
    for idx, entry in enumerate(entries):
        if entry.get("userId") == user_id:
            entries[idx] = updated_entry
            replaced = True
            break

    if not replaced:
        min_elo = min(
            (int(e.get("elo") or e.get("points") or 0) for e in entries),
            default=0,
        )
        if len(entries) < MAX_TOP_ENTRIES or new_elo >= min_elo:
            entries.append(updated_entry)

    entries.sort(key=lambda e: int(e.get("elo") or e.get("points") or 0), reverse=True)
    entries = entries[:MAX_TOP_ENTRIES]

    await firestore.set_top_100_leaderboard({
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "entriesJson": _serialize_entries(entries),
        "cutoffElo": int(entries[-1].get("elo") or entries[-1].get("points") or 0)
        if entries
        else 0,
    })
