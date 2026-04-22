# TaskFlow — Angular + FastAPI Web Application

A full-stack task management application with:
- **Frontend**: Angular 17 (standalone components, signals, Angular Material)
- **Backend**: FastAPI (Python 3.12, async, Pydantic v2)
- **Database**: PostgreSQL via SQLAlchemy + Alembic (SQLite for tests)
- **Auth**: JWT-based authentication
- **Testing**: Playwright (e2e), pytest (backend), Jest (unit)
- **CI/CD**: GitHub Actions
- **Hosting**: Zero-cost (Render free tier + Netlify/Vercel)

## Architecture

```
taskflow/
├── backend/          # FastAPI application
│   ├── app/
│   │   ├── api/      # Route handlers
│   │   ├── models/   # SQLAlchemy models
│   │   ├── schemas/  # Pydantic schemas
│   │   ├── services/ # Business logic
│   │   └── tests/    # pytest integration tests
│   └── alembic/      # DB migrations
├── frontend/         # Angular application
│   ├── src/app/
│   │   ├── components/  # Shared UI components
│   │   ├── pages/       # Route-level pages
│   │   ├── services/    # API + state services
│   │   ├── guards/      # Route guards
│   │   ├── interceptors/ # HTTP interceptors
│   │   └── models/      # TypeScript interfaces
│   └── e2e/             # Playwright tests
└── .github/workflows/   # CI/CD pipelines
```

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
ng serve
```

### E2E Tests
```bash
cd frontend
npx playwright test
```

### Backend Tests
```bash
cd backend
pytest
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@localhost/taskflow
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:4200
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Free-Tier Hosting

| Layer    | Service       | Notes                          |
|----------|--------------|-------------------------------|
| Frontend | Netlify       | Auto-deploys from `main`       |
| Backend  | Render        | Free tier, spins down at idle  |
| Database | Neon          | Free PostgreSQL (0.5 GB)       |
| CI/CD    | GitHub Actions| Free for public repos          |
| Errors   | Sentry        | Free 5k events/month           |
