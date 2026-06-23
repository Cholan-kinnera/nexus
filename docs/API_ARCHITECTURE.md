# API Architecture — Nexus PM

This document specifies the routing structure, endpoint hierarchy, and resource schemas of the FastAPI backend.

---

## 1. FastAPI Router Hierarchy

The backend routes are consolidated and mounted onto the core `app` instance in [main.py](file:///c:/NEXUS%20PM%201/main.py). All endpoints are prefixed under the `/api` namespace:

```
FastAPI Root (main.py)
├── /api/auth (api/routes/auth.py)
├── /api/users (api/routes/users.py)
├── /api/projects (api/routes/projects.py)
│   └── /{project_id}/members (api/routes/project_members.py)
├── /api/tasks (api/routes/tasks.py)
│   ├── /{task_id}/comments (api/routes/comments.py)
│   └── /{task_id}/attachments (api/routes/tasks.py)
├── /api/storage (api/routes/storage.py)
├── /api/analytics (api/routes/analytics.py)
├── /api/ai (api/routes/ai.py)
├── /api/notifications (api/routes/notifications.py)
└── /api/activity-logs (api/routes/activity_logs.py)
```

---

## 2. API Endpoints Reference

### Authentication (`/api/auth`)
* `POST /signup` - Registers credentials, generates an OTP, and queues the profile in Redis.
* `POST /verify-otp` - Matches OTP code from Redis, writes the user to PostgreSQL, and issues session tokens.
* `POST /login` - Evaluates credentials and returns access JWT in JSON body with refresh JWT in HTTP-Only cookie.
* `POST /refresh` - Evaluates current refresh cookie, rotates keys, and issues a new access token.
* `POST /logout` - Revokes refresh session and clears client HTTP cookies.
* `POST /forgot-password` - Dispatches password reset OTP to email.
* `POST /verify-reset-otp` - Validates the password reset verification code.
* `POST /reset-password` - Modifies user password with validated OTP.
* `POST /google` - Maps a Google SSO ID token and returns session tokens.

### Projects & Collaborators (`/api/projects`)
* `GET /` - Returns a paginated list of projects containing the user.
* `POST /` - Creates a new project workspace (creator becomes Owner).
* `GET /{project_id}` - Fetches detailed metadata for a project.
* `PUT /{project_id}` - Updates a project description or title (requires Owner or Manager role).
* `DELETE /{project_id}` - Deletes a project and all subtasks (requires Owner role).
* `GET /{project_id}/members` - Lists project members.
* `POST /{project_id}/members/invite` - Invites a new user to join a project (roles: Manager, Developer, Viewer).
* `DELETE /{project_id}/members/{member_user_id}` - Removes a user from a project workspace.

### Task Management (`/api/tasks`)
* `GET /` - Lists tasks across all active projects.
* `POST /` - Appends a task to a project.
* `GET /{task_id}` - Fetches a task card detail view.
* `PUT /{task_id}` - Updates task metadata (stage, priority, assignee, due dates).
* `DELETE /{task_id}` - Deletes a task card.
* `POST /{task_id}/comments` - Appends text comments to a task.
* `GET /{task_id}/comments` - Retrieves comment history for a task.

### Cloud Storage Interface (`/api/storage`)
* `GET /` - Lists attachments uploaded by the authenticated user.
* `POST /upload` - Uploads a file (validation: max 10MB, extension whitelist) and saves it to Cloudflare R2.
* `DELETE /delete/{file_key}` - Deletes a file from R2 and removes database metadata logs (restricted to file uploader).

### Analytics & System Feeds
* `GET /api/analytics/dashboard` - Computes system KPIs (task completion rates, activity speed, storage bytes).
* `GET /api/activity-logs` - Fetches historical auditable logs.
* `GET /api/notifications` - Fetches the client notification stream.
* `POST /api/notifications/read-all` - Marks all alerts as read.

### Artificial Intelligence (`/api/ai`)
* `POST /projects/{project_id}/generate-tasks` - Extracts project context and requests task suggestions from Gemini.
