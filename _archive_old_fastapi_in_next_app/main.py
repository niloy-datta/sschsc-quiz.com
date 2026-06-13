import os
from datetime import datetime, timezone, timedelta
from typing import Optional, List

import jwt
import httpx
from fastapi import FastAPI, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
try:
    from mangum import Mangum
except ImportError:
    Mangum = None  # optional — only required for AWS Lambda / serverless deploy

from .config import settings, cookie_kwargs, delete_cookie_kwargs
from . import schemas
from . import firestore

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

app = FastAPI(title="Science MCQ API", version="3.0.0")

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
    examYear: Optional[int] = None
    picture: Optional[str] = None


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


async def verify_id_token(id_token: str) -> str:
    api_key = os.getenv("FIREBASE_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="Server config error: FIREBASE_API_KEY missing")
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(
            f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={api_key}",
            json={"idToken": id_token},
        )
    if res.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Firebase ID token")
    users = res.json().get("users", [])
    if not users:
        raise HTTPException(status_code=401, detail="No user found for token")
    return users[0].get("localId")


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
    id_token = payload.idToken
    api_key = os.getenv("FIREBASE_API_KEY", "")

    if not api_key:
        raise HTTPException(status_code=500, detail="Server config error: FIREBASE_API_KEY missing")

    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(
            f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={api_key}",
            json={"idToken": id_token},
        )

    if res.status_code != 200:
        error_detail = res.json().get("error", {}).get("message", "Token verification failed")
        raise HTTPException(status_code=401, detail=f"Firebase token invalid: {error_detail}")

    users_list = res.json().get("users", [])
    if not users_list:
        raise HTTPException(status_code=401, detail="No user found for this token")

    profile = users_list[0]
    firebase_uid = profile.get("localId")
    email        = profile.get("email")
    display_name = profile.get("displayName") or (email.split("@")[0] if email else "User")
    picture      = profile.get("photoUrl")

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
        profile_data = {
            "id":         user_id,
            "name":       user.get("name"),
            "email":      user.get("email"),
            "picture":    user.get("picture"),
            "role":       user.get("role", "STUDENT"),
            "mobile":     user.get("mobile", ""),
            "className":  user.get("className", ""),
            "district":   user.get("district", ""),
            "schoolName": user.get("schoolName", ""),
            "examYear":   user.get("examYear"),
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

@app.get("/api/student/dashboard")
async def get_student_dashboard(user: dict = Depends(require_user)):
    user_id = user.get("id")

    try:
        attempts_list = await firestore.run_query(
            "exam_attempts", "userId", "==", user_id, order_by="createdAt"
        )
    except Exception as e:
        print(f"[WARN] Could not fetch attempts from Firestore: {e}")
        attempts_list = []

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
        "weakChapters": [{"slug": k, "count": v} for k, v in weakness_stats.items()],
        "recentAttempts": [
            {
                "id":            a.get("id"),
                "examName":      a.get("examName"),
                "examSlug":      a.get("examSlug"),
                "score":         a.get("score"),
                "totalQuestions":a.get("totalQuestions"),
                "percentage":    a.get("percentage"),
                "createdAt":     a.get("createdAt"),
            }
            for a in attempts_list[:10]
        ],
    }


@app.post("/api/student/exam-attempts")
async def save_exam_attempt(
    payload: schemas.ExamSubmitRequest,
    user: dict = Depends(require_user),
):
    correct_count = 0
    wrong_count   = 0
    skipped_count = 0

    local_qs, _ = load_local_quizzes()
    local_by_id = {str(q.get("id")): q for q in local_qs}

    for ans in payload.answers:
        question = None
        try:
            question = await firestore.get_document("questions", str(ans.questionId))
            if not question:
                question = await firestore.get_document("quizzes", str(ans.questionId))
        except Exception:
            pass

        if not question:
            question = local_by_id.get(str(ans.questionId))

        correct_option = question.get("correctOption", "A") if question else "A"

        if not ans.selectedOption:
            skipped_count += 1
        elif ans.selectedOption == correct_option:
            correct_count += 1
        else:
            wrong_count += 1

    total_q    = len(payload.answers)
    percentage = (correct_count / total_q * 100) if total_q > 0 else 0.0

    attempt_data = {
        "userId":          user.get("id"),
        "examSlug":        payload.examSlug,
        "examName":        payload.examName,
        "backUrl":         payload.backUrl,
        "mode":            payload.mode,
        "score":           correct_count,
        "totalQuestions":  total_q,
        "correctAnswers":  correct_count,
        "wrongAnswers":    wrong_count,
        "skippedAnswers":  skipped_count,
        "percentage":      percentage,
        "timeTaken":       payload.timeTaken,
        "createdAt":       datetime.utcnow().isoformat(),
    }

    attempt_id = None
    try:
        saved = await firestore.add_document("exam_attempts", attempt_data)
        attempt_id = saved.get("id")
    except Exception as e:
        print(f"[WARN] Could not save exam attempt to Firestore: {e}")

    return {
        "id":              attempt_id,
        "score":           correct_count,
        "totalQuestions":  total_q,
        "percentage":      round(percentage, 1),
        "correctAnswers":  correct_count,
        "wrongAnswers":    wrong_count,
        "skippedAnswers":  skipped_count,
    }


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
    total_q = max(payload.totalQuestions, 0)
    score = min(max(payload.score, 0), total_q)
    wrong = max(total_q - score, 0)
    percentage = (score / total_q * 100) if total_q > 0 else 0.0
    exam_slug = f"{payload.subjectSlug}/{payload.chapterSlug}"

    attempt_data = {
        "userId":          user.get("id"),
        "examSlug":        exam_slug,
        "examName":        exam_slug.replace("/", " - "),
        "backUrl":         None,
        "mode":            "legacy",
        "score":           score,
        "totalQuestions":  total_q,
        "correctAnswers":  score,
        "wrongAnswers":    wrong,
        "skippedAnswers":  0,
        "percentage":      percentage,
        "timeTaken":       0,
        "createdAt":       datetime.utcnow().isoformat(),
    }

    attempt_id = None
    try:
        saved = await firestore.add_document("exam_attempts", attempt_data)
        attempt_id = saved.get("id")
    except Exception as e:
        print(f"[WARN] Could not save legacy quiz submit to Firestore: {e}")

    return {
        "ok": True,
        "id": attempt_id,
        "score": score,
        "totalQuestions": total_q,
        "percentage": round(percentage, 1),
    }


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
    "general-math": "General Mathematics (সাধারণ গণিত)",
    "ict": "ICT (তথ্য ও যোগাযোগ প্রযুক্তি)"
}

LOCAL_QUIZZES_FILE = "scratch/parsed_quizzes.json"
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
        if "ict" in p:
            slug = "ict"
            name = "Information & Communication Technology (ICT)"
        elif "physics" in p:
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
        
    if not os.path.exists(LOCAL_QUIZZES_FILE):
        print(f"[WARN] Local quizzes file not found at: {LOCAL_QUIZZES_FILE}")
        return [], []
        
    try:
        with open(LOCAL_QUIZZES_FILE, "r", encoding="utf-8") as f:
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
        print(f"[INFO] Successfully loaded {len(quizzes)} local quizzes from {LOCAL_QUIZZES_FILE}")
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

        filtered.append(q)

    return filtered


@app.get("/api/subjects")
async def get_all_subjects(category: Optional[str] = None):
    subjects = []
    try:
        url = (
            f"https://firestore.googleapis.com/v1/projects/"
            f"{os.getenv('FIREBASE_PROJECT_ID')}/databases/(default)/documents/subjects"
        )
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(url)
        if res.status_code == 200:
            docs = res.json().get("documents", [])
            subjects = [firestore.from_firestore_document(d) for d in docs]
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
    matched = []
    try:
        all_quizzes = await firestore.get_all_documents("quizzes")
        if not all_quizzes:
            all_quizzes = await firestore.get_all_documents("questions")

        for q in all_quizzes:
            sub_match = str(q.get("subject", "")).lower() == subject.lower()
            ch_match = True
            if chapter:
                ch_match = str(q.get("chapter", "")).lower() == chapter.lower() or str(q.get("examSlug", "")).lower() == chapter.lower()
            if sub_match and ch_match:
                matched.append(q)
    except Exception as e:
        print(f"[WARN] Firestore questions fetch failed: {e}")

    if not matched:
        local_qs, _ = load_local_quizzes()
        for q in local_qs:
            sub_match = str(q.get("subject", "")).lower() == subject.lower()
            ch_match = True
            if chapter:
                ch_match = str(q.get("chapter", "")).lower() == chapter.lower()
            if sub_match and ch_match:
                matched.append(q)

    static_pool = [
        {
            "id": "p-1-1",
            "questionText": "১ মিটার কত মিলিমিটারের সমান?",
            "optionA": "১০ মিলিমিটার", "optionB": "১০০ মিলিমিটার", "optionC": "১০০০ মিলিমিটার", "optionD": "১০০০০ মিলিমিটার",
            "correctOption": "C", "subject": "physics", "chapter": "chapter-1",
            "explanation": "১ মিটার = ১০০ সেন্টিমিটার = ১০০০ মিলিমিটার।"
        },
        {
            "id": "p-1-2",
            "questionText": "ভৌত রাশির পরিমাপের ক্ষেত্রে মাত্রার সমীকরণ কোনটির সম্পর্ক নির্দেশ করে?",
            "optionA": "মৌলিক এককের", "optionB": "লব্ধ রাশির সাথে মৌলিক রাশির", "optionC": "স্কেলার ও ভেক্টর রাশির", "optionD": "স্থিরাঙ্ক ও চলকের",
            "correctOption": "B", "subject": "physics", "chapter": "chapter-1"
        },
        {
            "id": "p-2-1",
            "questionText": "সমবেগে গতিশীল কণার ত্বরণ কত?",
            "optionA": "অসীম", "optionB": "ধ্রুবক", "optionC": "শূন্য", "optionD": "পরিবর্তনশীল",
            "correctOption": "C", "subject": "physics", "chapter": "chapter-2",
            "explanation": "সমবেগে বেগ অপরিবর্তিত থাকে, ফলে বেগের পরিবর্তনের হার বা ত্বরণ শূন্য হয়।"
        },
        {
            "id": "p-2-2",
            "questionText": "পরন্ত বস্তুর সূত্রাবলী কে আবিষ্কার করেন?",
            "optionA": "নিউটন", "optionB": "গ্যালিলিও", "optionC": "আইনস্টাইন", "optionD": "কেপলার",
            "correctOption": "B", "subject": "physics", "chapter": "chapter-2"
        },
        {
            "id": "p-3-1",
            "questionText": "বলের একক কোনটি?",
            "optionA": "ওয়াট", "optionB": "প্যাসকেল", "optionC": "নিউটন", "optionD": "জুল",
            "correctOption": "C", "subject": "physics", "chapter": "chapter-3",
            "explanation": "বলের এসআই একক নিউটন (N)।"
        },
        {
            "id": "c-1-1",
            "questionText": "আধুনিক রসায়নের জনক কে?",
            "optionA": "জন ডাল্টন", "optionB": "জাবির ইবনে হাইয়ান", "optionC": "অ্যান্টনি ল্যাভয়সিয়ে", "optionD": "রাদারফোর্ড",
            "correctOption": "C", "subject": "chemistry", "chapter": "chapter-1",
            "explanation": "অ্যান্টনি ল্যাভয়সিয়ে আধুনিক রসায়নের জনক হিসেবে পরিচিত।"
        },
        {
            "id": "b-1-1",
            "questionText": "জীববিজ্ঞানের জনক কে?",
            "optionA": "থিউফ্রাস্টাস", "optionB": "অ্যারিস্টটল", "optionC": "ডারউইন", "optionD": "ল্যামার্ক",
            "correctOption": "B", "subject": "biology", "chapter": "chapter-1",
            "explanation": "গ্রীক বিজ্ঞানী অ্যারিস্টটলকে জীববিজ্ঞানের জনক বলা হয়।"
        }
    ]

    if not matched:
        for q in static_pool:
            sub_match = q["subject"].lower() == subject.lower()
            ch_match = True
            if chapter:
                ch_match = q["chapter"].lower() == chapter.lower()
            if sub_match and ch_match:
                matched.append(q)

    return matched


@app.get("/api/leaderboard")
async def get_leaderboard():
    try:
        url = (
            f"https://firestore.googleapis.com/v1/projects/"
            f"{os.getenv('FIREBASE_PROJECT_ID')}/databases/(default)/documents/users"
        )
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(url)
        if res.status_code == 200:
            docs  = res.json().get("documents", [])
            users = [firestore.from_firestore_document(d) for d in docs]

            leaderboard = []
            for idx, u in enumerate(users[:10]):
                attempts = await firestore.run_query("exam_attempts", "userId", "==", u.get("id", ""))
                points   = sum(a.get("score", 0) for a in attempts)
                leaderboard.append({
                    "rank":       idx + 1,
                    "name":       u.get("name"),
                    "picture":    u.get("picture"),
                    "points":     points,
                    "examsTaken": len(attempts),
                })
            return sorted(leaderboard, key=lambda x: x["points"], reverse=True)
    except Exception:
        pass
    return []


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
# Static SPA Routes (Local Development)
# (In production, Vercel edge network serves these)
# ─────────────────────────────────────────────

@app.get("/admin")
async def get_admin_portal():
    return FileResponse("app/static/admin.html")

@app.get("/")
async def serve_index():
    return FileResponse("app/static/index.html")

if os.path.exists("app/static"):
    app.mount("/_next", StaticFiles(directory="app/static/_next"), name="next_static")
    app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.exception_handler(404)
async def spa_404_handler(request: Request, exc: Exception):
    # Handle API 404s properly
    if request.url.path.startswith("/api/"):
        return JSONResponse({"detail": "Not Found"}, status_code=404)
    # SPA Fallback for frontend routes
    return FileResponse("app/static/index.html")
