from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from models.task import Task
from models.project import Project
from models.project_member import ProjectMember
from models.user import User
from schemas.task import TaskCreate
from services.activity_service import create_activity_log
from services.notification_service import create_notification
from services.project_member_service import (
    require_project_role,
    get_project_member_role,
)
from core.pagination import PaginationParams, paginate
import logging

logger = logging.getLogger(__name__)


async def create_task_service(
    task_data: TaskCreate, current_user_id: int, db: AsyncSession
):

    result = await db.execute(select(Project).where(Project.id == task_data.project_id))

    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    # ROLE-BASED VALIDATION: Owner, Manager, Developer can create tasks
    await require_project_role(
        db, task_data.project_id, current_user_id, ["owner", "manager", "developer"]
    )

    if task_data.assigned_to is not None:
        user_result = await db.execute(
            select(User).where(User.id == task_data.assigned_to)
        )
        if not user_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Assigned user not found"
            )
        # Validate assignee is a project member and not a viewer
        assignee_role = await get_project_member_role(
            db, task_data.project_id, task_data.assigned_to
        )
        if not assignee_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned user is not a member of this project",
            )
        if assignee_role == "viewer":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot assign tasks to viewers",
            )

    new_task = Task(
        title=task_data.title,
        description=task_data.description,
        priority=task_data.priority,
        due_date=task_data.due_date,
        project_id=task_data.project_id,
        assigned_to=task_data.assigned_to,
    )

    db.add(new_task)

    await db.commit()

    await db.refresh(new_task)

    # Log TASK_CREATED
    try:
        await create_activity_log(
            db=db,
            user_id=current_user_id,
            action="TASK_CREATED",
            entity_type="task",
            entity_id=new_task.id,
            metadata={
                "task_id": new_task.id,
                "task_title": new_task.title,
                "project_id": new_task.project_id,
                "new_status": new_task.status or "TODO",
            },
        )
    except Exception as e:
        logger.error(f"Failed to log TASK_CREATED event: {e}", exc_info=True)

    # If assigned, send TASK_ASSIGNED notification
    if new_task.assigned_to is not None:
        try:
            await create_notification(
                db=db,
                user_id=new_task.assigned_to,
                title="Task Assigned",
                message=f"You have been assigned task {new_task.title}",
                metadata={
                    "task_id": new_task.id,
                    "task_title": new_task.title,
                    "assigned_to": new_task.assigned_to,
                },
            )
            await create_activity_log(
                db=db,
                user_id=current_user_id,
                action="TASK_ASSIGNED",
                entity_type="task",
                entity_id=new_task.id,
                metadata={
                    "task_id": new_task.id,
                    "task_title": new_task.title,
                    "project_id": new_task.project_id,
                    "assigned_to": new_task.assigned_to,
                },
            )
        except Exception as e:
            logger.error(
                f"Failed to send TASK_ASSIGNED notification or log activity: {e}",
                exc_info=True,
            )

    return new_task


async def get_tasks_service(
    db: AsyncSession, current_user_id: int, params: PaginationParams
):
    # Get all project IDs the user is a member of
    member_result = await db.execute(
        select(ProjectMember.project_id).where(ProjectMember.user_id == current_user_id)
    )
    member_project_ids = [row[0] for row in member_result.fetchall()]

    # Also include projects where user is legacy owner
    owner_result = await db.execute(
        select(Project.id).where(Project.owner_id == current_user_id)
    )
    owner_project_ids = [row[0] for row in owner_result.fetchall()]

    all_project_ids = list(set(member_project_ids + owner_project_ids))

    if not all_project_ids:
        return {
            "items": [],
            "total": 0,
            "page": params.page,
            "page_size": params.page_size,
            "pages": 0,
        }

    query = select(Task).where(Task.project_id.in_(all_project_ids))

    return await paginate(
        db=db,
        query=query,
        model=Task,
        params=params,
        search_fields=["title", "description"],
    )


async def update_task_service(task_id: int, task_data, current_user, db: AsyncSession):
    result = await db.execute(select(Task).where(Task.id == task_id))

    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Role-based check: Owner, Manager, Developer can update tasks
    await require_project_role(
        db, task.project_id, current_user.id, ["owner", "manager", "developer"]
    )

    # Capture state before update
    old_status = task.status
    old_assigned_to = task.assigned_to
    old_title = task.title
    old_project_id = task.project_id

    update_data = task_data.dict(exclude_unset=True)

    if "assigned_to" in update_data and update_data["assigned_to"] is not None:
        user_result = await db.execute(
            select(User).where(User.id == update_data["assigned_to"])
        )
        if not user_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Assigned user not found"
            )
        # Validate assignee is a project member and not a viewer
        assignee_role = await get_project_member_role(
            db, task.project_id, update_data["assigned_to"]
        )
        if not assignee_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned user is not a member of this project",
            )
        if assignee_role == "viewer":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot assign tasks to viewers",
            )

    for key, value in update_data.items():
        setattr(task, key, value)

    await db.commit()
    await db.refresh(task)

    # Determine action (status transition is TASK_MOVED, other edits is TASK_UPDATED)
    action = "TASK_MOVED" if old_status != task.status else "TASK_UPDATED"

    # Log task activity
    try:
        await create_activity_log(
            db=db,
            user_id=current_user.id,
            action=action,
            entity_type="task",
            entity_id=task.id,
            metadata={
                "task_id": task.id,
                "task_title": task.title,
                "project_id": task.project_id,
                "old_status": old_status,
                "new_status": task.status,
            },
        )
    except Exception as e:
        logger.error(f"Failed to log task activity: {e}", exc_info=True)

    # Check if assignment changed and send TASK_ASSIGNED notification
    if task.assigned_to is not None and task.assigned_to != old_assigned_to:
        try:
            await create_notification(
                db=db,
                user_id=task.assigned_to,
                title="Task Assigned",
                message=f"You have been assigned task {task.title}",
                metadata={
                    "task_id": task.id,
                    "task_title": task.title,
                    "assigned_to": task.assigned_to,
                },
            )
            await create_activity_log(
                db=db,
                user_id=current_user.id,
                action="TASK_ASSIGNED",
                entity_type="task",
                entity_id=task.id,
                metadata={
                    "task_id": task.id,
                    "task_title": task.title,
                    "project_id": task.project_id,
                    "assigned_to": task.assigned_to,
                },
            )
        except Exception as e:
            logger.error(
                f"Failed to send TASK_ASSIGNED notification or log activity: {e}",
                exc_info=True,
            )

    # Check if status changed and send status transition notification
    if task.status != old_status:
        try:
            notify_users = set()
            if task.assigned_to is not None:
                notify_users.add(task.assigned_to)
            notify_users.discard(current_user.id)

            for u_id in notify_users:
                await create_notification(
                    db=db,
                    user_id=u_id,
                    title="Task Status Updated",
                    message=f"Task '{task.title}' status was updated from {old_status} to {task.status}",
                    metadata={
                        "task_id": task.id,
                        "project_id": task.project_id,
                        "task_title": task.title,
                        "old_status": old_status,
                        "new_status": task.status,
                    },
                )
        except Exception as e:
            logger.error(
                f"Failed to send task status update notification: {e}", exc_info=True
            )

    # Check if status changed to DONE and send TASK_COMPLETED notifications
    if task.status == "DONE" and old_status != "DONE":
        try:
            # Notify project members with relevant roles
            member_result = await db.execute(
                select(ProjectMember.user_id).where(
                    ProjectMember.project_id == task.project_id
                )
            )
            notify_users = {row[0] for row in member_result.fetchall()}
            if task.assigned_to is not None:
                notify_users.add(task.assigned_to)

            notify_users.discard(current_user.id)

            for u_id in notify_users:
                await create_notification(
                    db=db,
                    user_id=u_id,
                    title="Task Completed",
                    message=f"Task {task.title} has been completed",
                    metadata={
                        "task_id": task.id,
                        "project_id": task.project_id,
                        "task_title": task.title,
                    },
                )
        except Exception as e:
            logger.error(
                f"Failed to send TASK_COMPLETED notification: {e}", exc_info=True
            )

    return task


async def delete_task_service(task_id: int, current_user, db: AsyncSession):
    result = await db.execute(select(Task).where(Task.id == task_id))

    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Role-based check: Owner, Manager, Developer can delete tasks
    await require_project_role(
        db, task.project_id, current_user.id, ["owner", "manager", "developer"]
    )

    # Keep metadata for logging post-deletion
    task_title = task.title
    project_id = task.project_id
    task_status = task.status

    await db.delete(task)
    await db.commit()

    # Log TASK_DELETED
    try:
        await create_activity_log(
            db=db,
            user_id=current_user.id,
            action="TASK_DELETED",
            entity_type="task",
            entity_id=task_id,
            metadata={
                "task_id": task_id,
                "task_title": task_title,
                "project_id": project_id,
                "old_status": task_status,
            },
        )
    except Exception as e:
        logger.error(f"Failed to log TASK_DELETED event: {e}", exc_info=True)

    return {"message": "Task deleted successfully"}


async def get_task_service(task_id: int, current_user, db: AsyncSession):
    result = await db.execute(select(Task).where(Task.id == task_id))

    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Role-based check: all members can view tasks
    await require_project_role(
        db,
        task.project_id,
        current_user.id,
        ["owner", "manager", "developer", "viewer"],
    )

    return task


async def get_tasks_by_project_service(
    project_id: int, current_user, db: AsyncSession, params: PaginationParams
):
    # Verify project exists and user owns it
    project_result = await db.execute(select(Project).where(Project.id == project_id))

    project = project_result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Role-based check: all members can view project tasks
    await require_project_role(
        db, project_id, current_user.id, ["owner", "manager", "developer", "viewer"]
    )

    # Get all tasks in project query
    query = select(Task).where(Task.project_id == project_id)

    return await paginate(
        db=db,
        query=query,
        model=Task,
        params=params,
        search_fields=["title", "description"],
    )
