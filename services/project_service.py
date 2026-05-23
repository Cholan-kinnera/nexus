from sqlalchemy.ext.asyncio import AsyncSession
from models.project import Project



async def create_project_service(
    title: str,
    description: str,
    owner_id: int,
    db: AsyncSession
):
    new_project = Project(
        title=title,
        description=description,
        owner_id=owner_id
    )
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    return new_project