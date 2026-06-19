from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from models.comment import Comment
from models.task import Task
from models.project import Project
from models.project_member import ProjectMember
from schemas.comment import CommentCreate, CommentResponse
from core.pagination import PaginationParams, paginate
from services.activity_service import create_activity_log
from services.notification_service import create_notification
from services.project_member_service import require_project_role
import logging

logger = logging.getLogger(__name__)


async def create_comment(
    db: AsyncSession, task_id: int, user_id: int, data: CommentCreate
) -> CommentResponse:
    # Validate task exists
    stmt = select(Task).where(Task.id == task_id)
    result = await db.execute(stmt)
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Role-based check: Owner, Manager, Developer can create comments
    await require_project_role(
        db, task.project_id, user_id, ["owner", "manager", "developer"]
    )

    # Create comment
    comment = Comment(content=data.content, task_id=task_id, user_id=user_id)
    db.add(comment)
    await db.commit()
    await db.refresh(comment)

    # Generate COMMENT_ADDED activity log & notifications
    try:
        await create_activity_log(
            db=db,
            user_id=user_id,
            action="COMMENT_ADDED",
            entity_type="comment",
            entity_id=comment.id,
            metadata={
                "comment_id": comment.id,
                "task_id": task_id,
                "project_id": task.project_id,
            },
        )

        project_result = await db.execute(
            select(Project).where(Project.id == task.project_id)
        )
        project = project_result.scalar_one()

        # Notify project members (Owner, Manager, Developer) excluding commenter
        member_result = await db.execute(
            select(ProjectMember.user_id).where(
                ProjectMember.project_id == task.project_id,
                ProjectMember.role.in_(["owner", "manager", "developer"]),
            )
        )
        notify_users = {row[0] for row in member_result.fetchall()}
        if task.assigned_to:
            notify_users.add(task.assigned_to)

        # Include project owner in comment notifications
        notify_users.add(project.owner_id)

        notify_users.discard(user_id)

        for u_id in notify_users:
            await create_notification(
                db=db,
                user_id=u_id,
                title="New Comment Added",
                message=f"A new comment was added on task {task.title}",
                metadata={
                    "comment_id": comment.id,
                    "task_id": task_id,
                    "project_id": task.project_id,
                    "task_title": task.title,
                },
            )
    except Exception as e:
        logger.error(
            f"Failed to generate comment events/notifications: {e}", exc_info=True
        )

    return CommentResponse.model_validate(comment)


async def get_comments_by_task(
    db: AsyncSession, task_id: int, params: PaginationParams
) -> dict:
    # Validate task exists
    stmt = select(Task).where(Task.id == task_id)
    result = await db.execute(stmt)
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Get comments query
    query = select(Comment).where(Comment.task_id == task_id)

    return await paginate(
        db=db, query=query, model=Comment, params=params, search_fields=["content"]
    )


async def delete_comment(db: AsyncSession, comment_id: int, user_id: int) -> None:
    # Get comment
    stmt = select(Comment).where(Comment.id == comment_id)
    result = await db.execute(stmt)
    comment = result.scalars().first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Validate ownership
    if comment.user_id != user_id:
        raise HTTPException(
            status_code=403, detail="Not authorized to delete this comment"
        )

    # Delete
    await db.delete(comment)
    await db.commit()
