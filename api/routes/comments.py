from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies.auth import get_current_user
from db.database import get_db
from models.user import User
from schemas.comment import CommentCreate, CommentResponse
from core.pagination import PaginationParams, PaginatedResponse
from services.comment_service import (
    create_comment,
    get_comments_by_task,
    delete_comment,
)

router = APIRouter(tags=["comments"])


@router.post("/api/tasks/{task_id}/comments", response_model=CommentResponse, status_code=201)
async def create_task_comment(
    task_id: int,
    data: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommentResponse:
    return await create_comment(db=db, task_id=task_id, user_id=current_user.id, data=data)


@router.get("/api/tasks/{task_id}/comments", response_model=PaginatedResponse[CommentResponse])
async def get_task_comments(
    task_id: int,
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaginatedResponse[CommentResponse]:
    return await get_comments_by_task(db=db, task_id=task_id, params=params)


@router.delete("/api/comments/{comment_id}", status_code=204)
async def delete_task_comment(
    comment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    await delete_comment(db=db, comment_id=comment_id, user_id=current_user.id)