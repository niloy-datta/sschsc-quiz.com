"""
Vercel serverless entry for FastAPI.

Imports the app from backend/app/main.py — no duplicated route logic.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app  # noqa: E402

try:
    from mangum import Mangum

    handler = Mangum(app, lifespan="off")
except ImportError:
    handler = app
