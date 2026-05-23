from sqlalchemy.ext.asyncio import AsyncSession
from core.security import (hash_password, verify_password, create_access_token)
from models.user import User


async def signup_service(
    email: str,
    password: str,
    db: AsyncSession
):

    new_user = User(
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


async def login_service(
    email: str,
    db: AsyncSession
):

    return {
        "message": "Login successful",
        "email": email
    }