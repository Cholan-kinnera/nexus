from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.project import Project


async def create_project_service(project_data, owner_id: int, db: AsyncSession):
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

    result = await db.execute(select(Project).where(Project.owner_id == owner_id))
    projects = result.scalars().all()
    return projects