# Local Development Guide — Nexus PM

This guide outlines the local development setup, workspace file structure, port configurations, and mock settings.

---

## 1. Directory Structure

The repository uses a workspace layout containing a React client project and standard Python modules:

```
c:\NEXUS PM 1\
├── api/                        # FastAPI Router modules
├── core/                       # Configurations, custom logging, and middleware
├── db/                         # Database initialization and sessions
├── dependencies/               # FastAPI endpoint verification dependencies
├── frontend/                   # React 19 Frontend workspace (Vite, TS, Tailwind)
│   ├── src/
│   │   ├── api/                # Axios Client Instance
│   │   ├── components/         # Kanban boards, drawers, command palettes
│   │   ├── context/            # React global Context providers (Auth, Theme)
│   │   └── pages/              # SPA view pages (Auth, Boards, Drive, Landing)
├── models/                     # SQLAlchemy declarative model schemas
├── schemas/                    # Pydantic request/response validation schemas
├── services/                   # Business logic layers (AI, email, storage, cache)
├── tests/                      # Automated unit verification test scripts
├── Dockerfile                  # Production container building script
├── docker-compose.yml          # Local container orchestration file
├── entrypoint.sh               # Container boot commands
└── main.py                     # Root API start script
```

---

## 2. Port Allocation

During local development, verify that the following ports are open:

| Port | Service | Configuration Variable | Purpose |
| :--- | :--- | :--- | :--- |
| **`8000`** | FastAPI Backend | `BACKEND_PORT` | Serves API requests and Swagger documentation. |
| **`5173`** | Vite Dev Server | Default | Hosts the client React app with hot module reloading. |
| **`5432`** | PostgreSQL DB | `DATABASE_URL` | Connects the active database (Supabase or Local PG). |
| **`6379`** | Redis Cache | `REDIS_URL` | Manages OTP sign-ups queues and transient rate-limit counters. |

---

## 3. Developer Mock Fallbacks

To ensure developers can write code immediately without configuring paid AWS, Cloudflare, or email APIs, the project includes automated local simulator options:

### Local File Storage Fallback
If the Cloudflare R2 variables are omitted from your `.env` file, the `StorageService` automatically redirects file operations to the local disk:
* **Storage Location:** Writes file payloads directly to the [local_storage_uploads/](file:///c:/NEXUS%20PM%201/local_storage_uploads) folder.
* **Serving Assets:** Served as static files from the backend via:
  ```python
  app.mount("/static/uploads", StaticFiles(directory="local_storage_uploads"))
  ```
* **Git Safety:** These uploads are ignored in Git by `local_storage_uploads/` in the `.gitignore` index.

### Local Email Terminal Fallback
If `RESEND_API_KEY` is not configured, the email service redirects all transactional messages (such as sign-up and reset OTPs) to the backend stdout console. Simply check your terminal window for the 6-digit code during registration.

---

## 4. Local Development Workflows

### Hot Reloading
Both servers support automated hot-reloading:
* **Backend:** Launching via `python main.py` triggers Uvicorn with reload active (`reload=True`), watching for edits on any Python module inside the directory.
* **Frontend:** Vite watches frontend source directories and updates the browser instantly using Hot Module Replacement (HMR).

### Verification & Linting Checks
Run these tools locally before opening pull requests to prevent CI pipeline check failures:
```bash
# Formatter check
black --check .

# Linting check
ruff check .

# Frontend audit
cd frontend && npm run lint
```
