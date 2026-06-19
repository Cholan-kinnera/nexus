from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from db.database import get_db
from dependencies.auth import get_current_user
from models.user import User
from core.pagination import PaginationParams, PaginatedResponse
from services.project_service import (
    create_project_service,
    get_projects_service,
    get_project_by_id_service,
    update_project_service,
    delete_project_service,
)
from schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate

router = APIRouter()


@router.post("/", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return await create_project_service(project, current_user.id, db)


@router.get("/", response_model=PaginatedResponse[ProjectResponse])
async def get_projects(
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):

    return await get_projects_service(db, current_user.id, params)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_project_by_id_service(project_id, current_user, db)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await update_project_service(project_id, project_data, current_user, db)


@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await delete_project_service(project_id, current_user, db)
