import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BACKEND_APP_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

# Env load order: backend/.env → root .env → process environment (always wins)
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(PROJECT_ROOT / ".env", override=True)

SCRATCH_DIR = PROJECT_ROOT / "scratch"
DATA_DIR = PROJECT_ROOT / "data"
STATIC_SPA_DIR = PROJECT_ROOT / "app" / "static"
RAW_QUESTIONS_DIR = PROJECT_ROOT / "docs" / "raw-questions"
PARSED_QUIZZES_PATH = SCRATCH_DIR / "parsed_quizzes.json"

DEV_JWT_SECRET = "dev-only-change-jwt-secret-in-env"
DEV_ADMIN_PASSWORD = "admin123"
INSECURE_SECRET_PLACEHOLDERS = {
    "",
    DEV_JWT_SECRET,
    "change-this-secret",
    "change-this-jwt-secret",
    "CHANGE_THIS_TO_LONG_RANDOM_SECRET",
}
INSECURE_ADMIN_PASSWORDS = {
    "",
    DEV_ADMIN_PASSWORD,
    "change-this-admin-password",
    "CHANGE_THIS_TO_STRONG_ADMIN_PASSWORD",
    "CHANGE_THIS_TO_LONG_RANDOM_SECRET",
}


def _normalize_url(url: str) -> str:
    return url[:-1] if url.endswith("/") else url


def _default_environment() -> str:
    if os.getenv("ENVIRONMENT"):
        return os.getenv("ENVIRONMENT", "development")
    if os.getenv("VERCEL") == "1" or os.getenv("NODE_ENV") == "production":
        return "production"
    return "development"


class Settings:
    ENVIRONMENT: str = _default_environment()

    JWT_SECRET: str = os.getenv("JWT_SECRET", DEV_JWT_SECRET)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 7

    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "").strip()
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()

    # Firestore project ID (same as Firebase project)
    GOOGLE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "").strip()

    # Frontend origin (Next.js) — used for CORS
    _frontend_url: str = os.getenv(
        "FRONTEND_URL",
        os.getenv("APP_URL", "http://localhost:3000"),
    ).strip()
    FRONTEND_URL: str = _normalize_url(_frontend_url)

    _app_url: str = os.getenv("APP_URL", "http://localhost:3000").strip()
    APP_URL: str = _normalize_url(_app_url)

    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", DEV_ADMIN_PASSWORD)
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "niloy.datta.dev@gmail.com")

    # Legacy / unused — Prisma/MySQL package only, not active in Firestore app
    DATABASE_URL: str = os.getenv("DATABASE_URL", "").strip()


settings = Settings()


def validate_production_settings() -> None:
    """Stop unsafe production startup when required secrets are missing or weak."""
    if settings.ENVIRONMENT != "production":
        return

    missing_or_weak = []
    jwt_secret = settings.JWT_SECRET.strip()
    admin_password = settings.ADMIN_PASSWORD.strip()

    if jwt_secret in INSECURE_SECRET_PLACEHOLDERS or len(jwt_secret) < 32:
        missing_or_weak.append("JWT_SECRET")
    if admin_password in INSECURE_ADMIN_PASSWORDS or len(admin_password) < 12:
        missing_or_weak.append("ADMIN_PASSWORD")

    if missing_or_weak:
        joined = ", ".join(missing_or_weak)
        raise RuntimeError(
            f"Production config error: set strong environment value(s) for {joined}."
        )


validate_production_settings()


def cookie_kwargs() -> dict:
    """Production same-domain /api/*: lax + secure. Local HTTP: lax, no secure."""
    is_prod = settings.ENVIRONMENT == "production"
    if is_prod:
        return {"path": "/", "httponly": True, "samesite": "lax", "secure": True}
    return {"path": "/", "httponly": True, "samesite": "lax", "secure": False}


def delete_cookie_kwargs() -> dict:
    return {"path": "/"}
