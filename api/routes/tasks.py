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
    TaskResponse
)
from services.task_service import (
    create_task_service,
    get_tasks_service
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