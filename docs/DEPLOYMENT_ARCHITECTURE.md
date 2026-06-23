# Deployment Architecture — Nexus PM

This document maps out the production deployment layout, network pathways, and service boundaries.

---

## 1. Production Deployment Diagram

```mermaid
graph TD
    subgraph Client [Client Environment]
        User[Browser Client]
    end

    subgraph DNS [DNS & Edge Routing]
        Edge[Cloudflare Edge / DNS]
    end

    subgraph Vercel_Cloud [Vercel Hosting Cloud]
        Vercel[Vercel Routing Edge]
        FE_Static[React 19 Static Files]
        Vercel --> FE_Static
    end

    subgraph Render_Cloud [Render Platform]
        Render[Render Web Service Load Balancer]
        subgraph FastAPI_Cont [Docker Container]
            Gunicorn[Gunicorn Process Manager]
            Uvicorn[Uvicorn Worker]
            Gunicorn --> Uvicorn
        end
        Render --> Gunicorn
    end

    subgraph DB_Cloud [Supabase Cloud]
        Pooler[PgBouncer Pooler - Port 6543]
        DB_Cluster[(PostgreSQL Database Cluster)]
        Pooler --> DB_Cluster
    end

    subgraph Cache_Cloud [Upstash Cloud]
        Upstash[(Serverless Redis Cache)]
    end

    subgraph Storage_Cloud [Cloudflare Cloud]
        R2[(R2 Object Storage Bucket)]
    end

    subgraph External [Third-Party APIs]
        Resend[Resend Transactional Email]
        Gemini[Google Gemini AI Engine]
    end

    User <-->|1. HTTPS Resolution| Edge
    Edge <-->|2. Fetch Frontend SPA| Vercel
    User <-->|3. HTTPS API Request| Render
    Uvicorn <-->|4. Async SQL Session| Pooler
    Uvicorn <-->|5. HTTP / Cache Query| Upstash
    User <-->|6. PUT Direct Upload| R2
    Uvicorn <-->|7. Fetch Presigned URL metadata| R2
    Uvicorn -->|8. API Call| Resend
    Uvicorn <-->|9. genai SDK API Call| Gemini
```

---

## 2. Platform Infrastructure Roles

### Vercel (Frontend SPA)
* **Domain:** `https://www.nexuspm.online`
* **Role:** Serves the compiled React client package. Automatically routes incoming traffic to the closest geographical CDN node to optimize client load times.

### Render (Backend Web Service)
* **Domain:** `https://nexus-pm-backend-21kc.onrender.com`
* **Role:** Pulls the root Dockerfile, builds the container image, executes database migration scripts (`alembic upgrade head`), and spins up a Gunicorn server mapping requests to the FastAPI `main:app` instance.

### Supabase (Database)
* **Role:** Hosts the database storage node. Coordinates client calls using a PgBouncer connection pooler to prevent backend connection leaks during asynchronous processing.

### Upstash (Redis Cache)
* **Role:** Provides serverless, low-latency Redis caching. Used by the backend to store user metadata profiles during registration workflows, OTP counters, and rate-limiting hashes.

### Cloudflare R2 (Object Storage)
* **Role:** Hosts files and avatar uploads. Presigned download links allow direct browser retrieval via Cloudflare's zero-egress cost network.

### Resend (Email gateway)
* **Role:** Transactional mail server dispatching verification messages and password reset tokens.

### Google Gemini API
* **Role:** Processes prompts and returns JSON structured task recommendations.
