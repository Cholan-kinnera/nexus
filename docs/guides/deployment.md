# Production Deployment Guide — Nexus PM

This guide explains the deployment steps, environment parameters, and infrastructure routing rules.

---

## 1. Cloud Infrastructure Mapping

The production stack uses serverless and PaaS providers:

```
                          ┌──────────────────────────┐
                          │    Vercel CDN Edge       │ (Frontend SPA)
                          │   https://nexuspm.online │
                          └─────────────┬────────────┘
                                        │
                                        ▼ HTTPS REST API
                          ┌──────────────────────────┐
                          │   Render Container Node  │ (FastAPI Backend)
                          │  https://nexus-pm-backend│
                          └──────┬────────────┬──────┘
                                 │            │
       ┌─────────────────────────┘            └─────────────────────────┐
       ▼ SQL DB Connection                                              ▼ Key-Value Cache
┌──────────────┐                                                 ┌──────────────┐
│  Supabase    │ (PostgreSQL)                                    │   Upstash    │ (Redis)
└──────────────┘                                                 └──────────────┘
```

---

## 2. Step-by-Step Deployment Sequence

To deploy a new instance of the platform, configure dependencies in this logical order:

### Step 1: Provision Core Databases & Caching
1. **Supabase PostgreSQL:** Create a project, retrieve the database connection string, and enable PgBouncer pooler mode (port `6543`).
2. **Upstash Redis:** Provision a serverless Redis node and copy the URL (`redis://...`).

### Step 2: Provision Storage & Gateways
1. **Cloudflare R2:** Create an R2 storage bucket. Retrieve the S3 API keys, account ID, and public bucket domain link.
2. **Resend Email:** Register your custom domain (`nexuspm.online`), add the provided SPF/DKIM DNS records, and generate an API key.
3. **Google Cloud Console:** Create an OAuth credential block, add your frontend domain to the permitted redirect list, and copy the Client ID and Secret.

### Step 3: Deploy the API Server (Render)
1. Register a new **Web Service** on Render linked to your project repository.
2. Select **Docker** as the runtime environment.
3. In the Render Environment Panel, configure all variables (see [Environment Variables Guide](file:///c:/NEXUS%20PM%201/docs/guides/environment.md)).
4. **Build & Release:** Render will build the container from the root [Dockerfile](file:///c:/NEXUS%20PM%201/Dockerfile) and launch Uvicorn/Gunicorn. Database migrations will execute automatically during the container boot script (`entrypoint.sh`).

### Step 4: Deploy the Client UI (Vercel)
1. Import the repository's `frontend/` directory as a new project on Vercel.
2. Set the build environment variable `VITE_API_URL` to point to your live Render backend service URL.
3. Trigger the deploy build. Vercel will compile the React bundle and deploy it globally.

---

## 3. Production Scaling & Bottlenecks

### Render Cold Starts (Free Tier)
Render's free tier spins down backend containers after 15 minutes of inactivity. The next API request triggers a cold-start delay (30-50 seconds) while the container boots.
* **Production Recommendation:** Upgrade to Render's Hobby tier ($7/month) to keep the container permanently active.

### Memory Optimization (Render Free Tier)
Render's free tier has a 512MB RAM limit. Running multiple concurrency threads can trigger Out Of Memory (OOM) crashes.
* **Our Configuration:** The Gunicorn server in [entrypoint.sh](file:///c:/NEXUS%20PM%201/entrypoint.sh) uses exactly **1 worker** (`-w 1`) in production. If you upgrade your hosting tier, you can scale workers using `-w 2` or `-w 4` to handle more concurrent requests.

### Database Connection Limits
FastAPI's asynchronous requests can exhaust PostgreSQL connection limits.
* **Our Configuration:** The backend connects via **PgBouncer** (Port 6543) instead of direct PostgreSQL ports (Port 5432) to pool connections efficiently.
* **Migration Note:** Direct ports (Port 5432) must still be used when running Alembic migrations from your local machine to avoid pool conflicts.
