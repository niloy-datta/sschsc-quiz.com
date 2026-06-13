import os
from datetime import datetime, timedelta
from typing import Optional

import jwt
import httpx
from fastapi import HTTPException, Request

from .config import settings
from .. import firestore

SESSION_COOKIE = "session"
ADMIN_EMAIL = settings.ADMIN_EMAIL


def decode_session(request: Request) -> Optional[dict]:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        return None
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
    except Exception:
        return None


async def get_user_safe(user_id: str) -> Optional[dict]:
    try:
        return await firestore.get_document("users", user_id)
    except Exception as e:
        print(f"[WARN] Firestore unavailable — falling back to JWT data: {e}")
        return None


async def resolve_firebase_user(id_token: str) -> dict:
    """Verify Firebase ID token."""
    token = (id_token or "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="Missing ID token")

    try:
        import firebase_admin
        from firebase_admin import auth as firebase_auth

        if firebase_admin._apps:
            try:
                decoded = firebase_auth.verify_id_token(token)
                email = decoded.get("email")
                return {
                    "uid": decoded["uid"],
                    "email": email,
                    "name": decoded.get("name")
                    or (email.split("@")[0] if email else "User"),
                    "picture": decoded.get("picture"),
                }
            except Exception as exc:
                print(f"[auth] Firebase Admin verify_id_token failed: {exc}")
                raise HTTPException(status_code=401, detail="Invalid Firebase ID token")
    except ImportError:
        pass

    api_key = os.getenv("FIREBASE_API_KEY", "")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Server config error: FIREBASE_API_KEY missing in backend .env",
        )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(
                f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={api_key}",
                json={"idToken": token},
            )
    except httpx.RequestError as exc:
        print(f"[auth] Firebase lookup network error: {exc}")
        raise HTTPException(
            status_code=503,
            detail="Auth service temporarily unavailable",
        )

    if res.status_code != 200:
        try:
            error_detail = (
                res.json().get("error", {}).get("message", "Token verification failed")
            )
        except Exception:
            error_detail = "Token verification failed"
        raise HTTPException(
            status_code=401,
            detail=f"Firebase token invalid: {error_detail}",
        )

    users = res.json().get("users", [])
    if not users:
        raise HTTPException(status_code=401, detail="No user found for token")

    profile = users[0]
    email = profile.get("email")
    return {
        "uid": profile.get("localId"),
        "email": email,
        "name": profile.get("displayName")
        or (email.split("@")[0] if email else "User"),
        "picture": profile.get("photoUrl"),
    }


async def verify_id_token(id_token: str) -> str:
    user = await resolve_firebase_user(id_token)
    uid = user.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid Firebase ID token")
    return uid


async def require_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    uid = None
    email = None
    name = "User"
    picture = None
    role = "STUDENT"

    if auth_header and auth_header.startswith("Bearer "):
        id_token = auth_header.split(" ")[1]
        try:
            uid = await verify_id_token(id_token)
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid Authorization Token")
    else:
        payload = decode_session(request)
        if payload:
            uid = payload.get("sub")
            email = payload.get("email")
            name = payload.get("name", "User")
            picture = payload.get("picture")
            role = payload.get("role", "STUDENT")

    if not uid:
        raise HTTPException(status_code=401, detail="Unauthorized — please log in")

    user = await get_user_safe(uid)
    if user:
        return user

    return {
        "id": uid,
        "email": email,
        "name": name,
        "picture": picture,
        "role": role,
    }


async def require_admin(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    uid = None

    if auth_header and auth_header.startswith("Bearer "):
        id_token = auth_header.split(" ")[1]
        try:
            uid = await verify_id_token(id_token)
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid Authorization Token")
    else:
        payload = decode_session(request)
        if payload:
            uid = payload.get("sub")

    if not uid:
        raise HTTPException(status_code=401, detail="Unauthorized — admin session required")

    if uid == "admin_legacy":
        return {"id": "admin_legacy", "role": "ADMIN", "name": "Administrator"}

    user = await get_user_safe(uid)
    if not user:
        raise HTTPException(status_code=403, detail="Admin privileges required (user not found)")

    role = str(user.get("role", "")).upper()
    if role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin privileges required")

    return user


def make_session_cookie(payload: dict, expire_days: int) -> str:
    payload["exp"] = datetime.utcnow() + timedelta(days=expire_days)
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.ALGORITHM)
