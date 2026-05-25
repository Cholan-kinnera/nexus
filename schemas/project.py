from pydantic import BaseModel, ConfigDict, Field
from typing import  Optional

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
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    title: str
    description: Optional[str] = None
    owner_id: int