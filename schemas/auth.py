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
    full_name: str | None = None
    access_token: str | None = None


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str