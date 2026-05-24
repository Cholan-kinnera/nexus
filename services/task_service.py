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