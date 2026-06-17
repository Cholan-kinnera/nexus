from fastapi import APIRouter, Depends, HTTPException, status
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from dependencies.auth import get_current_user
from models.user import User
from typing import List
from schemas.user import UserResponse, UserUpdate
from schemas.project import ProjectResponse
logger = logging.getLogger(__name__)
router = APIRouter()


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
            created_at=current_user.created_at if hasattr(current_user, "created_at") else None,
            full_name=current_user.full_name
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
        if data.full_name is not None:
            current_user.full_name = data.full_name
        if data.email is not None:
            if data.email != current_user.email:
                result = await db.execute(select(User).where(User.email == data.email))
                if result.scalar_one_or_none():
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Email already in use"
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
            created_at=current_user.created_at if hasattr(current_user, "created_at") else None,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error updating user info: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating user information",
        )

@router.get("/me/projects", response_model=List[ProjectResponse], tags=["Users"])
async def get_my_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from services.project_member_service import get_user_projects
    projects = await get_user_projects(db, current_user.id)
    return projects


@router.get("/lookup", response_model=UserResponse, tags=["Users"])
async def lookup_user_by_email(
    email: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> UserResponse:
    """Lookup a user by email address."""
    try:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found with this email"
            )
        return UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            created_at=user.created_at if hasattr(user, "created_at") else None
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error looking up user by email {email}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error looking up user"
        )

