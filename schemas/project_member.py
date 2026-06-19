from typing import Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime


class ProjectMemberBase(BaseModel):
    role: str


class ProjectMemberCreate(ProjectMemberBase):
    user_id: int


class ProjectMemberUpdate(ProjectMemberBase):
    pass


class ProjectMemberResponse(BaseModel):
    id: int
    user_id: int
    full_name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    joined_at: datetime
    invited_by: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)
