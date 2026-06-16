"""
Vercel serverless entry for FastAPI.

Imports the app from backend/app/main.py — no duplicated route logic.
"""
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app  # noqa: E402


@app.get("/api/health")
def health_check():
    """Deployment health endpoint served by the FastAPI/Vercel entry."""
    return {
        "ok": True,
        "service": "sschsc-quiz-api",
        "runtime": "fastapi",
        "checkedAt": datetime.now(timezone.utc).isoformat(),
    }


try:
    from mangum import Mangum

    handler = Mangum(app, lifespan="off")
except ImportError:
    handler = app
