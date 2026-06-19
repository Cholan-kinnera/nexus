from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from schemas.auth import (
    AuthResponse,
    UserLogin,
    UserSignup,
    VerifyOTPRequest,
    TokenResponse,
    ForgotPasswordRequest,
    VerifyResetOTPRequest,
    ResetPasswordRequest,
    GenericMessageResponse,
    GoogleLoginRequest
)
from services.auth_service import (
    login_service,
    signup_service,
    verify_otp_service,
    refresh_token_service,
    logout_service,
    forgot_password_service,
    verify_reset_otp_service,
    reset_password_service,
    google_login_service
)
from sqlalchemy.ext.asyncio import AsyncSession
from core.config import settings

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
async def login(
    response: Response,
    user: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    res = await login_service(
        user.email,
        user.password,
        db
    )
    refresh_token = res.pop("refresh_token", None)
    if refresh_token:
        # Determine SameSite string value based on config
        samesite_val = settings.COOKIE_SAMESITE.lower()
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite=samesite_val,
            path="/api/auth",
            max_age=7 * 24 * 3600  # 7 days
        )
    return res

@router.post("/verify-otp", response_model=AuthResponse)
async def verify_otp(
    response: Response,
    data: VerifyOTPRequest,
    db: AsyncSession = Depends(get_db)
) -> AuthResponse:
    """Verify OTP code to activate session and create user."""
    res = await verify_otp_service(data.email, data.otp, db)
    refresh_token = res.pop("refresh_token", None)
    if refresh_token:
        samesite_val = settings.COOKIE_SAMESITE.lower()
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite=samesite_val,
            path="/api/auth",
            max_age=7 * 24 * 3600  # 7 days
        )
    return res


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    """Rotate access and refresh tokens using a valid refresh token from cookies."""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is missing from cookies"
        )
    
    res = await refresh_token_service(refresh_token, db)
    new_refresh = res.pop("refresh_token", None)
    if new_refresh:
        samesite_val = settings.COOKIE_SAMESITE.lower()
        response.set_cookie(
            key="refresh_token",
            value=new_refresh,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite=samesite_val,
            path="/api/auth",
            max_age=7 * 24 * 3600  # 7 days
        )
    return res


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """Revoke refresh token to log out the user session and clear cookies."""
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        await logout_service(refresh_token, db)
    
    samesite_val = settings.COOKIE_SAMESITE.lower()
    response.delete_cookie(
        key="refresh_token",
        path="/api/auth",
        secure=settings.COOKIE_SECURE,
        samesite=samesite_val
    )
    return {"message": "Logged out successfully"}


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


@router.post("/google", response_model=AuthResponse)
async def google_login(
    response: Response,
    data: GoogleLoginRequest,
    db: AsyncSession = Depends(get_db)
) -> AuthResponse:
    """Authenticates the user using Google OAuth ID token."""
    res = await google_login_service(data.credential_token, db)
    refresh_token = res.pop("refresh_token", None)
    if refresh_token:
        samesite_val = settings.COOKIE_SAMESITE.lower()
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite=samesite_val,
            path="/api/auth",
            max_age=7 * 24 * 3600  # 7 days
        )
    return res
