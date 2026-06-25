# Developer Guides — Nexus PM

Welcome to the Nexus PM developer guides. These documents provide actionable instructions to help you install, run, modify, deploy, and troubleshoot the Nexus PM platform.

---

## 🗺️ Guides Directory

| Guide | Description | Purpose |
| :--- | :--- | :--- |
| **[Installation](file:///c:/NEXUS%20PM%201/docs/guides/installation.md)** | Step-by-step setup instructions. | Cloning the repo, setting up virtual environments, installing Node dependencies, running migrations, and first login. |
| **[Local Development](file:///c:/NEXUS%20PM%201/docs/guides/local-development.md)** | Standard developer workflow guides. | Hot-reloading, local mock fallbacks (R2, email), workspace structure, and debugging tips. |
| **[Deployment Guide](file:///c:/NEXUS%20PM%201/docs/guides/deployment.md)** | Production deployment guides. | Mapping frontend (Vercel) and backend (Render) configurations alongside Supabase, Upstash, and Cloudflare. |
| **[Environment Variables](file:///c:/NEXUS%20PM%201/docs/guides/environment.md)** | Variable reference sheet. | A detailed breakdown of all required and optional configurations for local and production deployment. |
| **[Contributing Guide](file:///c:/NEXUS%20PM%201/docs/guides/contributing.md)** | Development rules. | Branch naming standards, commit message formats, coding styles, database migration procedures, and PR steps. |
| **[Architecture Overview](file:///c:/NEXUS%20PM%201/docs/guides/architecture-overview.md)** | Beginner-friendly explanation. | How requests flow through the React UI, FastAPI routers, database pooling, caching, and storage. |
| **[Troubleshooting Log](file:///c:/NEXUS%20PM%201/docs/guides/troubleshooting.md)** | Error resolution guide. | Quick fixes for OAuth issues, cookie blockages, database leaks, cold starts, and port conflicts. |

---

## 🎯 Target Audience
* **New Developers:** Onboarding to configure local database instances and run the app offline.
* **Open Source Contributors:** Looking to follow standard GitFlow workflows, write Alembic migrations, and match project styles.
* **System Maintainers & DevOps Engineers:** Deploying backend containers to Render and configuring serverless endpoints.
* **Reviewers & Recruiters:** Seeking an explanation of the production code structure and quality.

---

## 🔄 Core Developer Workflow
When contributing to Nexus PM, developers follow this standard cycle:
1. **Prepare:** Run local databases/caching and load env parameters.
2. **Implement:** Create feature branches, update schemas, write tests, and edit frontend components.
3. **Verify:** Check compilation on the frontend and execute unit tests on the backend.
4. **Deploy:** Open PRs to develop/master, trigger CI checks, and deploy automatically.
