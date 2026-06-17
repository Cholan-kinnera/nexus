from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from dependencies.auth import get_current_user
from models.user import User
from services.analytics_service import get_dashboard_metrics

router = APIRouter()


@router.get("/dashboard", tags=["Analytics"])
async def dashboard_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all dashboard metrics for the authenticated user."""
    return await get_dashboard_metrics(db, current_user.id)
