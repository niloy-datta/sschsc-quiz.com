import time
from typing import Dict
from fastapi import HTTPException, status

# In-memory dictionary tracking user request timestamps
# key: user_id -> value: last_timestamp
_submission_timestamps: Dict[str, float] = {}

# Time window in seconds between submissions (e.g., 5 seconds)
SUBMIT_RATE_LIMIT_SECONDS = 5.0


def check_rate_limit(user_id: str):
    """
    Checks if a user is calling the endpoint too quickly.
    Raises HTTPException (429) if threshold is breached.
    """
    now = time.time()
    last_time = _submission_timestamps.get(user_id)

    if last_time is not None:
        elapsed = now - last_time
        if elapsed < SUBMIT_RATE_LIMIT_SECONDS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"সরাসরি পরপর সাবমিট করা যাবে না। অনুগ্রহ করে {int(SUBMIT_RATE_LIMIT_SECONDS - elapsed) + 1} সেকেন্ড অপেক্ষা করুন।"
            )

    _submission_timestamps[user_id] = now
