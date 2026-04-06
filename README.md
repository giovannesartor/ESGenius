# ESG360 - ESG Intelligence Platform

Production-grade ESG SaaS platform for environmental, social, and governance data management.

## Tech Stack

- **Backend**: FastAPI, PostgreSQL, Redis, Celery, SQLAlchemy 2.0
- **Frontend**: Next.js 15, TypeScript, TailwindCSS
- **AI**: DeepSeek API for ESG data extraction, classification, and reporting
- **Auth**: JWT + Google OAuth + email verification via Resend

## Local Development

```bash
# Start all services
docker compose up --build

# Backend only
cd backend && pip install -r requirements.txt && uvicorn main:app --reload

# Frontend only
cd frontend && npm install && npm run dev
```

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in values.

## Architecture

- 12 database tables (users, companies, frameworks, indicators, data_points, documents, reports, etc.)
- Async-first with asyncpg driver
- Celery workers for document processing and report generation
- AI-powered ESG data extraction, classification, and gap analysis
