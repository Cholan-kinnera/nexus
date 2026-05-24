from datetime import datetime
from typing import Optional

from pydantic import (
    BaseModel,
    Field
)

class TaskCreate(BaseModel):

    title: str = Field(
        ...,
        min_length=3,
        max_length=100,
        description="Task title"
    )

    description: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Task description"
    )

    priority: str = Field(
        default="MEDIUM",
        description="Task priority"
    )

    due_date: Optional[datetime] = None

    project_id: int

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None)
    status: Optional[str] = Field(default=None)
    priority: Optional[str] = Field(default=None)


class TaskResponse(BaseModel):

    id: int
    title: str
    description: Optional[str]
    status: str
    priority: str
    due_date: Optional[datetime]
    project_id: int
    assigned_to: Optional[int]

    class Config:
        from_attributes = True