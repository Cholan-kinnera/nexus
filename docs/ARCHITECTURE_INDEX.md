# Architecture Documentation Index — Nexus PM

This index links all files in the Nexus PM architecture documentation suite.

---

## 🗺️ Documentation Directory

### 🚀 High-Level Overviews
* **[Executive Summary](file:///c:/NEXUS%20PM%201/docs/EXECUTIVE_SUMMARY.md):** Project purpose, cloud stack, security features, AI features, and production readiness scorecard.
* **[System Architecture](file:///c:/NEXUS%20PM%201/docs/SYSTEM_ARCHITECTURE.md):** Overall logical architecture diagram and mapping of core third-party dependencies (Gemini, Google OAuth, Resend).

### 🏗️ Detailed Components
* **[Database ERD](file:///c:/NEXUS%20PM%201/docs/DATABASE_ERD.md):** Entity relationship map showing table columns, database types, and keys mapped from SQLAlchemy models.
* **[API Architecture](file:///c:/NEXUS%20PM%201/docs/API_ARCHITECTURE.md):** Router subtrees, controller namespaces, and API routes mapping.
* **[Authentication Flow](file:///c:/NEXUS%20PM%201/docs/AUTHENTICATION_FLOW.md):** User sign-up/OTP confirmation, login, token rotation, and Google OAuth SSO sequence.
* **[Storage Architecture](file:///c:/NEXUS%20PM%201/docs/STORAGE_ARCHITECTURE.md):** Cloudflare R2 file upload system, validation parameters, and the backend-mediated upload discrepancy.
* **[AI Integration Architecture](file:///c:/NEXUS%20PM%201/docs/AI_ARCHITECTURE.md):** Gemini-2.5-Flash integration via the Google `genai` SDK and the task generation workflow.

### 🌐 Deployments & Operations
* **[Deployment Architecture](file:///c:/NEXUS%20PM%201/docs/DEPLOYMENT_ARCHITECTURE.md):** Production platform topologies (Vercel, Render, Supabase, Upstash Redis, Cloudflare R2, Resend).
* **[CI/CD Architecture](file:///c:/NEXUS%20PM%201/docs/CI_CD_ARCHITECTURE.md):** Automated pipeline configurations, code analysis (Ruff, Black, pip-audit), tests, and Docker container builds.

### 📝 Decision Records & Reviews
* **[Architecture Decision Records (ADRs)](file:///c:/NEXUS%20PM%201/docs/adr/):** Directory housing historical engineering tradeoffs:
  * **[ADR-001: Supabase DB Migration](file:///c:/NEXUS%20PM%201/docs/adr/ADR-001-Supabase-Migration.md)**
  * **[ADR-002: Cloudflare R2 Storage](file:///c:/NEXUS%20PM%201/docs/adr/ADR-002-Cloudflare-R2.md)**
  * **[ADR-003: Resend vs. AWS SES](file:///c:/NEXUS%20PM%201/docs/adr/ADR-003-Resend-vs-SES.md)**
  * **[ADR-004: Render Deployment Platform](file:///c:/NEXUS%20PM%201/docs/adr/ADR-004-Render-Deployment.md)**
  * **[ADR-005: Gemini vs. OpenAI APIs](file:///c:/NEXUS%20PM%201/docs/adr/ADR-005-Gemini-vs-OpenAI.md)**
* **[Repository Audit Report](file:///c:/NEXUS%20PM%201/docs/AUDIT.md):** Technical debt logs, subsystem correctness status, and readiness scores.
* **[Final Architecture Review](file:///c:/NEXUS%20PM%201/docs/FINAL_ARCHITECTURE_REVIEW.md):** Structural critique, security observations, and ranked engineering improvements roadmap.
