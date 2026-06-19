# Nexus PM — Production-Ready SaaS Project Management System

Nexus PM is a professional project management platform built using a robust, modern stack:
* **Frontend**: React 19, TypeScript, Vite, TailwindCSS, Framer Motion, served via Nginx.
* **Backend**: FastAPI, Gunicorn/Uvicorn, PostgreSQL, Alembic migrations.
* **Storage**: Cloudflare R2 (S3-compatible API).
* **CI/CD**: GitHub Actions.

---

## Repository Architecture

This workspace is set up as a monorepo containing both the React frontend and the FastAPI backend.

```
nexus/
├── .github/workflows/   # CI/CD workflows (ci.yml)
├── api/                 # FastAPI routes (projects, users, auth, tasks, comments, etc.)
├── core/                # System core config & security
├── db/                  # Database connections
├── docker/              # Docker configuration files (e.g. nginx.conf)
├── frontend/            # React 19 Frontend application
├── models/              # SQLAlchemy database models
├── schemas/             # Pydantic schemas
├── services/            # Services layer (Cloudflare R2 storage, activities, email)
├── tests/               # Backend test suites
├── Dockerfile           # Backend production multi-stage Dockerfile
├── docker-compose.yml   # Multi-service composition file (db, backend, frontend)
├── entrypoint.sh        # Backend startup script (Alembic auto-migration + Gunicorn startup)
└── README.md            # System documentation
```

---

## Environment Configurations

Configuration is managed via environment variables. The codebase comes pre-configured with templates:
* **[.env.example](file:///c:/NEXUS%20PM%201/.env.example)**: Structural blueprint for environment setups.
* **[.env.development](file:///c:/NEXUS%20PM%201/.env.development)**: Development environment values for local debugging.
* **[.env.production](file:///c:/NEXUS%20PM%201/.env.production)**: Production template explaining placeholders and security recommendations.

Copy the dev template to start local development:
```bash
cp .env.development .env
```

---

## Local Development Orchestration (Docker Compose)

The easiest way to run the entire Nexus PM stack locally is using Docker Compose.

### Prerequisites
* Docker and Docker Compose installed.

### Steps
1. Create your local environment file:
   ```bash
   cp .env.development .env
   ```
2. Build and run the containers:
   ```bash
   docker-compose up --build
   ```
3. The orchestration spawns three services:
   * **PostgreSQL Database** (`nexus_db`): Port `5432` internally/externally.
   * **FastAPI Backend API** (`nexus_backend`): Port `8000` internally/externally. Auto-applies Alembic migrations on startup via [entrypoint.sh](file:///c:/NEXUS%20PM%201/entrypoint.sh).
   * **React Frontend SPA** (`nexus_frontend`): Port `80` (mapped to `http://localhost`). Serves Vite static builds via Nginx.

---

## Monitoring and Health Checks

The backend includes monitoring endpoints used by container orchestrators and load balancers:

### 1. Simple Health Check
* **Endpoint**: `GET http://localhost:8000/health`
* **Response**: `{"status": "healthy"}`
* **Purpose**: Fast uptime check (returns status 200).

### 2. Detailed Health Check
* **Endpoint**: `GET http://localhost:8000/health/detailed`
* **Response**:
  ```json
  {
    "status": "healthy",
    "database": "healthy",
    "storage": "healthy",
    "timestamp": "2026-06-19T12:00:00.000000+00:00"
  }
  ```
* **Status Matrix**:
  * **Healthy (200 OK)**: Database and Storage (Cloudflare R2 or local simulator) are fully functional.
  * **Degraded (200 OK)**: Database is healthy, but Storage is offline. Allows login, project management, and task actions to continue since only attachments are affected.
  * **Unhealthy (503 Service Unavailable)**: Database is unreachable.

---

## CI/CD Pipeline

The project features a automated GitHub Actions pipeline configured in **[.github/workflows/ci.yml](file:///c:/NEXUS%20PM%201/.github/workflows/ci.yml)**. The pipeline runs:
1. **Backend Integration Checks**: Spins up a PostgreSQL service container, runs Alembic migrations, and executes unittest suites.
2. **Frontend Validation Checks**: Sets up Node.js 20, installs dependencies, runs ESLint code checks, and builds the Vite production app.

---

## Production Deployment Blueprint

For a highly resilient, cloud-native deployment:

### 1. Database (Supabase / AWS RDS)
* Deploy a managed Postgres instance.
* Set the database URL connection string in the backend `DATABASE_URL` environment variable.

### 2. Storage Vault (Cloudflare R2)
* Provision a Cloudflare R2 bucket.
* Update `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME`.
* Enable public access or use a custom domain for R2 and configure `R2_PUBLIC_URL`.

### 3. Backend (Railway / AWS ECS / Render)
* Link the GitHub repository and specify build root directory.
* Set the Dockerfile location to `Dockerfile` in the root directory.
* Add all environment variables from `.env.production` (replacing keys with real production secrets).
* Alembic migrations run automatically on startup during container instantiation.

### 4. Frontend (Vercel / Netlify / Cloudflare Pages)
* Build configuration:
  * Framework Preset: `Vite`
  * Root directory: `frontend`
  * Build command: `npm run build`
  * Output directory: `dist`
* Environment Variables:
  * Configure `VITE_API_URL` pointing to your deployed backend URL (e.g., `https://api.yourdomain.com`).
