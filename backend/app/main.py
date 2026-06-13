import os
from datetime import datetime, timezone, timedelta
from typing import Optional, List

import jwt
import httpx
from fastapi import FastAPI, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
try:
    from mangum import Mangum
except ImportError:
    Mangum = None  # optional — only required for AWS Lambda / serverless deploy

from .config import (
    settings,
    cookie_kwargs,
    delete_cookie_kwargs,
    PARSED_QUIZZES_PATH,
)
from . import schemas
from . import firestore
from .routes import quiz, user, leaderboard, colleges

import json

try:
    import firebase_admin
    from firebase_admin import credentials

    if not firebase_admin._apps:
        firebase_env = os.getenv("FIREBASE_SERVICE_ACCOUNT")
        if firebase_env:
            cred_dict = json.loads(firebase_env)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app()
except ImportError:
    # Local dev can use Firestore REST only (app/firestore.py) without firebase-admin SDK
    pass

_ANSWER_KEY_FIELDS = frozenset({
    "correctOption",
    "answer",
    "explanation",
    "correctOptionText",
    "correctOptionIndex",
})


def strip_answer_keys(doc: dict) -> dict:
    """Remove answer keys before any public quiz payload leaves the API."""
    return {k: v for k, v in doc.items() if k not in _ANSWER_KEY_FIELDS}


app = FastAPI(title="Science MCQ API", version="3.0.0")

# Mount new modular routes
app.include_router(quiz.router)
app.include_router(user.router)
app.include_router(leaderboard.router)
app.include_router(colleges.router)

_cors_origins = [settings.FRONTEND_URL]
if "http://localhost:3000" not in _cors_origins:
    _cors_origins.append("http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SESSION_COOKIE = "session"
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "niloy.datta.dev@gmail.com")

SSC_EXAM_YEARS = {2027, 2028, 2029, 2030, 2031}
HSC_EXAM_YEARS = {2026, 2027, 2028, 2029, 2030}


def normalize_user_level(user: dict) -> Optional[str]:
    level = str(user.get("level") or "").strip().lower()
    if level in ("ssc", "hsc"):
        return level
    cn = str(user.get("className") or "").upper()
    if "SSC" in cn:
        return "ssc"
    if "HSC" in cn:
        return "hsc"
    return None


def is_profile_complete(user: dict) -> bool:
    level = normalize_user_level(user)
    exam_year = user.get("examYear") or user.get("targetExamYear")
    if not level or not exam_year:
        return False
    try:
        year = int(exam_year)
    except (TypeError, ValueError):
        return False
    if level == "ssc":
        return year in SSC_EXAM_YEARS
    if level == "hsc":
        return year in HSC_EXAM_YEARS
    return False


# ─────────────────────────────────────────────
# Pydantic Models
# ─────────────────────────────────────────────

class FirebaseTokenRequest(BaseModel):
    idToken: str

class StudentProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None
    className: Optional[str] = None
    district: Optional[str] = None
    schoolName: Optional[str] = None
    collegeName: Optional[str] = None
    collegeEiin: Optional[str] = None
    batch: Optional[str] = None
    examYear: Optional[int] = None
    picture: Optional[str] = None
    favoriteSubject: Optional[str] = None
    weakSubjects: Optional[str] = None


class AdminQuizCreate(BaseModel):
    questionText: str
    optionA: str
    optionB: str
    optionC: str
    optionD: str
    correctOption: str
    subject: str
    category: str
    is_live: bool = False
    explanation: Optional[str] = None


class QuizAnswer(BaseModel):
    questionId: str
    selectedOption: Optional[str] = None


class QuizSubmission(BaseModel):
    examName: str
    category: str
    is_live: bool = False
    timeTakenSeconds: int
    answers: List[QuizAnswer]


# ─────────────────────────────────────────────
# Auth Helpers
# ─────────────────────────────────────────────

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
    """Verify Firebase ID token — never checks DB password."""
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


# ─────────────────────────────────────────────
# Firebase Config Endpoint (PUBLIC)
# ─────────────────────────────────────────────

@app.get("/api/config/firebase")
def get_firebase_config():
    return {
        "apiKey":            os.getenv("FIREBASE_API_KEY", ""),
        "authDomain":        os.getenv("FIREBASE_AUTH_DOMAIN", ""),
        "projectId":         os.getenv("FIREBASE_PROJECT_ID", ""),
        "storageBucket":     os.getenv("FIREBASE_STORAGE_BUCKET", ""),
        "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID", ""),
        "appId":             os.getenv("FIREBASE_APP_ID", ""),
    }


# ─────────────────────────────────────────────
# Firebase Auth Endpoints
# ─────────────────────────────────────────────

@app.post("/api/auth/firebase")
async def auth_firebase(payload: FirebaseTokenRequest, response: Response):
    try:
        profile = await resolve_firebase_user(payload.idToken)
    except HTTPException:
        raise
    except Exception as exc:
        print(f"[auth] Unexpected firebase auth error: {exc}")
        raise HTTPException(status_code=401, detail="Invalid Firebase ID token")

    firebase_uid = profile.get("uid")
    email = profile.get("email")
    display_name = profile.get("name", "User")
    picture = profile.get("picture")

    if not firebase_uid:
        raise HTTPException(status_code=401, detail="Invalid Firebase ID token")

    if not email:
        raise HTTPException(status_code=400, detail="Firebase account has no email address")

    existing_user = await get_user_safe(firebase_uid)
    stored_role = existing_user.get("role", "STUDENT") if existing_user else "STUDENT"

    is_admin_email = email.strip().lower() == ADMIN_EMAIL.strip().lower()
    if is_admin_email:
        stored_role = "ADMIN"

    user_data = {
        "googleId":  firebase_uid,
        "email":     email,
        "name":      display_name,
        "picture":   picture,
        "role":      stored_role,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }
    if not existing_user:
        user_data["createdAt"] = datetime.utcnow().isoformat()
        user_data["mobile"] = ""
        user_data["className"] = ""
        user_data["district"] = ""
        user_data["schoolName"] = ""
        user_data["examYear"] = None

    try:
        await firestore.create_document("users", firebase_uid, user_data)
    except Exception as e:
        print(f"[WARN] Could not save user to Firestore: {e}")

    session_token = make_session_cookie(
        {
            "sub":     firebase_uid,
            "email":   email,
            "name":    display_name,
            "picture": picture,
            "role":    stored_role,
        },
        expire_days=settings.ACCESS_TOKEN_EXPIRE_DAYS,
    )

    response.set_cookie(
        key=SESSION_COOKIE,
        value=session_token,
        max_age=3600 * 24 * settings.ACCESS_TOKEN_EXPIRE_DAYS,
        **cookie_kwargs(),
    )

    return {
        "ok": True,
        "user": {
            "id":      firebase_uid,
            "name":    display_name,
            "email":   email,
            "picture": picture,
            "role":    stored_role,
        },
    }


@app.post("/api/auth/logout")
def logout(response: Response):
    response.delete_cookie(SESSION_COOKIE, **delete_cookie_kwargs())
    return {"ok": True}


@app.get("/api/auth/me")
async def get_me(request: Request):
    payload = decode_session(request)
    if not payload:
        return {"user": None}

    user_id = payload.get("sub")
    if not user_id:
        return {"user": None}

    user = await get_user_safe(user_id)
    if user:
        # Add new fields with defaults for backward compatibility
        level = normalize_user_level(user)
        exam_year = user.get("examYear") or user.get("targetExamYear")
        profile_data = {
            "id":              user_id,
            "name":            user.get("name"),
            "email":           user.get("email"),
            "picture":         user.get("picture"),
            "role":            user.get("role", "STUDENT"),
            "mobile":          user.get("mobile", ""),
            "className":       user.get("className", ""),
            "level":           level or "",
            "group":           user.get("group", "science"),
            "district":        user.get("district", ""),
            "schoolName":      user.get("schoolName", ""),
            "examYear":        exam_year,
            "targetExamYear":  exam_year,
            "favoriteSubject": user.get("favoriteSubject", ""),
            "weakSubjects":    user.get("weakSubjects", ""),
            "score":           int(user.get("score", 0) or 0),
            "rank":            user.get("rank"),
            "badge":           user.get("badge", ""),
            "profileComplete": is_profile_complete(user),
            "isPremium":       bool(user.get("isPremium", False)),
            "elo":             int(user.get("elo") or 1200),
            "streak":          int(user.get("streak") or 0),
            "collegeName":     user.get("collegeName") or user.get("schoolName", ""),
            "batch":           user.get("batch", ""),
        }
        return {"user": profile_data}

    # Fallback to JWT payload if firestore is down
    payload["id"] = user_id
    return {"user": payload}


# ─────────────────────────────────────────────
# Admin Auth (Legacy Cookie-Based)
# ─────────────────────────────────────────────

@app.post("/api/admin/login")
def admin_login(payload: schemas.AdminLoginRequest, response: Response):
    if not settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=500, detail="Server config error: ADMIN_PASSWORD missing")

    if payload.password != settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin password")

    token = make_session_cookie(
        {
            "sub":     "admin_legacy",
            "email":   "admin@local",
            "name":    "Administrator",
            "picture": None,
            "role":    "ADMIN",
        },
        expire_days=1,
    )

    cookie_opts = cookie_kwargs()
    response.set_cookie(key="isAdmin", value="1", max_age=3600, **cookie_opts)
    response.set_cookie(key=SESSION_COOKIE, value=token, max_age=3600, **cookie_opts)
    return {"ok": True}


@app.post("/api/admin/logout")
def admin_logout(response: Response):
    delete_opts = delete_cookie_kwargs()
    response.delete_cookie("isAdmin", **delete_opts)
    response.delete_cookie(SESSION_COOKIE, **delete_opts)
    return {"ok": True}


# ─────────────────────────────────────────────
# ADMIN PROTECTED ROUTES
# ─────────────────────────────────────────────

@app.get("/api/admin/dashboard-stats")
async def get_admin_dashboard_stats(admin: dict = Depends(require_admin)):
    try:
        users = await firestore.get_all_documents("users")
        total_users = len(users)
    except Exception:
        total_users = 0

    try:
        quizzes = await firestore.get_all_documents("quizzes")
        if not quizzes:
            quizzes = await firestore.get_all_documents("questions")
        total_quizzes = len(quizzes)
    except Exception:
        total_quizzes = 0

    try:
        attempts = await firestore.get_all_documents("exam_attempts")
        total_attempts = len(attempts)
    except Exception:
        total_attempts = 0

    return {
        "totalUsers": total_users,
        "totalQuizzes": total_quizzes,
        "totalExams": total_attempts
    }


@app.get("/api/admin/quizzes")
async def get_admin_quizzes(admin: dict = Depends(require_admin)):
    try:
        quizzes = await firestore.get_all_documents("quizzes")
        if not quizzes:
            quizzes = await firestore.get_all_documents("questions")
        return quizzes
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch quizzes: {e}")


@app.post("/api/admin/add-quiz")
async def add_quiz(payload: AdminQuizCreate, admin: dict = Depends(require_admin)):
    quiz_data = {
        "questionText": payload.questionText,
        "optionA": payload.optionA,
        "optionB": payload.optionB,
        "optionC": payload.optionC,
        "optionD": payload.optionD,
        "correctOption": payload.correctOption.upper(),
        "subject": payload.subject,
        "category": payload.category.upper(),
        "is_live": payload.is_live,
        "explanation": payload.explanation,
        "createdAt": datetime.utcnow().isoformat()
    }
    try:
        new_quiz = await firestore.add_document("quizzes", quiz_data)
        try:
            await firestore.add_document("questions", quiz_data)
        except Exception:
            pass
        return {"ok": True, "quiz": new_quiz}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save quiz: {e}")


@app.delete("/api/admin/delete-quiz/{quiz_id}")
async def delete_quiz(quiz_id: str, admin: dict = Depends(require_admin)):
    try:
        success = await firestore.delete_document("quizzes", quiz_id)
        try:
            await firestore.delete_document("questions", quiz_id)
        except Exception:
            pass
        if not success:
            raise HTTPException(status_code=404, detail="Quiz document not found")
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete quiz: {e}")


@app.get("/api/admin/users")
async def get_admin_users(admin: dict = Depends(require_admin)):
    try:
        users = await firestore.get_all_documents("users")
        users_list = []
        for u in users:
            uid = u.get("id")
            attempts = []
            try:
                attempts = await firestore.run_query("exam_attempts", "userId", "==", uid)
            except Exception:
                pass
            high_score = max([a.get("score", 0) for a in attempts]) if attempts else 0
            users_list.append({
                "id": uid,
                "name": u.get("name", "User"),
                "email": u.get("email", ""),
                "role": u.get("role", "STUDENT"),
                "highScore": high_score,
                "examsTaken": len(attempts)
            })
        return users_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {e}")


# ─────────────────────────────────────────────
# Student Profile Update
# ─────────────────────────────────────────────

@app.put("/api/student/profile")
async def update_student_profile(
    payload: StudentProfileUpdateRequest,
    response: Response,
    user: dict = Depends(require_user),
):
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not found in session")

    update_data = payload.dict(exclude_unset=True)
    
    # Critical fields like email or role cannot be changed via this endpoint
    if "email" in update_data: del update_data["email"]
    if "role" in update_data: del update_data["role"]

    if "collegeName" in update_data and update_data["collegeName"]:
        update_data["schoolName"] = update_data["collegeName"]

    if "batch" in update_data and update_data["batch"]:
        parts = str(update_data["batch"]).strip().split()
        if parts:
            update_data["className"] = parts[0].upper()
            if len(parts) > 1:
                try:
                    update_data["examYear"] = int(parts[1])
                except ValueError:
                    pass

    if "className" in update_data:
        cn = str(update_data["className"]).upper()
        if "SSC" in cn:
            update_data["level"] = "ssc"
        elif "HSC" in cn:
            update_data["level"] = "hsc"

    if "examYear" in update_data:
        update_data["targetExamYear"] = update_data["examYear"]

    update_data["group"] = "science"
    update_data["updatedAt"] = datetime.now(timezone.utc).isoformat()

    try:
        await firestore.update_document("users", user_id, update_data)
        updated_user_doc = await firestore.get_document("users", user_id)
        
        # If name or picture changed, we must create a new session cookie
        session_payload = {
            "sub":     user_id,
            "email":   updated_user_doc.get("email"),
            "name":    updated_user_doc.get("name"),
            "picture": updated_user_doc.get("picture"),
            "role":    updated_user_doc.get("role", "STUDENT"),
        }
        session_token = make_session_cookie(session_payload, expire_days=settings.ACCESS_TOKEN_EXPIRE_DAYS)
        response.set_cookie(
            key=SESSION_COOKIE,
            value=session_token,
            max_age=3600 * 24 * settings.ACCESS_TOKEN_EXPIRE_DAYS,
            **cookie_kwargs(),
        )

        return {"ok": True, "user": updated_user_doc}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {e}")

# ─────────────────────────────────────────────
# Student Protected Dashboard & Submissions
# ─────────────────────────────────────────────

def _dashboard_attempt_row(doc: dict) -> dict:
    exam_slug = doc.get("examSlug") or doc.get("examId")
    if not exam_slug:
        subject = doc.get("subject")
        quiz_ref = doc.get("chapter") or doc.get("quizId")
        if subject and quiz_ref:
            exam_slug = f"{subject}/{quiz_ref}"
    exam_name = doc.get("examName")
    if not exam_name and exam_slug:
        exam_name = str(exam_slug).replace("/", " - ")
    total_q = int(doc.get("totalQuestions") or doc.get("total") or 0)
    score = int(doc.get("score", 0) or 0)
    pct = doc.get("percentage")
    if pct is None and total_q > 0:
        pct = round((score / total_q) * 100.0, 1)
    return {
        "id": doc.get("id") or f"{exam_slug}-{doc.get('date') or doc.get('createdAt') or ''}",
        "examName": exam_name or "Quiz",
        "examSlug": exam_slug or "",
        "questionsPath": doc.get("questionsPath") or exam_slug or "",
        "score": score,
        "totalQuestions": total_q,
        "percentage": float(pct or 0.0),
        "createdAt": doc.get("createdAt") or doc.get("date") or "",
        "userAnswers": doc.get("userAnswers") or "",
        "elo": int(doc["elo"]) if doc.get("elo") is not None else None,
        "eloDelta": int(doc["eloDelta"]) if doc.get("eloDelta") is not None else None,
    }


def _parse_recent_exams_json(raw) -> List[dict]:
    if not raw:
        return []
    if isinstance(raw, list):
        return [item for item in raw if isinstance(item, dict)]
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
            return [item for item in parsed if isinstance(item, dict)] if isinstance(parsed, list) else []
        except Exception:
            return []
    return []


async def _load_user_profile_exams(user_id: str) -> tuple[List[dict], dict]:
    try:
        user_doc = await firestore.get_document("users", user_id)
        if not user_doc:
            return [], {"elo": 1200, "streak": 0}
        recent = [
            _dashboard_attempt_row(item)
            for item in _parse_recent_exams_json(user_doc.get("recentExamsJson"))
        ]
        player = {
            "elo": int(user_doc.get("elo") or 1200),
            "streak": int(user_doc.get("streak") or 0),
        }
        return recent, player
    except Exception as e:
        print(f"[WARN] Could not load user profile exams for {user_id}: {e}")
        return [], {"elo": 1200, "streak": 0}


async def _load_student_attempts(user_id: str) -> List[dict]:
    attempts_list: List[dict] = []
    seen_ids: set = set()

    try:
        legacy = await firestore.run_query(
            "exam_attempts", "userId", "==", user_id, order_by="createdAt"
        )
        for row in legacy:
            normalized = _dashboard_attempt_row(row)
            aid = normalized.get("id")
            if aid:
                seen_ids.add(aid)
            attempts_list.append(normalized)
    except Exception as e:
        print(f"[WARN] Could not fetch exam_attempts: {e}")

    try:
        runs = await firestore.get_documents_at_path(f"attempts/{user_id}/runs")
        for row in runs:
            aid = row.get("id")
            if aid and aid in seen_ids:
                continue
            attempts_list.append(_dashboard_attempt_row(row))
    except Exception as e:
        print(f"[WARN] Could not fetch attempts/{user_id}/runs: {e}")

    attempts_list.sort(key=lambda a: a.get("createdAt", ""), reverse=True)
    return attempts_list


@app.get("/api/student/dashboard")
async def get_student_dashboard(user: dict = Depends(require_user)):
    user_id = user.get("id")

    attempts_list = await _load_student_attempts(user_id)
    profile_recent, player = await _load_user_profile_exams(user_id)

    merged: List[dict] = []
    seen_keys: set = set()
    for row in profile_recent + attempts_list:
        key = f"{row.get('examSlug')}|{row.get('createdAt')}|{row.get('score')}"
        if key in seen_keys:
            continue
        seen_keys.add(key)
        merged.append(row)

    merged.sort(key=lambda a: a.get("createdAt", ""), reverse=True)
    attempts_list = merged

    total_exams = len(attempts_list)
    avg_score = (
        sum(a.get("score", 0) for a in attempts_list) / total_exams
        if total_exams > 0 else 0
    )
    correct_percent = (
        sum(a.get("percentage", 0.0) for a in attempts_list) / total_exams
        if total_exams > 0 else 0
    )

    weakness_stats: dict = {}
    for a in attempts_list:
        if a.get("percentage", 100) < 60 and a.get("examSlug"):
            slug = a["examSlug"]
            weakness_stats[slug] = weakness_stats.get(slug, 0) + 1

    return {
        "stats": {
            "totalExams":        total_exams,
            "averageScore":      round(avg_score, 1),
            "correctPercentage": round(correct_percent, 1),
        },
        "player": player,
        "weakChapters": [{"slug": k, "count": v} for k, v in weakness_stats.items()],
        "recentAttempts": attempts_list[:20],
    }


@app.post("/api/student/exam-attempts")
async def save_exam_attempt(
    payload: schemas.ExamSubmitRequest,
    user: dict = Depends(require_user),
):
    raise HTTPException(
        status_code=403,
        detail="Legacy endpoint disabled. Use POST /api/quiz/submit for grading.",
    )


class LegacyQuizSubmitRequest(BaseModel):
    """Legacy static SPA payload (app/static/app.js)."""
    subjectSlug: str
    chapterSlug: str
    score: int
    totalQuestions: int


@app.post("/api/student/submit-quiz")
async def submit_quiz_legacy(
    payload: LegacyQuizSubmitRequest,
    user: dict = Depends(require_user),
):
    raise HTTPException(
        status_code=403,
        detail="Legacy endpoint disabled. Use POST /api/quiz/submit for grading.",
    )


# ─────────────────────────────────────────────
# Public Data Endpoints
# ─────────────────────────────────────────────

SUBJECT_NAMES = {
    "physics": "Physics (পদার্থবিজ্ঞান)",
    "physics-1st-paper": "Physics 1st Paper (পদার্থবিজ্ঞান ১ম পত্র)",
    "physics-2nd-paper": "Physics 2nd Paper (পদার্থবিজ্ঞান ২য় পত্র)",
    "chemistry": "Chemistry (রসায়ন)",
    "chemistry-1st-paper": "Chemistry 1st Paper (রসায়ন ১ম পত্র)",
    "chemistry-2nd-paper": "Chemistry 2nd Paper (রসায়ন ২য় পত্র)",
    "biology": "Biology (জীববিজ্ঞান)",
    "biology-1st-paper": "Biology 1st Paper (জীববিজ্ঞান ১ম পত্র)",
    "biology-2nd-paper": "Biology 2nd Paper (জীববিজ্ঞান ২য় পত্র)",
    "higher-math": "Higher Math (উচ্চতর গণিত)",
    "higher-math-1st-paper": "Higher Math 1st Paper (উচ্চতর গণিত ১ম পত্র)",
    "higher-math-2nd-paper": "Higher Math 2nd Paper (উচ্চতর গণিত ২য় পত্র)",
    "math": "Mathematics (গণিত)",
    "general-math": "General Mathematics (সাধারণ গণিত)"
}

local_quizzes_cache = None
local_subjects_cache = None

def map_path_to_subject_and_category(file_path_str: str):
    p = file_path_str.lower().replace('\\', '/')
    category = "HSC" if p.startswith("hsc") else "SSC" if p.startswith("ssc") else None
    if not category:
        return None, None, None
        
    slug = None
    name = None
    
    if category == "HSC":
        if "physics" in p:
            if "1st-paper" in p or "firstpaper" in p or "1st" in p:
                slug = "physics-1st-paper"
                name = "Physics 1st Paper (পদার্থবিজ্ঞান ১ম পত্র)"
            elif "2nd-paper" in p or "secondpaper" in p or "2nd" in p:
                slug = "physics-2nd-paper"
                name = "Physics 2nd Paper (পদার্থবিজ্ঞান ২য় পত্র)"
            else:
                slug = "physics-1st-paper"
                name = "Physics 1st Paper (পদার্থবিজ্ঞান ১ম পত্র)"
        elif "chemistry" in p:
            if "1st-paper" in p or "1st" in p:
                slug = "chemistry-1st-paper"
                name = "Chemistry 1st Paper (রসায়ন ১ম পত্র)"
            elif "2nd-paper" in p or "2nd" in p:
                slug = "chemistry-2nd-paper"
                name = "Chemistry 2nd Paper (রসায়ন ২য় পত্র)"
            else:
                slug = "chemistry-1st-paper"
                name = "Chemistry 1st Paper (রসায়ন ১ম পত্র)"
        elif "higher-math" in p or "math" in p:
            if "1st-paper" in p or "1st" in p:
                slug = "higher-math-1st-paper"
                name = "Higher Math 1st Paper (উচ্চতর গণিত ১ম পত্র)"
            elif "2nd-paper" in p or "2nd" in p:
                slug = "higher-math-2nd-paper"
                name = "Higher Math 2nd Paper (উচ্চতর গণিত ২য় পত্র)"
            else:
                slug = "higher-math-1st-paper"
                name = "Higher Math 1st Paper (উচ্চতর গণিত ১ম পত্র)"
        elif "biology" in p:
            if "1st-paper" in p or "1st" in p:
                slug = "biology-1st-paper"
                name = "Biology 1st Paper (জীববিজ্ঞান ১ম পত্র)"
            elif "2nd-paper" in p or "2nd" in p:
                slug = "biology-2nd-paper"
                name = "Biology 2nd Paper (জীববিজ্ঞান ২য় পত্র)"
            else:
                slug = "biology-1st-paper"
                name = "Biology 1st Paper (জীববিজ্ঞান ১ম পত্র)"
    else: # SSC
        if "physics" in p:
            slug = "physics"
            name = "Physics (পদার্থবিজ্ঞান)"
        elif "chemistry" in p:
            slug = "chemistry"
            name = "Chemistry (রসায়ন)"
        elif "higher-math" in p:
            slug = "higher-math"
            name = "Higher Math (উচ্চতর গণিত)"
        elif "general-math" in p or "math" in p:
            slug = "math"
            name = "General Math (সাধারণ গণিত)"
        elif "biology" in p:
            slug = "biology"
            name = "Biology (জীববিজ্ঞান)"
            
    return category, slug, name

def load_local_quizzes():
    global local_quizzes_cache, local_subjects_cache
    if local_quizzes_cache is not None:
        return local_quizzes_cache, local_subjects_cache
        
    if not PARSED_QUIZZES_PATH.is_file():
        print(f"[WARN] Local quizzes file not found at: {PARSED_QUIZZES_PATH}")
        return [], []

    try:
        with open(PARSED_QUIZZES_PATH, "r", encoding="utf-8") as f:
            parsed_data = json.load(f)
            
        quizzes = []
        subjects_map = {}
        
        idx = 0
        for file_path_str, questions in parsed_data.items():
            category, subject_slug, subject_name = map_path_to_subject_and_category(file_path_str)
            if not category or not subject_slug:
                continue
                
            p = file_path_str.replace('\\', '/')
            parts = p.split('/')
            
            filename = parts[-1]
            chapter_slug = filename.replace('.ts', '').replace('.js', '')
            
            # Formatting chapter title
            chapter_title = chapter_slug.replace('-', ' ').title()
            if 'board-questions/year-wise/' in p:
                year_part = ""
                for idx_part, part in enumerate(parts):
                    if part == "year-wise" and idx_part + 1 < len(parts):
                        year_part = f" {parts[idx_part+1]} Board"
                chapter_title = f"{chapter_title}{year_part}"
                
            subject_key = f"{category.lower()}-{subject_slug}"
            
            if subject_key not in subjects_map:
                subjects_map[subject_key] = {
                    "id": subject_slug,
                    "name": subject_name,
                    "slug": subject_slug,
                    "category": category,
                    "chapters": []
                }
                
            existing_ch = [c for c in subjects_map[subject_key]["chapters"] if c["slug"] == chapter_slug]
            if not existing_ch:
                subjects_map[subject_key]["chapters"].append({
                    "id": f"{subject_slug}-{chapter_slug}",
                    "title": chapter_title,
                    "slug": chapter_slug
                })
                
            is_live = "live" in p or "model-tests" in p
            
            for q in questions:
                idx += 1
                quizzes.append({
                    "id": f"lq-{idx}",
                    "questionText": q.get("question_text", ""),
                    "optionA": q.get("options", {}).get("A", ""),
                    "optionB": q.get("options", {}).get("B", ""),
                    "optionC": q.get("options", {}).get("C", ""),
                    "optionD": q.get("options", {}).get("D", ""),
                    "correctOption": q.get("answer", "A"),
                    "subject": subject_slug,
                    "chapter": chapter_slug,
                    "category": category,
                    "is_live": is_live,
                    "explanation": q.get("explanation", "")
                })
                
        local_quizzes_cache = quizzes
        local_subjects_cache = list(subjects_map.values())
        print(f"[INFO] Successfully loaded {len(quizzes)} local quizzes from {PARSED_QUIZZES_PATH}")
        return local_quizzes_cache, local_subjects_cache
    except Exception as e:
        print(f"[ERROR] Failed to load local quizzes: {e}")
        return [], []

STATIC_SUBJECTS = [
    {
        "id": "physics", "name": "Physics (পদার্থবিজ্ঞান)", "slug": "physics", "category": "SSC",
        "chapters": [
            {"id": "physics-ch1", "title": "ভৌত রাশি ও পরিমাপ",      "slug": "chapter-1"},
            {"id": "physics-ch2", "title": "গতি (Motion)",             "slug": "chapter-2"},
            {"id": "physics-ch3", "title": "বল (Force)",               "slug": "chapter-3"},
            {"id": "physics-ch4", "title": "কাজ, শক্তি ও ক্ষমতা",    "slug": "chapter-4"},
            {"id": "physics-ch5", "title": "পদার্থের অবস্থা ও চাপ",  "slug": "chapter-5"},
        ],
    },
    {
        "id": "chemistry", "name": "Chemistry (রসায়ন)", "slug": "chemistry", "category": "SSC",
        "chapters": [
            {"id": "chemistry-ch1", "title": "রসায়নের ধারণা",    "slug": "chapter-1"},
            {"id": "chemistry-ch2", "title": "পদার্থের অবস্থা",   "slug": "chapter-2"},
            {"id": "chemistry-ch3", "title": "পদার্থের গঠন",      "slug": "chapter-3"},
            {"id": "chemistry-ch4", "title": "পর্যায় সারণি",      "slug": "chapter-4"},
            {"id": "chemistry-ch5", "title": "রাসায়নিক বন্ধন",   "slug": "chapter-5"},
        ],
    },
    {
        "id": "biology", "name": "Biology (জীববিজ্ঞান)", "slug": "biology", "category": "SSC",
        "chapters": [
            {"id": "biology-ch1", "title": "জীবন পাঠ",            "slug": "chapter-1"},
            {"id": "biology-ch2", "title": "কোষ ও এর গঠন",       "slug": "chapter-2"},
            {"id": "biology-ch3", "title": "কোষ বিভাজন",         "slug": "chapter-3"},
            {"id": "biology-ch4", "title": "জীবনীশক্তি",          "slug": "chapter-4"},
        ],
    },
]


STATIC_QUIZZES = [
    {
        "id": "sq-1",
        "questionText": "একটি প্রত্যগামী (Reversible) এবং পূর্ণ কার্নো চক্রে মোট এন্ট্রপির পরিবর্তন কত?",
        "optionA": "শূন্য", "optionB": "ধনাত্মক", "optionC": "ঋণাত্মক", "optionD": "অসীম",
        "correctOption": "A", "subject": "physics", "category": "HSC", "is_live": False,
        "explanation": "পূর্ণ চক্রে প্রাথমিক ও চূড়ান্ত অবস্থা একই হয়, তাই প্রত্যগামী প্রক্রিয়ায় এন্ট্রপির পরিবর্তন সবসময় শূন্য হয়।"
    },
    {
        "id": "sq-2",
        "questionText": "১ মিটার কত মিলিমিটারের সমান?",
        "optionA": "১০ মিলিমিটার", "optionB": "১০০ মিলিমিটার", "optionC": "১০০০ মিলিমিটার", "optionD": "১০০০০ মিলিমিটার",
        "correctOption": "C", "subject": "physics", "category": "SSC", "is_live": False,
        "explanation": "১ মিটার = ১০০ সেন্টিমিটার = ১০০০ মিলিমিটার।"
    },
    {
        "id": "sq-3",
        "questionText": "সমবেগে গতিশীল কণার ত্বরণ কত?",
        "optionA": "অসীম", "optionB": "ধ্রুবক", "optionC": "শূন্য", "optionD": "পরিবর্তনশীল",
        "correctOption": "C", "subject": "physics", "category": "SSC", "is_live": True,
        "explanation": "সমবেগে বেগ অপরিবর্তিত থাকে, ফলে বেগের পরিবর্তনের হার বা ত্বরণ শূন্য হয়।"
    },
    {
        "id": "sq-4",
        "questionText": "উদ্ভিদের বৃদ্ধি পরিমাপক যন্ত্র কোনটি?",
        "optionA": "ক্রেসকোগ্রাফ", "optionB": "ক্রনোগ্রাফ", "optionC": "ব্যারোগ্রাফ", "optionD": "কার্ডিওগ্রাফ",
        "correctOption": "A", "subject": "biology", "category": "Admission", "is_live": False,
        "explanation": "জগদীশচন্দ্র বসু ক্রেসকোগ্রাফ যন্ত্র আবিষ্কার করেন যা উদ্ভিদের সূক্ষ্ম বৃদ্ধি পরিমাপ করতে পারে।"
    },
    {
        "id": "sq-5",
        "questionText": "ডি-ব্রগলি (de Broglie) তরঙ্গদৈর্ঘ্যের সমীকরণ কোনটি?",
        "optionA": "λ = p/h", "optionB": "λ = h/p", "optionC": "λ = hp", "optionD": "λ = h/E",
        "correctOption": "B", "subject": "physics", "category": "HSC", "is_live": True,
        "explanation": "ডি-ব্রগলি সূত্রানুযায়ী গতিশীল কণার তরঙ্গদৈর্ঘ্য λ = h/p, যা কণার ভরবেগের ব্যস্তানুপাতিক।"
    }
]


@app.get("/api/quizzes")
async def get_quizzes(category: Optional[str] = None, live: Optional[str] = None):
    quizzes = []
    try:
        quizzes = await firestore.get_all_documents("quizzes")
        if not quizzes:
            quizzes = await firestore.get_all_documents("questions")
    except Exception as e:
        print(f"[WARN] Firestore fetch failed, falling back to local/static pool: {e}")
        quizzes = []

    if not quizzes:
        local_qs, _ = load_local_quizzes()
        quizzes = local_qs if local_qs else STATIC_QUIZZES

    filtered = []
    for q in quizzes:
        if category:
            q_cat = str(q.get("category", ""))
            if not q_cat or q_cat.upper() != category.upper():
                continue

        if live is not None:
            is_live_val = str(live).lower() in ("true", "1", "yes")
            q_live = q.get("is_live", False)
            q_live_bool = q_live is True or str(q_live).lower() in ("true", "1", "yes")
            if q_live_bool != is_live_val:
                continue

        filtered.append(strip_answer_keys(q))

    return filtered


@app.get("/api/subjects")
async def get_all_subjects(category: Optional[str] = None):
    subjects = []
    try:
        subjects = await firestore.get_all_documents("subjects")
    except Exception:
        pass

    if not subjects:
        _, local_subs = load_local_quizzes()
        subjects = local_subs if local_subs else STATIC_SUBJECTS

    if category:
        cat_upper = category.upper()
        subjects = [
            s for s in subjects
            if str(s.get("category", "")).upper() == cat_upper
        ]

    return subjects


@app.get("/api/questions")
async def get_questions(subject: str, chapter: Optional[str] = None):
    raise HTTPException(
        status_code=403,
        detail="This endpoint has been disabled. Questions are served from static JSON only.",
    )


# Legacy leaderboard route replaced by modular routes/leaderboard.py router


# ─────────────────────────────────────────────
# Health Check
# ─────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    return {"status": "ok", "version": "3.0.0", "mode": "serverless"}


# ─────────────────────────────────────────────
# Mangum — AWS Lambda / Serverless Adapter
# ─────────────────────────────────────────────

handler = Mangum(app) if Mangum else None

# ─────────────────────────────────────────────
# API Status Root Route
# ─────────────────────────────────────────────

@app.get("/")
async def serve_root():
    return {
        "status": "active",
        "message": "Science MCQ API is running",
        "version": "3.0.0",
        "docs": "/docs"
    }

@app.exception_handler(404)
async def api_404_handler(request: Request, exc: Exception):
    return JSONResponse({"detail": "Not Found"}, status_code=404)
