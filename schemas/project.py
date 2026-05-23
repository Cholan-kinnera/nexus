from pydantic import (BaseModel,Field)

class ProjectCreate(BaseModel):
    title: str = Field(
        ...,
        min_length=3,
        max_length=100,
        description="Project title"
    )
    description: str | None = Field(
        default=None,
        max_length=500,
        description="Project description"
    )


class ProjectResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    owner_id: int
    class Config:
        from_attributes = True