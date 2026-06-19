"""
Activity Log Service
====================
Provides functions for creating and querying activity log entries.
Used to record audit-trail events for user actions across the platform.

Supported actions:
    TASK_CREATED, TASK_UPDATED, TASK_MOVED, TASK_DELETED
    PROJECT_CREATED, PROJECT_UPDATED, PROJECT_DELETED
    COMMENT_ADDED
    LOGIN_SUCCESS
"""

import logging
from typing import Any, Optional

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from models.activity_log import ActivityLog
from models.project import Project
from core.pagination import PaginationParams, paginate

logger = logging.getLogger(__name__)


async def create_activity_log(
    db: AsyncSession,
    user_id: Optional[int],
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    metadata: Optional[dict[str, Any]] = None,
) -> ActivityLog:
    """Create a new activity log entry.

    Args:
        db: Async database session.
        user_id: ID of the user who performed the action (nullable for system events).
        action: Action identifier (e.g. TASK_CREATED, PROJECT_DELETED).
        entity_type: Type of entity affected (e.g. 'task', 'project', 'comment').
        entity_id: Primary key of the affected entity.
        metadata: Optional JSON-serializable dict with additional context.

    Returns:
        The persisted ActivityLog model instance.
    """
    try:
        log_entry = ActivityLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            log_metadata=metadata,
        )

        db.add(log_entry)
        await db.commit()
        await db.refresh(log_entry)

        logger.info(
            f"Activity logged: action={action} entity_type={entity_type} "
            f"entity_id={entity_id} user_id={user_id}"
        )
        return log_entry

    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to create activity log: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record activity log",
        )


async def get_activity_logs(
    db: AsyncSession,
    user_id: int,
    params: PaginationParams,
) -> dict:
    """Retrieve activity logs scoped to a user's owned projects.

    Args:
        db: Async database session.
        user_id: ID of the requesting user (used for ownership scoping).
        params: Pagination request parameters.

    Returns:
        Dict matching PaginatedResponse structure.
    """
    try:
        # Get project IDs the user is a member of (via project_members table)
        from models.project_member import ProjectMember

        member_result = await db.execute(
            select(ProjectMember.project_id).where(ProjectMember.user_id == user_id)
        )
        member_project_ids = [row[0] for row in member_result.fetchall()]

        # Also include legacy-owned projects
        project_result = await db.execute(
            select(Project.id).where(Project.owner_id == user_id)
        )
        owner_project_ids = [row[0] for row in project_result.fetchall()]

        accessible_project_ids = list(set(member_project_ids + owner_project_ids))

        # Build query: logs by this user OR logs referencing their projects
        query = select(ActivityLog).where(
            (ActivityLog.user_id == user_id)
            | (
                (ActivityLog.entity_type == "project")
                & (ActivityLog.entity_id.in_(accessible_project_ids))
            )
            | ((ActivityLog.entity_type == "task") & (ActivityLog.user_id == user_id))
        )

        return await paginate(
            db=db, query=query, model=ActivityLog, params=params, search_fields=None
        )

    except Exception as e:
        logger.error(f"Failed to retrieve activity logs: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve activity logs",
        )
