import random
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from models.user import User
from services.email import send_otp_email
from core.security import (
    hash_password,
    verify_password,
    create_access_token
)

logger = logging.getLogger(__name__)

# In-memory registration cache
otp_cache = {}

async def signup_service(
    full_name: str,
    email: str,
    password: str,
    db: AsyncSession
):
    try:
        # Check if user already exists
        result = await db.execute(
            select(User).where(User.email == email)
        )

        existing_user = result.scalar_one_or_none()

        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="User already exists"
            )

        # Generate random 6-digit OTP code
        otp_code = "".join([str(random.randint(0, 9)) for _ in range(6)])

        # Cache signup details with hashed password
        otp_cache[email] = {
            "full_name": full_name,
            "email": email,
            "password": hash_password(password),
            "otp": otp_code
        }

        # Send AWS SES verification email
        await send_otp_email(email, otp_code)

        return {
            "message": "Verification code sent to email. Please verify OTP.",
            "email": email,
            "access_token": None
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup setup error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during registration setup"
        )


async def verify_otp_service(
    email: str,
    otp: str,
    db: AsyncSession
):
    try:
        cached_data = otp_cache.get(email)
        if not cached_data or cached_data["otp"] != otp:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired verification code"
            )

        # Confirm user doesn't exist (concurrency check)
        result = await db.execute(
            select(User).where(User.email == email)
        )
        existing_user = result.scalar_one_or_none()
        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="User already exists"
            )

        # Persist user in database
        new_user = User(
            full_name=cached_data["full_name"],
            email=cached_data["email"],
            password=cached_data["password"]
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        # Remove cache entry on successful persistence
        otp_cache.pop(email, None)

        # Generate Access Token
        access_token = create_access_token(
            data={"sub": new_user.email}
        )

        return {
            "message": "Email verified successfully",
            "email": new_user.email,
            "full_name": new_user.full_name,
            "access_token": access_token
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OTP Verification error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during OTP verification"
        )


async def login_service(
    email: str,
    password: str,
    db: AsyncSession
):
    try:
        # Validate input parameters
        if not email or not password:
            raise HTTPException(
                status_code=400,
                detail="Email and password are required"
            )

        # Find user by email
        result = await db.execute(
            select(User).where(User.email == email)
        )

        user = result.scalar_one_or_none()

        # Check if user exists and password is correct
        if not user or not verify_password(password, user.password):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        # Generate access token
        access_token = create_access_token(
            data={"sub": user.email}
        )

        return {
            "message": "Login successful",
            "email": user.email,
            "full_name": user.full_name,
            "access_token": access_token
        }

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Handle any unexpected errors
        raise HTTPException(
            status_code=500,
            detail="Internal server error during login"
        )
