from pydantic import BaseModel, EmailStr


class UserSignup(BaseModel):
    full_name: str
    email: EmailStr
    password: str
  

class UserLogin(BaseModel):
    email: EmailStr
    password: str   


class AuthResponse(BaseModel):
    message: str
    email: EmailStr
    access_token: str | None = None