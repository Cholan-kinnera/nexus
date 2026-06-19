from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, field_validator, computed_field


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str | None = None
    email: EmailStr
    role: Optional[str] = None
    created_at: Optional[datetime] = None
    avatar_url: Optional[str] = None

    @computed_field
    @property
    def name(self) -> Optional[str]:
        return self.full_name


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    name: Optional[str] = None

    @field_validator("name", "full_name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_trimmed = v.strip()
            if not v_trimmed:
                raise ValueError("Name cannot be empty")
            return v_trimmed
        return v


class AvatarResponse(BaseModel):
    avatar_url: str
