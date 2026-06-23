# ADR-004: Render Deployment Platform for API Server

## Status
Accepted

## Context
Deploying the Nexus PM backend requires hosting a Dockerized FastAPI application that manages long-running HTTP connections, schedules cleanup background tasks, and establishes connections to Supabase PostgreSQL and Upstash Redis. We evaluated:
1. **AWS ECS / EKS:** Highly scalable, but introduces complex network routing, IAM, load balancer configurations, and significant monthly baseline costs.
2. **Self-Hosted Virtual Private Server (VPS):** Low cost, but requires manual OS patching, SSL certificate renewal (Let's Encrypt), Docker setup, and lacks automated build pipelines.
3. **Render (PaaS):** Fully managed container hosting platform. Automatically builds from Git, manages SSL, terminates routing, handles container health checks, and provides an immediate free tier.

## Decision
We decided to deploy the **FastAPI backend on Render** (via Docker builds) and host the **React frontend on Vercel** (via static edge routing).

### Key Factors:
* **Automated Builds:** Render connects directly to GitHub. Whenever commits are merged to the production branch, Render pulls the repo, builds the Docker image, runs the database migrations inside the container startup script, and swaps the instances with zero-downtime.
* **SSL & Routing:** Render automatically provisions and rotates Let's Encrypt SSL certificates for the backend domain and handles load balancing.
* **Decoupled Frontend:** Vercel specializes in static frontend edge hosting. Running the frontend SPA on Vercel separates client asset delivery from backend container load.

## Consequences
* **Free Tier Limitations:** Render's free tier allocates 512MB RAM and puts the container to sleep after 15 minutes of inactivity. When a user visits the site, they experience a 30-50 second startup delay ("cold start") if the backend was asleep.
* **Worker Optimization:** To prevent Render's free tier container from running out of memory (OOM crash), the Gunicorn worker count in [entrypoint.sh](file:///c:/NEXUS%20PM%201/entrypoint.sh) was reduced from 4 workers to **1 worker** (`exec gunicorn -w 1 -k uvicorn.workers.UvicornWorker main:app ...`).
* **Environment Configuration:** All production keys (Supabase URLs, Redis URLs, R2 keys) are configured directly in Render's dashboard environment panel, keeping secrets out of public source code.
