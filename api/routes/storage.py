import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from dependencies.auth import get_current_user
from models.user import User
from models.task_attachment import TaskAttachment
from services.storage_service import storage_service
from db.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        file_data = await file.read()
        file_key = storage_service.upload_file(
            file_data=file_data,
            file_name=file.filename or "uploaded_file",
            content_type=file.content_type,
        )
        file_url = storage_service.generate_file_url(file_key)

        # Save metadata to DB with user_id for isolation
        attachment = TaskAttachment(
            task_id=None,
            user_id=current_user.id,
            file_name=file.filename or "uploaded_file",
            file_key=file_key,
            file_size=len(file_data),
            mime_type=file.content_type or "application/octet-stream",
            file_url=file_url,
        )
        db.add(attachment)
        await db.commit()

        return {
            "file_key": file_key,
            "url": file_url,
            "filename": file.filename,
            "content_type": file.content_type,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error occurred during file upload: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Upload failed: {str(e)}")


@router.delete("/delete/{file_key}")
async def delete_file(
    file_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await db.execute(
            delete(TaskAttachment).where(
                TaskAttachment.file_key == file_key,
                TaskAttachment.user_id == current_user.id,
            )
        )
        await db.commit()
    except Exception as db_err:
        logger.error(f"Failed to delete attachment record: {db_err}")

    success = storage_service.delete_file(file_key)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to delete file '{file_key}'.")
    return {"success": True, "message": f"File '{file_key}' deleted successfully."}


@router.get("", status_code=status.HTTP_200_OK)
async def list_files(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            select(TaskAttachment).where(
                TaskAttachment.user_id == current_user.id,
                TaskAttachment.task_id == None,
            )
        )
        attachments = result.scalars().all()
        return [
            {
                "file_key": a.file_key,
                "filename": a.file_name,
                "size": a.file_size,
                "content_type": a.mime_type,
                "url": a.file_url,
                "updated_at": a.created_at.isoformat(),
            }
            for a in attachments
        ]
    except Exception as e:
        logger.error(f"Error listing files: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to list files: {str(e)}")
