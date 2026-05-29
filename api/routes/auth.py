from fastapi import APIRouter, Depends, HTTPException, status
from schemas.auth import AuthResponse, UserLogin, UserSignup
from services.auth_service import login_service, signup_service
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db

router = APIRouter()

@router.post("/signup", response_model=AuthResponse)
async def signup(
    user: UserSignup, db: AsyncSession = Depends(get_db)
) -> AuthResponse:
    """Register a new user.

    Args:
        user: User registration details
        db: Database session

    Returns:
        Authentication response with access token

    Raises:
        HTTPException: If user already exists or registration fails
    """
    return await signup_service(user.full_name, user.email, user.password, db)

@router.post("/login",response_model = AuthResponse)
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
   return await login_service(
    user.email,
    user.password,
    db
)