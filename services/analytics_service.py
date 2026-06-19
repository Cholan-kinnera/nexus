"""
Analytics Service
=================
Provides aggregate dashboard metrics using PostgreSQL COUNT/GROUP BY queries.
Scoped to the current user's accessible projects via project membership.
"""

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func, case, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models.project import Project
from models.project_member import ProjectMember
from models.task import Task
from models.activity_log import ActivityLog
from models.notification import Notification

logger = logging.getLogger(__name__)


async def _get_accessible_project_ids(db: AsyncSession, user_id: int) -> list[int]:
    """Return all project IDs the user can access (member + legacy owner)."""
    member_result = await db.execute(
        select(ProjectMember.project_id).where(ProjectMember.user_id == user_id)
    )
    member_ids = {row[0] for row in member_result.fetchall()}

    owner_result = await db.execute(
        select(Project.id).where(Project.owner_id == user_id)
    )
    owner_ids = {row[0] for row in owner_result.fetchall()}

    return list(member_ids | owner_ids)


async def get_dashboard_metrics(db: AsyncSession, user_id: int) -> dict:
    """Return all dashboard metrics in a single call using aggregate queries."""

    project_ids = await _get_accessible_project_ids(db, user_id)

    # ---- Project Analytics ----
    projects_owned = await db.execute(
        select(func.count()).select_from(Project).where(Project.owner_id == user_id)
    )
    owned_count = projects_owned.scalar() or 0

    total_projects = len(project_ids)
    projects_joined = total_projects - owned_count

    # ---- Task Analytics (single GROUP BY query) ----
    task_status_counts = {"TODO": 0, "IN_PROGRESS": 0, "REVIEW": 0, "DONE": 0}
    total_tasks = 0

    if project_ids:
        task_result = await db.execute(
            select(
                Task.status,
                func.count().label("cnt"),
            )
            .where(Task.project_id.in_(project_ids))
            .group_by(Task.status)
        )
        for row in task_result.fetchall():
            status_key = row[0] or "TODO"
            count = row[1]
            task_status_counts[status_key] = (
                task_status_counts.get(status_key, 0) + count
            )
            total_tasks += count

    # ---- Member Analytics ----
    total_members = 0
    if project_ids:
        member_count_result = await db.execute(
            select(func.count(func.distinct(ProjectMember.user_id))).where(
                ProjectMember.project_id.in_(project_ids)
            )
        )
        total_members = member_count_result.scalar() or 0

    # ---- Notification Analytics ----
    notif_result = await db.execute(
        select(
            func.count().label("total"),
            func.count().filter(Notification.is_read == False).label("unread"),
        ).where(Notification.user_id == user_id)
    )
    notif_row = notif_result.one()
    notification_total = notif_row[0] or 0
    notification_unread = notif_row[1] or 0

    # ---- Activity Analytics ----
    now = datetime.now(timezone.utc)
    last_24h = now - timedelta(hours=24)
    last_7d = now - timedelta(days=7)

    activity_result = await db.execute(
        select(
            func.count().label("total_recent"),
            func.count().filter(ActivityLog.created_at >= last_24h).label("last_24h"),
            func.count().filter(ActivityLog.created_at >= last_7d).label("last_7d"),
        ).where(ActivityLog.user_id == user_id)
    )
    activity_row = activity_result.one()
    recent_activity_count = activity_row[0] or 0
    activities_last_24h = activity_row[1] or 0
    activities_last_7d = activity_row[2] or 0

    return {
        # Summary
        "total_projects": total_projects,
        "total_tasks": total_tasks,
        "completed_tasks": task_status_counts.get("DONE", 0),
        "in_progress_tasks": task_status_counts.get("IN_PROGRESS", 0),
        "todo_tasks": task_status_counts.get("TODO", 0),
        "total_members": total_members,
        "unread_notifications": notification_unread,
        "recent_activity_count": recent_activity_count,
        # Project breakdown
        "projects_owned": owned_count,
        "projects_joined": projects_joined,
        "active_projects": total_projects,
        # Task breakdown
        "task_status": task_status_counts,
        # Activity breakdown
        "activities_last_24h": activities_last_24h,
        "activities_last_7d": activities_last_7d,
        # Notification breakdown
        "notification_unread": notification_unread,
        "notification_total": notification_total,
    }
