from fastapi import (APIRouter, Depends)
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from dependencies.auth import get_current_user
from schemas.project import ( ProjectCreate, ProjectResponse)
from services.project_service import (create_project_service)




router = APIRouter()


@router.post(
    "/",
    response_model=ProjectResponse
)
async def create_project(
    project: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):

    return await create_project_service(
        project.title,
        project.description,
        current_user.id,
        db
    )