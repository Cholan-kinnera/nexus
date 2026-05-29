from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from models.user import User
import logging
from core.security import (
    hash_password,
    verify_password,
    create_access_token
)

logger = logging.getLogger(__name__)

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

        # Create new user with hashed password
        new_user = User(
            full_name=full_name,
            email=email,
            password=hash_password(password)
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        return {
            "message": "User created successfully",
            "email": new_user.email
        }

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        
        logger.error(f"Login error: {e}")  # now you can actually debug it
        raise HTTPException(
            status_code=500,
            detail="Internal server error during login"
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
