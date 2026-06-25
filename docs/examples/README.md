# Developer Examples — Nexus PM API Documentation

Welcome to the developer integration examples suite. This guide contains copy-pasteable requests and responses modeling real-world API integration workflows for Nexus PM.

---

## 🗺️ Examples Directory

| Feature Area | Document Link | Integration Purpose |
| :--- | :--- | :--- |
| **Authentication** | [authentication.md](file:///c:/NEXUS%20PM%201/docs/examples/authentication.md) | Local email/password registration, Resend email OTP verification, Login cookie rotation, and Google OAuth SSO mapping. |
| **Projects & Teams**| [projects.md](file:///c:/NEXUS%20PM%201/docs/examples/projects.md) | Creating workspaces, list pagination, detail fetches, updates, deletion limits, and team role invitations. |
| **Task Boards** | [tasks.md](file:///c:/NEXUS%20PM%201/docs/examples/tasks.md) | Managing task cards, board stage transitions (Kanban drag-and-drop), user comments, and task attachments logs. |
| **Cloud Storage** | [storage.md](file:///c:/NEXUS%20PM%201/docs/examples/storage.md) | Backend-mediated Cloudflare R2 file uploads, attachment size limits, extension validation, and personal drive explorer. |
| **Activity Feed** | [notifications.md](file:///c:/NEXUS%20PM%201/docs/examples/notifications.md) | Fetching user notifications, marking status feeds, and reviewing activity audit logs. |
| **AI Suggestions** | [ai.md](file:///c:/NEXUS%20PM%201/docs/examples/ai.md) | Breaking down project briefs into task lists using Gemini-2.5-Flash via `google-genai` and planning upcoming AI features. |

---

## 🔑 Base Integration Parameters

### API Host
* **Local Development:** `http://127.0.0.1:8000/api`
* **Production API Server:** `https://nexus-pm-backend-21kc.onrender.com/api`

### Security Scheme
Requests to protected endpoints require passing the JWT access token in the standard Authorization Header:
```http
Authorization: Bearer <your_jwt_access_token>
```
Long-running sessions utilize HttpOnly cookies for automatic rotation.
