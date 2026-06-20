from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from dependencies.auth import get_current_user
from models.user import User
from schemas.activity_log import ActivityLogResponse
from services.activity_service import get_activity_logs
from core.pagination import PaginationParams, PaginatedResponse

router = APIRouter(tags=["Activity Logs"])


@router.get("/api/activity-logs", response_model=PaginatedResponse[ActivityLogResponse])
async def read_activity_logs(
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaginatedResponse[ActivityLogResponse]:
    """Retrieve activity logs scoped to the current user's owned projects."""
    return await get_activity_logs(
        db=db,
        user_id=current_user.id,
        params=params,
    )
