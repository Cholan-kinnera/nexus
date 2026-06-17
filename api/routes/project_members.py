from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from dependencies.auth import get_current_user
from models.user import User

from schemas.project_member import (
    ProjectMemberCreate,
    ProjectMemberUpdate,
    ProjectMemberResponse
)
from services.project_member_service import (
    add_project_member,
    get_project_members,
    update_project_member_role,
    remove_project_member
)

router = APIRouter()

@router.post("/{project_id}/members", response_model=ProjectMemberResponse, status_code=status.HTTP_201_CREATED)
async def create_project_member(
    project_id: int,
    member_data: ProjectMemberCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = await add_project_member(
        db=db,
        project_id=project_id,
        user_id=member_data.user_id,
        role=member_data.role,
        current_user_id=current_user.id
    )
    # The return from add_project_member is a ProjectMember model instance.
    # To match ProjectMemberResponse, it lacks full_name and email which are populated in get_project_members.
    # But for a simple creation, returning what we have is standard, or we could fetch the user data.
    # Pydantic's Optional fields for full_name/email handle it if they are missing.
    return member


@router.get("/{project_id}/members", response_model=List[ProjectMemberResponse])
async def list_project_members(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Depending on requirements, we could enforce that only members of the project can view members.
    # But the instruction just says "JWT protected".
    members = await get_project_members(db, project_id=project_id)
    return members


@router.patch("/{project_id}/members/{user_id}", response_model=ProjectMemberResponse)
async def update_member_role(
    project_id: int,
    user_id: int,
    member_data: ProjectMemberUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = await update_project_member_role(
        db=db,
        project_id=project_id,
        user_id=user_id,
        new_role=member_data.role,
        current_user_id=current_user.id
    )
    return member


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_200_OK)
async def remove_member(
    project_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await remove_project_member(
        db=db,
        project_id=project_id,
        user_id=user_id,
        current_user_id=current_user.id
    )
    return {"message": "Member removed successfully"}
