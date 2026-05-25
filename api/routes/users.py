from fastapi import APIRouter, Depends, HTTPException, status
import logging
from dependencies.auth import get_current_user
from models.user import User
from schemas.user import UserResponse

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
            created_at=current_user.created_at if hasattr(current_user, "created_at") else None,
        )
    except Exception as exc:
        logger.error(f"Error retrieving user info: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving user information",
        )
