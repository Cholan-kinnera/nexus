# Repository Audit & Technical Debt Report — Nexus PM

This document maps out the subsystem implementation status, evaluates codebase technical debt, and scores production readiness.

---

## 1. Subsystem Architecture Accuracy Report

### Authentication
* **Status:** Implemented
* **Evidence:**
  * [api/routes/auth.py](file:///c:/NEXUS%20PM%201/api/routes/auth.py) (Sign-up, login, refresh, logout endpoints)
  * [services/auth_service.py](file:///c:/NEXUS%20PM%201/services/auth_service.py) (Password hashing, token generation, user creation)
  * [frontend/src/context/AuthContext.tsx](file:///c:/NEXUS%20PM%201/frontend/src/context/AuthContext.tsx) (Token and user context management)
  * [models/refresh_token.py](file:///c:/NEXUS%20PM%201/models/refresh_token.py) (Database refresh tokens)

### Project & Task Management
* **Status:** Implemented
* **Evidence:**
  * [api/routes/projects.py](file:///c:/NEXUS%20PM%201/api/routes/projects.py) (CRUD for projects and member associations)
  * [api/routes/tasks.py](file:///c:/NEXUS%20PM%201/api/routes/tasks.py) (CRUD for tasks, priorities, stages)
  * [frontend/src/pages/TasksPage.tsx](file:///c:/NEXUS%20PM%201/frontend/src/pages/TasksPage.tsx) (Kanban drag-and-drop UI board)

### Notifications System
* **Status:** Implemented
* **Evidence:**
  * [api/routes/notifications.py](file:///c:/NEXUS%20PM%201/api/routes/notifications.py) (Notification feeds and read markers)
  * [models/notification.py](file:///c:/NEXUS%20PM%201/models/notification.py) (Database structure for notification records)
  * [frontend/src/components/dashboard/Navbar.tsx](file:///c:/NEXUS%20PM%201/frontend/src/components/dashboard/Navbar.tsx) (Dynamic notification badge dropdown overlay)

### AI Features (Gemini Integration)
* **Status:** Implemented
* **Evidence:**
  * [api/routes/ai.py](file:///c:/NEXUS%20PM%201/api/routes/ai.py) (API route to call task generation logic)
  * [services/ai_service.py](file:///c:/NEXUS%20PM%201/services/ai_service.py) (Client using the new `google-genai` SDK)
  * [frontend/src/components/NexusAI/NexusAIWidget.tsx](file:///c:/NEXUS%20PM%201/frontend/src/components/NexusAI/NexusAIWidget.tsx) (Sidebar task suggestion floating drawer)
* **Scope Discrepancy Note:** While early plans suggested AI summaries, health analyzers, and automated assignment, the **only** currently implemented AI feature is Gemini-based Task Generation. Other features remain in the planning phase.

### Storage Management
* **Status:** Implemented
* **Evidence:**
  * [api/routes/storage.py](file:///c:/NEXUS%20PM%201/api/routes/storage.py) (Upload and file retrieval routes)
  * [services/storage_service.py](file:///c:/NEXUS%20PM%201/services/storage_service.py) (Cloudflare R2 integration + Local folder simulation mode)
  * [frontend/src/pages/StoragePage.tsx](file:///c:/NEXUS%20PM%201/frontend/src/pages/StoragePage.tsx) (Drive file explorer interface)

### Cache & Rate Limiting (Redis)
* **Status:** Implemented
* **Evidence:**
  * [services/redis_service.py](file:///c:/NEXUS%20PM%201/services/redis_service.py) (OTP validation locks, temporary signup queues, connection checks)
  * [main.py](file:///c:/NEXUS%20PM%201/main.py) (Lifespan connecting/disconnecting to redis connection pool)

### Email Dispatch (Resend Gateway)
* **Status:** Implemented
* **Evidence:**
  * [services/email.py](file:///c:/NEXUS%20PM%201/services/email.py) (Resend API client configuration with console logging fallback)

---

## 2. Technical Debt Report

| File / Context | Issue | Severity | Proposed Fix |
| :--- | :--- | :--- | :--- |
| `frontend/src/pages/SignupPage.tsx`<br>`frontend/src/pages/LoginPage.tsx` | **Dead Code / Redundant Files**: These views were replaced by the unified `AuthPage.tsx` tab navigation but remain in the directory. | Low | Delete these files from the frontend workspace. |
| `app.log` | **Tracked Production Logs**: The 10MB application log file was committed to the Git index. | Medium | Untrack using `git rm --cached app.log`. |
| `**/__pycache__/` | **Tracked Build Caches**: Python byte-compile cache folders are committed to Git. | Medium | Untrack using `git rm -r --cached **/__pycache__/`. |
| `frontend/src/services/authService.ts` | **Dead Methods**: Houses `loginUser` which is fully bypassed by the React `AuthContext.tsx` provider. | Low | Remove dead methods to prevent developer confusion. |
| Backend Layout | **Root Directory Clutter**: Backend Python folders (`models`, `services`, `api`) are at the root level instead of a `/backend` subdirectory. | Medium | Restructure project structure into a clean `/backend` and `/frontend` monorepo workspace. |

---

## 3. Production Readiness Score

### **Total Score: 86.7 / 100**

#### Security (92/100)
* **Strengths:** HTTP-Only Cookie refresh rotation, password hashing with bcrypt, strict OTP registration lifecycle.
* **Weaknesses:** Lacks strict CSRF token validation on mutation endpoints.

#### Scalability (88/100)
* **Strengths:** Stateless servers, serverless database scaling (Supabase), CDN deployment (Vercel).
* **Weaknesses:** Free-tier limits force Render to run a single Gunicorn worker, restricting concurrent connection throughput.

#### Maintainability (85/100)
* **Strengths:** Strong router/service pattern. Decoupled frontend services.
* **Weaknesses:** Root directory contains backend module folders alongside Docker orchestrator scripts.

#### Observability (70/100)
* **Strengths:** Request ID middleware injecting UUIDs into logs.
* **Weaknesses:** Lacks standard APM monitoring (e.g., Datadog, Prometheus) or real-time failure alerts.
