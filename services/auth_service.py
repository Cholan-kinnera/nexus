from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.user import User

from core.security import (
    hash_password,
    verify_password,
    create_access_token
)


async def signup_service(
    email: str,
    password: str,
    db: AsyncSession
):

    result = await db.execute(
        select(User).where(User.email == email)
    )

    existing_user = result.scalar_one_or_none()

    if existing_user:
        return {
            "message": "User already exists",
            "email": email
        }

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
    password: str,
    db: AsyncSession
):

    result = await db.execute(
        select(User).where(User.email == email)
    )

    user = result.scalar_one_or_none()

    if not user:
        return {
            "message": "Invalid email",
            "email": email
        }

    if not verify_password(
        password,
        user.password
    ):
        return {
            "message": "Invalid password",
            "email": email
        }

    access_token = create_access_token(
        data={"sub": user.email}
    )

    return {
        "message": "Login successful",
        "email": user.email,
        "access_token": access_token
    }