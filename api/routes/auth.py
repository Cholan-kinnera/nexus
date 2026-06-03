from fastapi import APIRouter, Depends, HTTPException, status
from schemas.auth import AuthResponse, UserLogin, UserSignup, VerifyOTPRequest
from services.auth_service import login_service, signup_service, verify_otp_service
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db

router = APIRouter()

@router.post("/signup", response_model=AuthResponse)
async def signup(
    user: UserSignup, db: AsyncSession = Depends(get_db)
) -> AuthResponse:
    """Register a new user pending verification.

    Args:
        user: User registration details
        db: Database session

    Returns:
        Authentication response
    """
    return await signup_service(user.full_name, user.email, user.password, db)

@router.post("/login", response_model=AuthResponse)
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
    return await login_service(
        user.email,
        user.password,
        db
    )

@router.post("/verify-otp", response_model=AuthResponse)
async def verify_otp(
    data: VerifyOTPRequest, db: AsyncSession = Depends(get_db)
) -> AuthResponse:
    """Verify OTP code to activate session and create user.
    """
    return await verify_otp_service(data.email, data.otp, db)