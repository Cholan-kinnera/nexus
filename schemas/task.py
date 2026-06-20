from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class TaskCreate(BaseModel):

    title: str = Field(..., min_length=3, max_length=100, description="Task title")

    description: Optional[str] = Field(
        default=None, max_length=500, description="Task description"
    )

    priority: str = Field(default="MEDIUM", description="Task priority")

    due_date: Optional[datetime] = None

    project_id: int
    assigned_to: Optional[int] = Field(
        default=None, description="ID of the user assigned to this task"
    )


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=100)
    description: Optional[str] = Field(default=None)
    status: Optional[str] = Field(default=None)
    priority: Optional[str] = Field(default=None)
    assigned_to: Optional[int] = Field(default=None)


from schemas.user import UserResponse  # noqa: E402


class TaskAttachmentResponse(BaseModel):
    id: int
    task_id: int
    user_id: Optional[int] = None
    file_name: str
    file_key: str
    file_size: int
    mime_type: str
    file_url: str
    created_at: datetime
    user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str]
    status: str
    priority: str
    due_date: Optional[datetime]
    project_id: int
    assigned_to: Optional[int]
    attachments: list[TaskAttachmentResponse] = []
