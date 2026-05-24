from typing import List
from fastapi import (
    APIRouter,
    Depends
)
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from dependencies.auth import get_current_user
from models.user import User
from schemas.task import (
    TaskCreate,
    TaskResponse,
    TaskUpdate
)
from services.task_service import (
    create_task_service,
    get_tasks_service,
    update_task_service,
    delete_task_service
)


router = APIRouter()


@router.post(
    "/",
    response_model=TaskResponse
)
async def create_task(
    task: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return await create_task_service(
        task,
        current_user.id,
        db
    )


@router.get(
    "/",
    response_model=List[TaskResponse]
)
async def get_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return await get_tasks_service(
        db,
        current_user.id
    )



@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return await update_task_service(
        task_id,
        task_data,
        current_user,
        db
    )

@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return await delete_task_service(
        task_id,
        current_user,
        db
    )