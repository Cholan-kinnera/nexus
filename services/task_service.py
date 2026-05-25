from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from models.task import Task
from models.project import Project
from schemas.task import TaskCreate


async def create_task_service(
    task_data: TaskCreate,
    current_user_id: int,
    db: AsyncSession
):

    result = await db.execute(
        select(Project).where(
            Project.id == task_data.project_id
        )
    )

    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

# OWNER VALIDATION
    if project.owner_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to add tasks to this project"
        )

    new_task = Task(
        title=task_data.title,
        description=task_data.description,
        priority=task_data.priority,
        due_date=task_data.due_date,
        project_id=task_data.project_id
    )

    db.add(new_task)

    await db.commit()

    await db.refresh(new_task)

    return new_task


async def get_tasks_service(
    db: AsyncSession,
    current_user_id: int
):

    result = await db.execute(
        select(Task)
        .join(Project)
        .where(Project.owner_id == current_user_id)
    )

    tasks = result.scalars().all()

    return tasks


async def update_task_service(
    task_id: int,
    task_data,
    current_user,
    db: AsyncSession
):
    result = await db.execute(
        select(Task).where(Task.id == task_id)
    )

    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    # Check project ownership
    project_result = await db.execute(
        select(Project).where(Project.id == task.project_id)
    )

    project = project_result.scalar_one()

    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to update this task"
        )

    update_data = task_data.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(task, key, value)

    await db.commit()
    await db.refresh(task)

    return task

async def delete_task_service(
    task_id: int,
    current_user,
    db: AsyncSession
):
    result = await db.execute(
        select(Task).where(Task.id == task_id)
    )

    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    # Check project ownership
    project_result = await db.execute(
        select(Project).where(Project.id == task.project_id)
    )

    project = project_result.scalar_one()

    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to delete this task"
        )

    await db.delete(task)
    await db.commit()

    return {
        "message": "Task deleted successfully"
    }

async def get_task_service(
    task_id: int,
    current_user,
    db: AsyncSession
):
    result = await db.execute(
        select(Task).where(Task.id == task_id)
    )

    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    # Check project ownership
    project_result = await db.execute(
        select(Project).where(Project.id == task.project_id)
    )

    project = project_result.scalar_one()

    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view this task"
        )

    return task


async def get_tasks_by_project_service(
    project_id: int,
    current_user,
    db: AsyncSession
):
    # Verify project exists and user owns it
    project_result = await db.execute(
        select(Project).where(Project.id == project_id)
    )

    project = project_result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view this project"
        )

    # Get all tasks in project
    result = await db.execute(
        select(Task).where(Task.project_id == project_id)
    )

    tasks = result.scalars().all()

    return tasks   