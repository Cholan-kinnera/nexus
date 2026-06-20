import mimetypes
from typing import List
from fastapi import HTTPException, status, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models.task import Task
from models.task_attachment import TaskAttachment
from services.storage_service import storage_service
from services.project_member_service import (
    require_project_role,
    get_project_member_role,
)
from services.activity_service import create_activity_log

ALLOWED_EXTENSIONS = {
    # PDF
    "pdf",
    # Images
    "png",
    "jpg",
    "jpeg",
    "gif",
    "webp",
    "svg",
    # ZIP
    "zip",
    # DOCX
    "docx",
    # TXT
    "txt",
    # XLSX
    "xlsx",
    # CSV
    "csv",
}

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "application/zip",
    "application/x-zip-compressed",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


async def create_attachment(
    db: AsyncSession, task_id: int, file: UploadFile, current_user
) -> TaskAttachment:
    # 1. Fetch the task
    task_result = await db.execute(select(Task).where(Task.id == task_id))
    task = task_result.scalar_one_or_none()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    # 2. Check project roles (Owner, Manager, Developer)
    await require_project_role(
        db, task.project_id, current_user.id, ["owner", "manager", "developer"]
    )

    # 3. Read and validate file size and file type
    file_data = await file.read()
    file_size = len(file_data)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the limit of 10 MB.",
        )

    filename = file.filename or "attachment"
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '.{ext}' is not supported. Supported extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    content_type = (
        file.content_type
        or mimetypes.guess_type(filename)[0]
        or "application/octet-stream"
    )
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mime type '{content_type}' is not supported.",
        )

    # 4. Upload file using storage_service
    try:
        file_key = storage_service.upload_file(
            file_data=file_data, file_name=filename, content_type=content_type
        )
        file_url = storage_service.generate_file_url(file_key)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload attachment to storage: {str(e)}",
        )

    # 5. Create db record
    attachment = TaskAttachment(
        task_id=task_id,
        user_id=current_user.id,
        file_name=filename,
        file_key=file_key,
        file_size=file_size,
        mime_type=content_type,
        file_url=file_url,
    )
    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)

    # 6. Log activity
    try:
        await create_activity_log(
            db=db,
            user_id=current_user.id,
            action="TASK_ATTACHMENT_ADDED",
            entity_type="task_attachment",
            entity_id=attachment.id,
            metadata={
                "task_id": task_id,
                "project_id": task.project_id,
                "attachment_id": attachment.id,
                "file_name": filename,
            },
        )
    except Exception:
        pass

    return attachment


async def get_attachments_by_task(
    db: AsyncSession, task_id: int, current_user
) -> List[TaskAttachment]:
    # 1. Fetch the task
    task_result = await db.execute(select(Task).where(Task.id == task_id))
    task = task_result.scalar_one_or_none()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    # 2. Check project permission (any role: owner, manager, developer, viewer)
    await require_project_role(
        db,
        task.project_id,
        current_user.id,
        ["owner", "manager", "developer", "viewer"],
    )

    # 3. Retrieve attachments
    attachments_result = await db.execute(
        select(TaskAttachment)
        .where(TaskAttachment.task_id == task_id)
        .order_by(TaskAttachment.created_at.asc())
    )
    return list(attachments_result.scalars().all())


async def delete_attachment(db: AsyncSession, attachment_id: int, current_user):
    # 1. Fetch attachment
    attachment_result = await db.execute(
        select(TaskAttachment).where(TaskAttachment.id == attachment_id)
    )
    attachment = attachment_result.scalar_one_or_none()
    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found"
        )

    # 2. Fetch parent task to retrieve project id
    task_result = await db.execute(select(Task).where(Task.id == attachment.task_id))
    task = task_result.scalar_one_or_none()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found for this attachment",
        )

    # 3. Check permission: must be project Owner, Manager, Developer OR the original uploader
    role = await get_project_member_role(db, task.project_id, current_user.id)

    is_uploader = attachment.user_id == current_user.id
    has_project_role = role in ["owner", "manager", "developer"]

    if not (is_uploader or has_project_role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this attachment",
        )

    # 4. Delete from Cloudflare R2
    storage_service.delete_file(attachment.file_key)

    # 5. Delete from DB
    await db.delete(attachment)
    await db.commit()

    # 6. Log activity
    try:
        await create_activity_log(
            db=db,
            user_id=current_user.id,
            action="TASK_ATTACHMENT_DELETED",
            entity_type="task_attachment",
            entity_id=attachment_id,
            metadata={
                "task_id": task.id,
                "project_id": task.project_id,
                "attachment_id": attachment_id,
                "file_name": attachment.file_name,
            },
        )
    except Exception:
        pass

    return {"message": "Attachment deleted successfully"}
