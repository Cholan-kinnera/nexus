from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from dependencies.auth import get_current_user
from models.user import User
from typing import List
from schemas.user import UserResponse, UserUpdate, AvatarResponse
from schemas.project import ProjectResponse
from services.storage_service import storage_service

logger = logging.getLogger(__name__)
router = APIRouter()

# Max avatar size: 5 MB
MAX_AVATAR_SIZE = 5 * 1024 * 1024
ALLOWED_AVATAR_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
ALLOWED_AVATAR_MIMES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}


@router.get("/me", response_model=UserResponse, tags=["Users"])
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Get current authenticated user information."""
    try:
        return UserResponse(
            id=current_user.id,
            email=current_user.email,
            role=current_user.role,
            created_at=(
                current_user.created_at if hasattr(current_user, "created_at") else None
            ),
            full_name=current_user.full_name,
            avatar_url=current_user.avatar_url,
        )
    except Exception as exc:
        logger.error(f"Error retrieving user info: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving user information",
        )


@router.put("/me", response_model=UserResponse, tags=["Users"])
async def update_current_user_info(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Update current user profile info."""
    try:
        # Handle both name and full_name fields
        if data.name is not None:
            current_user.full_name = data.name
        elif data.full_name is not None:
            current_user.full_name = data.full_name

        if data.email is not None:
            if data.email != current_user.email:
                result = await db.execute(select(User).where(User.email == data.email))
                if result.scalar_one_or_none():
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Email already in use",
                    )
            current_user.email = data.email
        if data.role is not None:
            current_user.role = data.role

        db.add(current_user)
        await db.commit()
        await db.refresh(current_user)

        return UserResponse(
            id=current_user.id,
            email=current_user.email,
            full_name=current_user.full_name,
            role=current_user.role,
            created_at=(
                current_user.created_at if hasattr(current_user, "created_at") else None
            ),
            avatar_url=current_user.avatar_url,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error updating user info: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating user information",
        )


@router.post("/me/avatar", response_model=AvatarResponse, tags=["Users"])
async def upload_profile_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AvatarResponse:
    """
    Upload a user profile avatar image.
    Validates the format (png, jpg, jpeg, webp) and size limit (max 5MB).
    Deletes the user's previous avatar from the storage backend if one exists.
    Saves the new avatar file in R2 and links the public URL to the user profile database record.
    """
    try:
        # Validate format extension
        ext = (
            file.filename.split(".")[-1].lower()
            if file.filename and "." in file.filename
            else ""
        )
        if ext not in ALLOWED_AVATAR_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File extension '.{ext}' is not supported.",
            )

        # Validate MIME type
        if file.content_type and file.content_type not in ALLOWED_AVATAR_MIMES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Mime type '{file.content_type}' is not supported.",
            )

        # Read file content
        file_data = await file.read()

        # Validate size boundary
        if len(file_data) > MAX_AVATAR_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds the limit of {MAX_AVATAR_SIZE / (1024 * 1024)} MB.",
            )

        # Delete old avatar file from storage if present
        if current_user.avatar_url:
            try:
                old_key = current_user.avatar_url.split("/")[-1]
                storage_service.delete_file(old_key)
                logger.info(f"Deleted old user avatar: {old_key}")
            except Exception as e:
                logger.warning(
                    f"Failed to delete old avatar file '{current_user.avatar_url}': {e}"
                )

        # Upload new avatar
        new_key = storage_service.upload_file(
            file_data=file_data,
            file_name=file.filename or "avatar.png",
            content_type=file.content_type,
        )

        # Save new retrieval URL to the user record
        avatar_url = storage_service.generate_file_url(new_key)
        current_user.avatar_url = avatar_url

        db.add(current_user)
        await db.commit()
        await db.refresh(current_user)

        return AvatarResponse(avatar_url=avatar_url)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error occurred during avatar upload: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Avatar upload failed: {str(e)}",
        )


@router.get("/me/projects", response_model=List[ProjectResponse], tags=["Users"])
async def get_my_projects(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    from services.project_member_service import get_user_projects

    projects = await get_user_projects(db, current_user.id)
    return projects


@router.get("/lookup", response_model=UserResponse, tags=["Users"])
async def lookup_user_by_email(
    email: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Lookup a user by email address."""
    try:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found with this email",
            )
        return UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            created_at=user.created_at if hasattr(user, "created_at") else None,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error looking up user by email {email}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error looking up user",
        )


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT, tags=["Users"])
async def delete_current_user_account(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """Delete current authenticated user account and all owned resources."""
    try:
        from sqlalchemy import update, delete
        from models.project import Project
        from models.task import Task

        # 1. Delete user avatar file from R2 if present
        if current_user.avatar_url:
            try:
                old_key = current_user.avatar_url.split("/")[-1]
                storage_service.delete_file(old_key)
                logger.info(f"Deleted user avatar on account deletion: {old_key}")
            except Exception as e:
                logger.warning(f"Failed to delete avatar file on account deletion: {e}")

        # 2. Update all tasks assigned to this user to NULL
        await db.execute(
            update(Task)
            .where(Task.assigned_to == current_user.id)
            .values(assigned_to=None)
        )

        # 3. Find projects owned by this user
        result = await db.execute(
            select(Project).where(Project.owner_id == current_user.id)
        )
        owned_projects = result.scalars().all()

        for proj in owned_projects:
            # Delete tasks in the project
            await db.execute(delete(Task).where(Task.project_id == proj.id))
            # Delete project
            await db.delete(proj)

        # 4. Delete the user
        await db.delete(current_user)
        await db.commit()
        return None
    except Exception as exc:
        logger.error(f"Error deleting user account: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting user account",
        )
