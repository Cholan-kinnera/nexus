from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from dependencies.auth import get_current_user
from models.user import User
from models.notification import Notification
from schemas.notification import (
    NotificationResponse,
    NotificationReadResponse,
    NotificationCountResponse,
)
from core.pagination import PaginationParams, PaginatedResponse
from services.notification_service import (
    get_user_notifications,
    mark_notification_read,
    mark_all_notifications_read,
)

router = APIRouter(tags=["Notifications"])


@router.get("/api/notifications", response_model=PaginatedResponse[NotificationResponse])
async def read_notifications(
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaginatedResponse[NotificationResponse]:
    """Retrieve notifications for the current user."""
    return await get_user_notifications(
        db=db,
        user_id=current_user.id,
        unread_only=False,
        params=params,
    )


@router.get("/api/notifications/unread", response_model=PaginatedResponse[NotificationResponse])
async def read_unread_notifications(
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaginatedResponse[NotificationResponse]:
    """Retrieve unread notifications for the current user."""
    return await get_user_notifications(
        db=db,
        user_id=current_user.id,
        unread_only=True,
        params=params,
    )


@router.get("/api/notifications/count", response_model=NotificationCountResponse)
async def read_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationCountResponse:
    """Retrieve count of unread notifications for the current user."""
    result = await db.execute(
        select(func.count())
        .select_from(Notification)
        .where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        )
    )
    unread_count = result.scalar() or 0
    return NotificationCountResponse(unread_count=unread_count)


@router.post("/api/notifications/read-all", response_model=NotificationReadResponse)
async def read_all_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationReadResponse:
    """Mark all unread notifications for the current user as read."""
    count = await mark_all_notifications_read(db=db, user_id=current_user.id)
    return NotificationReadResponse(
        success=True,
        message="All notifications marked as read",
        updated_count=count,
    )


@router.put("/api/notifications/{notification_id}/read", response_model=NotificationResponse)
async def read_single_notification(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationResponse:
    """Mark a single notification as read, validating ownership."""
    return await mark_notification_read(
        db=db,
        user_id=current_user.id,
        notification_id=notification_id,
    )
