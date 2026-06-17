from contextlib import asynccontextmanager
import logging
import os
import sys
from typing import Any, Dict
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from api.routes import projects, users
from api.routes.auth import router as auth_router
from db.database import Base, engine
from dependencies.auth import get_current_user
from core.config import settings
from api.routes import tasks
from api.routes import comments
from api.routes import activity_logs
from api.routes import notifications
import models





LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler(sys.stdout),
    ],
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
                    stmt = delete(PasswordResetOTP).where(PasswordResetOTP.expires_at < datetime.now(UTC))
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
    cleanup_task = asyncio.create_task(cleanup_expired_otps_job())
    try:
        logger.info("Starting up Nexus PM API...")
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
        await engine.dispose()


ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
).split(",")
ALLOWED_HOSTS = os.getenv(
    "ALLOWED_HOSTS",
    "localhost,127.0.0.1,*.yourdomain.com"
).split(",")

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
    allow_origins=[origin.strip() for origin in ALLOWED_ORIGINS],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=[host.strip() for host in ALLOWED_HOSTS],
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
    """Health check endpoint for monitoring."""
    return {"status": "healthy", "service": "Nexus PM API"}


@app.get("/", tags=["Root"])
async def root() -> Dict[str, Any]:
    """Root endpoint with API information."""
    return {
        "message": "Welcome to Nexus PM API",
        "version": "0.1.0",
        "docs": "/api/docs",
        "health": "/health",
    }


from api.routes import project_members

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

from api.routes import analytics
app.include_router(
    analytics.router,
    prefix="/api/analytics",
    tags=["Analytics"],
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
