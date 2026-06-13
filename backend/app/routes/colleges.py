import json
from functools import lru_cache
from pathlib import Path
from typing import List

from fastapi import APIRouter, Query

from ..core.config import PROJECT_ROOT

router = APIRouter(prefix="/api/colleges", tags=["colleges"])

COLLEGES_FILE = PROJECT_ROOT / "backend" / "data" / "colleges.json"


@lru_cache(maxsize=1)
def _load_colleges() -> tuple[dict, ...]:
    if not COLLEGES_FILE.is_file():
        return ()
    try:
        raw = json.loads(COLLEGES_FILE.read_text(encoding="utf-8"))
        if not isinstance(raw, list):
            return ()
        return tuple(
            {"eiin": str(item.get("eiin", "")), "name": str(item.get("name", "")).strip()}
            for item in raw
            if item.get("name")
        )
    except Exception as exc:
        print(f"[WARN] Could not load colleges.json: {exc}")
        return ()


@router.get("")
async def search_colleges(
    search: str = Query("", alias="search", max_length=200),
) -> List[dict]:
    query = (search or "").strip()
    if len(query) < 2:
        return []

    needle = query.casefold()
    matches: List[dict] = []
    for college in _load_colleges():
        if needle in college["name"].casefold():
            matches.append(college)
            if len(matches) >= 10:
                break
    return matches
