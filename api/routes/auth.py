from fastapi import APIRouter, Depends, HTTPException, status
from  schemas.auth import UserSignup, UserLogin,AuthResponse
from  services.auth_service import signup_service, login_service
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db

router = APIRouter()

@router.post("/signup",response_model = AuthResponse)
async def signup(user: UserSignup, db: AsyncSession = Depends(get_db)):
    return await signup_service(
    user.email,
    user.password,
    db
)

@router.post("/login",response_model = AuthResponse)
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
    return await login_service(user.email, db)
