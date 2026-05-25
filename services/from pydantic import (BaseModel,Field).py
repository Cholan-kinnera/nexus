from pydantic import (BaseModel,Field)
from typing import List, Optional

class ProjectCreate(BaseModel):
    title: str = Field(
        ...,
        min_length=3,
        max_length=100,
        description="Project title"
    )
    description: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Project description"
    )


class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)


class ProjectResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    owner_id: int

    
    class Config:
        from_attributes = True