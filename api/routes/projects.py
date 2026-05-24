from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from db.database import get_db
from dependencies.auth import get_current_user
from models.user import User
from schemas.project import (ProjectCreate,ProjectResponse)
from services.project_service import(create_project_service,get_projects_service)




router = APIRouter()

@router.post("/", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)):

    return await create_project_service(
        project,
        current_user.id,
        db)


@router.get("/", response_model=List[ProjectResponse])
async def get_projects(
    db: AsyncSession = Depends(get_db)
):

    return await get_projects_service(db)