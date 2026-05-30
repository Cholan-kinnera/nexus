from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from fastapi import HTTPException

from models.project import Project
from models.task import Task


async def create_project_service(
    project_data,
    owner_id: int,
    db: AsyncSession
):
    new_project = Project(
        title=project_data.title,
        description=project_data.description,
        owner_id=owner_id
    )

    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)

    return new_project


async def get_projects_service(
    db: AsyncSession,
    owner_id: int
):
    result = await db.execute(
        select(Project).where(Project.owner_id == owner_id)
    )

    projects = result.scalars().all()

    return projects


async def get_project_service(
    project_id: int,
    current_user,
    db: AsyncSession
):
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )

    project = result.scalar_one_or_none()

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

    return project


async def update_project_service(
    project_id: int,
    project_data,
    current_user,
    db: AsyncSession
):
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )

    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to update this project"
        )

    update_data = project_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(project, key, value)

    await db.commit()
    await db.refresh(project)

    return project


async def delete_project_service(
    project_id: int,
    current_user,
    db: AsyncSession
):
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )

    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to delete this project"
        )

    # Delete all tasks belonging to this project
    await db.execute(
        delete(Task).where(
            Task.project_id == project.id
        )
    )

    # Delete project
    await db.delete(project)

    await db.commit()

    return {
        "message": "Project deleted successfully"
    }