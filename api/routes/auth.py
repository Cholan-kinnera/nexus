from fastapi import APIRouter, Depends, HTTPException, status, Request
from schemas.auth import (
    AuthResponse,
    UserLogin,
    UserSignup,
    VerifyOTPRequest,
    RefreshTokenRequest,
    LogoutRequest,
    TokenResponse,
    ForgotPasswordRequest,
    VerifyResetOTPRequest,
    ResetPasswordRequest,
    GenericMessageResponse
)
from services.auth_service import (
    login_service,
    signup_service,
    verify_otp_service,
    refresh_token_service,
    logout_service,
    forgot_password_service,
    verify_reset_otp_service,
    reset_password_service
)
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


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    """Rotate access and refresh tokens using a valid refresh token."""
    return await refresh_token_service(data.refresh_token, db)


@router.post("/logout")
async def logout(
    data: LogoutRequest, db: AsyncSession = Depends(get_db)
):
    """Revoke refresh token to log out the user session."""
    return await logout_service(data.refresh_token, db)


@router.post("/forgot-password", response_model=GenericMessageResponse)
async def forgot_password(
    request: Request,
    data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
) -> GenericMessageResponse:
    """Request a password reset verification code sent to the email."""
    ip_address = request.client.host if request.client else "127.0.0.1"
    return await forgot_password_service(data.email, ip_address, db)


@router.post("/verify-reset-otp", response_model=GenericMessageResponse)
async def verify_reset_otp(
    data: VerifyResetOTPRequest, db: AsyncSession = Depends(get_db)
) -> GenericMessageResponse:
    """Verify the password reset OTP code."""
    return await verify_reset_otp_service(data.email, data.otp, db)


@router.post("/reset-password", response_model=GenericMessageResponse)
async def reset_password(
    data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)
) -> GenericMessageResponse:
    """Reset the password using a verified OTP code."""
    return await reset_password_service(data.email, data.otp, data.new_password, db)