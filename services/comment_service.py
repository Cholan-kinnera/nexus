from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from models.comment import Comment
from models.task import Task
from schemas.comment import CommentCreate, CommentResponse


async def create_comment(
    db: AsyncSession, task_id: int, user_id: int, data: CommentCreate
) -> CommentResponse:
    # Validate task exists
    stmt = select(Task).where(Task.id == task_id)
    result = await db.execute(stmt)
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Create comment
    comment = Comment(content=data.content, task_id=task_id, user_id=user_id)
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return CommentResponse.model_validate(comment)


async def get_comments_by_task(db: AsyncSession, task_id: int) -> list[CommentResponse]:
    # Validate task exists
    stmt = select(Task).where(Task.id == task_id)
    result = await db.execute(stmt)
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Get comments
    stmt = select(Comment).where(Comment.task_id == task_id).order_by(Comment.created_at.desc())
    result = await db.execute(stmt)
    comments = result.scalars().all()
    return [CommentResponse.model_validate(c) for c in comments]


async def delete_comment(db: AsyncSession, comment_id: int, user_id: int) -> None:
    # Get comment
    stmt = select(Comment).where(Comment.id == comment_id)
    result = await db.execute(stmt)
    comment = result.scalars().first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Validate ownership
    if comment.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    # Delete
    await db.delete(comment)
    await db.commit()