from contextlib import asynccontextmanager
import logging
import os
import sys
from typing import Any, Dict
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from api.routes import projects, users, ai
from api.routes.auth import router as auth_router
from db.database import Base, engine, get_db
from sqlalchemy.ext.asyncio import AsyncSession
from services.storage_service import storage_service
from core.config import settings
from api.routes import tasks
from api.routes import comments
from api.routes import activity_logs
from api.routes import notifications


from core.request_id_middleware import RequestIDFilter, RequestIDMiddleware

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
log_format = "%(asctime)s - %(name)s - %(levelname)s - [Request-ID: %(request_id)s] - %(message)s"

file_handler = logging.FileHandler("app.log")
stdout_handler = logging.StreamHandler(sys.stdout)

req_filter = RequestIDFilter()
file_handler.addFilter(req_filter)
stdout_handler.addFilter(req_filter)

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format=log_format,
    handlers=[file_handler, stdout_handler],
)
logger = logging.getLogger(__name__)


async def cleanup_expired_otps_job():
    import asyncio
    from datetime import datetime, UTC
    from sqlalchemy import delete
    from db.database import AsyncSessionLocal
    from models.password_reset_otp import PasswordResetOTP

    while True:
        try:
            logger.info("Running daily cleanup of expired password reset OTPs...")
            async with AsyncSessionLocal() as session:
                async with session.begin():
                    stmt = delete(PasswordResetOTP).where(
                        PasswordResetOTP.expires_at < datetime.now(UTC)
                    )
                    res = await session.execute(stmt)
                    logger.info(f"Cleaned up {res.rowcount} expired OTPs.")
            # Sleep for 24 hours
            await asyncio.sleep(24 * 3600)
        except asyncio.CancelledError:
            logger.info("Cleanup job cancelled.")
            break
        except Exception as e:
            logger.error(f"Error in cleanup_expired_otps_job: {e}")
            await asyncio.sleep(3600)  # retry in an hour on error


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events."""
    import asyncio
    from services.redis_service import redis_service

    cleanup_task = asyncio.create_task(cleanup_expired_otps_job())
    try:
        logger.info("Starting up Nexus PM API...")
        # 1. Initialize Redis connection
        await redis_service.connect()

        # 2. Sync database schema
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully")
        yield
    except Exception as exc:
        logger.error(f"Error during startup: {exc}", exc_info=True)
        raise
    finally:
        logger.info("Shutting down Nexus PM API...")
        cleanup_task.cancel()
        # 3. Disconnect Redis client
        await redis_service.disconnect()
        await engine.dispose()


raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost,http://127.0.0.1,http://localhost:80,http://127.0.0.1:80,http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174",
)
raw_origins = raw_origins.strip("'\"")
ALLOWED_ORIGINS = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

raw_hosts = os.getenv(
    "ALLOWED_HOSTS", "localhost,127.0.0.1,nexus-pm-backend-21kc.onrender.com,*.onrender.com"
)
raw_hosts = raw_hosts.strip("'\"")
ALLOWED_HOSTS = [host.strip() for host in raw_hosts.split(",") if host.strip()]

app = FastAPI(
    title="Nexus PM",
    description="A comprehensive project management tool built with FastAPI and React.",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=ALLOWED_HOSTS,
)

app.add_middleware(RequestIDMiddleware)

from fastapi.staticfiles import StaticFiles  # noqa: E402

# Create local storage upload dir if not exists (for simulation mode fallback)
os.makedirs("local_storage_uploads", exist_ok=True)
app.mount(
    "/static/uploads",
    StaticFiles(directory="local_storage_uploads"),
    name="static_uploads",
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Global exception handler for unhandled exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error",
            "path": str(request.url),
        },
    )


@app.get("/health", tags=["Health"])
async def health_check() -> Dict[str, str]:
    """Simple health check endpoint returning 200 instantly if service is running."""
    return {"status": "healthy"}


@app.get("/health/detailed", tags=["Health"])
async def detailed_health_check(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """
    Detailed health check tracking Postgres connectivity, Redis caching, and R2 connection integrity.
    Allows degraded state if R2 or Redis is unresponsive but database is healthy.
    """
    from datetime import datetime, UTC
    from sqlalchemy import text
    from services.redis_service import redis_service

    db_status = "healthy"
    storage_status = "healthy"
    redis_status = "healthy"

    # 1. Check Database
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "unhealthy"

    # 2. Check Storage (Cloudflare R2 or local simulator)
    try:
        if storage_service.use_simulator:
            # Check local folder write access
            if not os.path.exists(storage_service.local_storage_path):
                storage_status = "unhealthy"
        else:
            # Verify R2 access
            storage_service.s3_client.list_objects_v2(
                Bucket=storage_service.bucket_name, MaxKeys=1
            )
    except Exception as e:
        logger.error(f"Storage health check failed: {e}")
        storage_status = "unhealthy"

    # 3. Check Redis Connection
    try:
        is_redis_healthy = await redis_service.ping()
        if not is_redis_healthy:
            redis_status = "unhealthy"
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        redis_status = "unhealthy"

    # 4. Determine overall status
    if db_status == "unhealthy":
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        overall_status = "unhealthy"
    elif storage_status == "unhealthy" or redis_status == "unhealthy":
        status_code = status.HTTP_200_OK
        overall_status = "degraded"
    else:
        status_code = status.HTTP_200_OK
        overall_status = "healthy"

    response_data = {
        "status": overall_status,
        "database": db_status,
        "storage": storage_status,
        "redis": redis_status,
        "timestamp": datetime.now(UTC).isoformat(),
    }

    if overall_status == "unhealthy":
        # Raise HTTPException for load balancers expecting a non-2xx code on failure
        raise HTTPException(status_code=status_code, detail=response_data)

    return response_data


@app.get("/", tags=["Root"])
async def root() -> Dict[str, Any]:
    """Root endpoint with API information."""
    return {
        "message": "Welcome to Nexus PM API",
        "version": "0.1.0",
        "docs": "/api/docs",
        "health": "/health",
    }


from api.routes import project_members  # noqa: E402

app.include_router(
    auth_router,
    prefix="/api/auth",
    tags=["Authentication"],
)

app.include_router(
    users.router,
    prefix="/api/users",
    tags=["Users"],
)

app.include_router(
    projects.router,
    prefix="/api/projects",
    tags=["Projects"],
)

app.include_router(
    project_members.router,
    prefix="/api/projects",
    tags=["Project Members"],
)

app.include_router(
    tasks.router,
    prefix="/api/tasks",
    tags=["Tasks"],
)
app.include_router(comments.router)
app.include_router(activity_logs.router)
app.include_router(notifications.router)

from api.routes import analytics  # noqa: E402

app.include_router(
    analytics.router,
    prefix="/api/analytics",
    tags=["Analytics"],
)

from api.routes import storage  # noqa: E402

app.include_router(
    storage.router,
    prefix="/api/storage",
    tags=["Storage"],
)

app.include_router(
    ai.router,
    prefix="/api/ai",
    tags=["AI"],
)



if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=True,
        log_level=LOG_LEVEL.lower(),
        access_log=True,
    )
