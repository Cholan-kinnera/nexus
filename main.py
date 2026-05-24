from contextlib import asynccontextmanager
import logging
import os
import sys
from typing import Any, Dict
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from api.routes import projects
from api.routes.auth import router as auth_router
from db.database import Base, engine
from dependencies.auth import get_current_user
from models.user import User
from core.config import settings
from models.task import Task

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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events."""
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
        await engine.dispose()


ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
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


@app.get("/api/users/me", tags=["Users"])
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get current authenticated user information."""
    try:
        return {
            "id": current_user.id,
            "email": current_user.email,
            "created_at": (
                current_user.created_at.isoformat()
                if hasattr(current_user, "created_at")
                else None
            ),
        }
    except Exception as exc:
        logger.error(f"Error retrieving user info: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving user information",
        )


app.include_router(
    auth_router,
    prefix="/api/auth",
    tags=["Authentication"],
)

app.include_router(
    projects.router,
    prefix="/api/projects",
    tags=["Projects"],
    dependencies=[Depends(get_current_user)],
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
