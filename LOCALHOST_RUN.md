# Localhost Run Guide

Use this guide to run the project locally on your own computer.

## 1. Install tools

Required:

- Node.js 22 recommended
- Python 3.11 or 3.12
- Git

Enable pnpm through Corepack:

```bash
corepack enable
pnpm --version
```

## 2. Clone and install

```bash
git clone https://github.com/niloy-datta/sschsc-quiz.com.git
cd sschsc-quiz.com
pnpm install --frozen-lockfile=false
```

## 3. Create environment files

Frontend:

```bash
cp .env.local.example .env.local
```

Backend:

```bash
cd backend
cp .env.example .env
cd ..
```

Fill Firebase values in `.env.local` and backend `.env` if login/dashboard API is needed.

## 4. Backend setup

Windows PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

macOS/Linux:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend URL:

```text
http://localhost:8000
http://localhost:8000/docs
```

## 5. Frontend setup

Open another terminal in the repo root:

```bash
pnpm dev
```

Frontend URL:

```text
http://localhost:3000
```

## 6. One-command dev mode

After backend Python dependencies are installed, this starts both backend and frontend:

```bash
pnpm dev:full
```

## 7. Local verification

After both servers are running:

```bash
node scripts/localhost-check.mjs
```

Expected:

- Frontend responds at `http://localhost:3000`
- Backend responds at `http://localhost:8000`
- API health responds at `http://localhost:3000/api/health` or direct backend health if configured

## Important

Do not use GitHub Pages for this full app. The project needs Next.js plus FastAPI. Localhost uses Next.js on port 3000 and FastAPI on port 8000.
