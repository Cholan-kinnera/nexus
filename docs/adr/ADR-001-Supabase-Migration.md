# ADR-001: Migration to Supabase PostgreSQL

## Status
Accepted

## Context
Nexus PM requires a production-grade PostgreSQL database to store users, projects, tasks, comments, notifications, activity logs, and authentication token metadata. Initially, a local PostgreSQL Docker container was run for development. For hosting in production, we evaluated:
1. **Self-Hosted PostgreSQL:** Setting up and managing PostgreSQL directly inside a Virtual Private Server (VPS) container.
2. **AWS RDS (Relational Database Service):** Managed cloud database.
3. **Supabase (Managed PostgreSQL):** Serverless/managed PostgreSQL instance with built-in connection pooling, dashboard interface, and quick provisioning.

## Decision
We decided to adopt **Supabase PostgreSQL** for database hosting.

### Key Factors:
* **Connection Pooling:** Supabase integrates **PgBouncer** directly, allowing our asynchronous FastAPI backend (using `asyncpg` and SQLAlchemy async pools) to scale connections up/down without overwhelming PostgreSQL's direct backend connection limit.
* **Developer Ergonomics:** Provides a web-based SQL Editor, Table Editor, and database logs without needing SSH or local clients.
* **Cost & Setup Speed:** Supabase's free tier provides 500MB of managed PostgreSQL storage with zero management overhead, making it ideal for the launch and developer showcase stage.
* **Compatibility:** Completely standard PostgreSQL engine, ensuring migrations written in Alembic execute without syntax differences.

## Consequences
* **Alembic Configuration:** The database connection URI must utilize the Supabase pooler address (Port 6543) for application startup, and direct connections (Port 5432) for executing database schema changes (migrations).
* **Latency:** Small network round-trip overhead compared to a co-located local database. Managed by utilizing SQLAlchemy's async connection pool to prevent request blockings.
* **Lock-in:** Low. Since the database engine is standard PostgreSQL, the entire schema and dataset can be backed up and migrated to any alternative PostgreSQL host (e.g., AWS RDS or self-hosted) at any time.
