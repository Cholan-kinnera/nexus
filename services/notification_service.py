"""
Notification Service
====================
Provides functions for creating, querying, and managing user notifications.

Supported notification triggers:
    TASK_ASSIGNED, TASK_UPDATED, COMMENT_ADDED, PROJECT_UPDATED
"""

import logging
from typing import Any, Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from models.notification import Notification
from core.pagination import PaginationParams, paginate

logger = logging.getLogger(__name__)


async def create_notification(
    db: AsyncSession,
    user_id: int,
    title: str,
    message: str,
    metadata: Optional[dict[str, Any]] = None,
) -> Notification:
    """Create a new notification for a user.

    Args:
        db: Async database session.
        user_id: ID of the user who will receive the notification.
        title: Brief notification header (e.g. 'Task Assigned').
        message: Descriptive notification body.
        metadata: Optional JSON-serializable dict for deep-linking context
                  (e.g. {"project_id": 1, "task_id": 4}).

    Returns:
        The persisted Notification model instance.
    """
    try:
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_metadata=metadata,
        )

        db.add(notification)
        await db.commit()
        await db.refresh(notification)

        logger.info(f"Notification created: user_id={user_id} title='{title}'")
        return notification

    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to create notification: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create notification",
        )


async def get_user_notifications(
    db: AsyncSession,
    user_id: int,
    unread_only: bool = False,
    params: PaginationParams = None,
) -> dict:
    """Retrieve notifications for a specific user.

    Args:
        db: Async database session.
        user_id: ID of the user whose notifications to retrieve.
        unread_only: If True, return only unread notifications.
        params: PaginationParams instance.

    Returns:
        Dict matching PaginatedResponse structure.
    """
    try:
        query = select(Notification).where(Notification.user_id == user_id)

        if unread_only:
            query = query.where(Notification.is_read.is_(False))

        return await paginate(
            db=db, query=query, model=Notification, params=params, search_fields=None
        )

    except Exception as e:
        logger.error(f"Failed to retrieve notifications: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notifications",
        )


async def mark_notification_read(
    db: AsyncSession,
    user_id: int,
    notification_id: int,
) -> Notification:
    """Mark a single notification as read.

    Args:
        db: Async database session.
        user_id: ID of the requesting user (for ownership validation).
        notification_id: ID of the notification to mark as read.

    Returns:
        The updated Notification model instance.

    Raises:
        HTTPException 404: If notification not found.
        HTTPException 403: If notification does not belong to the user.
    """
    try:
        result = await db.execute(
            select(Notification).where(Notification.id == notification_id)
        )
        notification = result.scalar_one_or_none()

        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found",
            )

        if notification.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this notification",
            )

        notification.is_read = True
        await db.commit()
        await db.refresh(notification)

        return notification

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to mark notification as read: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update notification",
        )


async def mark_all_notifications_read(
    db: AsyncSession,
    user_id: int,
) -> int:
    """Mark all unread notifications for a user as read.

    Args:
        db: Async database session.
        user_id: ID of the user whose notifications to mark as read.

    Returns:
        The number of notifications that were updated.
    """
    try:
        stmt = (
            update(Notification)
            .where(
                (Notification.user_id == user_id) & (Notification.is_read.is_(False))
            )
            .values(is_read=True)
        )

        result = await db.execute(stmt)
        await db.commit()

        updated_count = result.rowcount
        logger.info(
            f"Marked {updated_count} notifications as read for user_id={user_id}"
        )
        return updated_count

    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to mark all notifications as read: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update notifications",
        )
