from fastapi import APIRouter
from app.schemas.auth import UserSignup, UserLogin,AuthResponse
from app.services.auth_service import signup_service, login_service

router = APIRouter()

@router.post("/signup",response_model = AuthResponse)
async def signup(user: UserSignup):
    return await signup_service(user.email)
       


@router.post("/login",response_model = AuthResponse)
async def login(user: UserLogin):       
    return await login_service(user.email)
