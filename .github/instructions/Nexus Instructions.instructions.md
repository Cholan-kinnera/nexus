This workspace is focused on building Nexus PM as a clean MVP SaaS application.

Preferred backend stack:
- FastAPI
- PostgreSQL
- SQLAlchemy async
- JWT authentication
- Pydantic
- You may add Alembic migrations only if needed for schema versioning.
Preferred frontend stack:
- React
- Vite
- Tailwind CSS

Avoid:
- Docker
- Redis
- Kubernetes
- CI/CD
- microservices
- unnecessary enterprise architecture

Always prioritize:
- readability
- maintainability
- security
- clean code
- scalable CRUD architecture

Do not drastically restructure the project.

Before making changes:
- explain what will change
- keep changes non-breaking
- preserve current APIs unless requested
- prefer small safe improvements