# বিজ্ঞান র্যাঙ্কার — Project Prompts & Roadmap

This file contains the prompts for the complete architecture, frontend design system, homepage implementation, Firebase authentication, FastAPI backend, database schemas, seed data, quiz engines, and growth features of **“বিজ্ঞান র্যাঙ্কার”**.

---

## PROMPT 1 — Full Project Architecture Setup

You are a senior full-stack architect.
Build the complete architecture plan and initial monorepo setup for a premium Bangla SSC/HSC Science MCQ battle platform named “বিজ্ঞান র্যাঙ্কার”.

**Stack:**

- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Python
- Auth: Firebase Authentication
- Database: PostgreSQL
- ORM: SQLAlchemy or SQLModel
- Migration: Alembic
- Cache: Redis
- Storage: Firebase Storage or S3-compatible storage
- Deployment target: Vercel for frontend, Render/Railway/VPS for backend, managed PostgreSQL, Redis Cloud

**Project structure:**

- `apps/web`
- `apps/admin`
- `apps/api`
- `packages/shared`
- `docs`

**Core modules:**

1. Student frontend
2. Admin panel
3. FastAPI backend
4. Firebase Auth integration
5. PostgreSQL database
6. Quiz engine
7. Leaderboard engine
8. Premium subscription system
9. Payment verification system
10. Analytics/report system

_Important:_

- All student-facing UI text must be Bangla.
- No English UI text in student interface.
- Use mock data first where backend is not ready.
- Create clean architecture that can scale later.
- Do not implement everything in one file.
- Create reusable components and services.
- Prepare environment variable examples.
- Add README with setup instructions.

---

## PROMPT 2 — Frontend Design System

You are a world-class UI/UX engineer.
Create the complete frontend design system for “বিজ্ঞান র্যাঙ্কার”.

**Use:** Next.js, TypeScript, Tailwind CSS, Dark premium theme, Mobile-first design.

**Design style:**

- Dark navy background
- Electric purple primary
- Cyan glow secondary
- Gold premium highlight
- Glassmorphism cards
- Rounded premium buttons
- Readable Bangla typography
- Gaming dashboard energy
- No childish design
- No boring school website look

**Create components:**

- `Button`, `Card`, `Badge`, `ProgressBar`, `StatCard`, `PremiumCard`, `LockedFeatureCard`, `SectionHeader`, `Navbar`, `MobileBottomNav`, `PageContainer`, `EmptyState`, `LoadingState`

**Button variants:** `primary`, `secondary`, `premium`, `danger`, `ghost`
**Card variants:** `glass`, `dark`, `premium`, `leaderboard`, `analytics`

---

## PROMPT 3 — Homepage Implementation

Implement the full homepage for “বিজ্ঞান র্যাঙ্কার”.

**Homepage sections:**

1. Hero section
2. Free 5 MCQ challenge
3. SSC/HSC path selection
4. Today mission
5. Subject battle cards
6. Weak chapter detector preview
7. Leaderboard preview
8. Model test preview
9. Parent report section
10. Premium unlock section
11. Final CTA

---

## PROMPT 4 — Firebase Authentication Frontend

Implement Firebase Authentication in the Next.js frontend.

**Auth methods:**

1. Phone number OTP
2. Email/password
3. Google login optional

**Required pages:**

- `/login`
- `/register`
- `/profile`
- `/forgot-password`
- `/auth/complete-profile`

**Student registration fields:**

- নাম (Name)
- মোবাইল নম্বর (Mobile number)
- ইমেইল (Email - optional)
- শ্রেণি: SSC বিজ্ঞান / এইচএসসি বিজ্ঞান (Class)
- জেলা (District)
- স্কুল/কলেজ (School/College)
- পরীক্ষার বছর (Exam Year)

---

## PROMPT 5 — FastAPI Backend Foundation

Create the FastAPI backend foundation for “বিজ্ঞান র্যাঙ্কার”.

**Backend requirements:** FastAPI, PostgreSQL, SQLAlchemy or SQLModel, Alembic migration, Pydantic schemas, Firebase Admin SDK, Redis client, CORS setup, Environment variables, Modular router structure.

**Backend folder structure:**

- `app/main.py`
- `app/core/config.py`
- `app/core/security.py`
- `app/core/firebase.py`
- `app/core/database.py`
- `app/core/redis.py`
- `app/models`
- `app/schemas`
- `app/api/v1`
- `app/services`
- `app/utils`

---

## PROMPT 6 — Database Schema and Alembic Migrations

Design and implement the PostgreSQL database schema for the MCQ platform.

**Tables/models:**

1. `users`
2. `student_profiles`
3. `classes`
4. `subjects`
5. `chapters`
6. `topics`
7. `questions`
8. `question_options`
9. `quiz_sets`
10. `quiz_questions`
11. `quiz_attempts`
12. `quiz_attempt_answers`
13. `model_tests`
14. `model_test_questions`
15. `subscriptions`
16. `payments`
17. `leaderboards`
18. `user_points`
19. `wrong_answers`
20. `weakness_reports`
21. `daily_missions`
22. `parent_reports`
23. `admin_users`

---

## PROMPT 7 — Seed Data for SSC/HSC Science

Create database seed scripts for initial academic content.

---

## PROMPT 8 — Subject and Chapter API

Implement FastAPI endpoints for classes, subjects, chapters, topics, and quiz set listing.

---

## PROMPT 9 — Subject and Chapter Frontend Pages

Implement frontend pages for subjects and chapters (`/subjects`, `/subjects/[subjectId]`, `/subjects/[subjectId]/chapters/[chapterId]`).

---

## PROMPT 10 — Quiz Engine Backend

Implement the backend quiz engine (Session creation, answer logging, timer enforcement, result calculation, performance analytics).

---

## PROMPT 11 — Quiz Frontend Interface

Implement the student quiz interface (`/quiz/[quizId]`).

---

## PROMPT 12 — Result Page and Wrong Answer Practice

Implement quiz result page and wrong answer practice (`/quiz/result/[sessionId]`, `/wrong-answers`).

---

## PROMPT 13 — Student Dashboard

Implement the student dashboard (`/dashboard`).

---

## PROMPT 14 — Leaderboard System

Implement leaderboard backend and frontend.

---

## PROMPT 15 — Premium Subscription and Access Control

Implement premium subscription plans and feature locking access gates.

---

## PROMPT 16 — Payment System

Implement manual verification payment systems for bKash, Nagad, and Rocket (`/premium/checkout`).

---

## PROMPT 17 — Admin Panel

Implement content upload management forms and dashboards for super-admins (`/admin`).

---

## PROMPT 18 — Parent and Teacher Features

Implement progress reports and classroom assignment analytics.

---

## PROMPT 19 — Analytics, Notifications, and Growth Features

Implement analytics event tracking, daily mission engines, and referral programs.

---

## PROMPT 20 — Testing, Security, Deployment, and Final Polish

Finalize testing coverage, role security filters, and Vercel/Railway hosting config.
