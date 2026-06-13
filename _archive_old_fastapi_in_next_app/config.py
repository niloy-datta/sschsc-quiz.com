import os
from dotenv import load_dotenv

load_dotenv()


def _normalize_url(url: str) -> str:
    return url[:-1] if url.endswith("/") else url


class Settings:
    ENVIRONMENT: str = os.getenv(
        "ENVIRONMENT",
        "production" if os.getenv("NODE_ENV") == "production" else "development",
    )

    JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-only-change-jwt-secret-in-env")
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

    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "admin123")
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "niloy.datta.dev@gmail.com")


settings = Settings()


def cookie_kwargs() -> dict:
    """Local HTTP: lax + no secure. Production HTTPS: none + secure for cross-origin."""
    is_prod = settings.ENVIRONMENT == "production"
    if is_prod:
        return {"path": "/", "httponly": True, "samesite": "none", "secure": True}
    return {"path": "/", "httponly": True, "samesite": "lax", "secure": False}


def delete_cookie_kwargs() -> dict:
    return {"path": "/"}
