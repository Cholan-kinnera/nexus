import logging
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.project import Project
from models.project_member import ProjectMember
from models.user import User

logger = logging.getLogger(__name__)


async def get_project_member_role(
    db: AsyncSession, project_id: int, user_id: int
) -> str | None:
    """Retrieve the role of a user in a project.

    Supports fallback to Project.owner_id for legacy/creator role resolution.
    """
    # 1. Check project_members table
    result = await db.execute(
        select(ProjectMember.role).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
    )
    role = result.scalar_one_or_none()
    if role:
        return role

    # 2. Fallback to Project owner_id check
    result = await db.execute(
        select(Project.owner_id).where(Project.id == project_id)
    )
    owner_id = result.scalar_one_or_none()
    if owner_id == user_id:
        return "owner"

    return None


async def require_project_role(
    db: AsyncSession, project_id: int, user_id: int, allowed_roles: list[str]
) -> str:
    """Validate that the user holds one of the allowed roles within the project.

    Raises 403 Forbidden if not authorized.
    """
    role = await get_project_member_role(db, project_id, user_id)
    if not role or role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this project",
        )
    return role


async def add_project_member(
    db: AsyncSession,
    project_id: int,
    user_id: int,
    role: str,
    current_user_id: int,
) -> ProjectMember:
    """Add a user to a project.

    Owner can invite: owner, manager, developer, viewer.
    Manager can invite: developer, viewer only.
    """
    # 1. Verify project exists
    proj_result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = proj_result.scalar_one_or_none()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    # 2. Verify target user exists
    user_result = await db.execute(select(User).where(User.id == user_id))
    target_user = user_result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # 3. Check authorization of current_user
    current_role = await get_project_member_role(db, project_id, current_user_id)
    if current_role not in ["owner", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owners and managers can add members",
        )

    # 4. Enforce manager invitation limits
    if current_role == "manager" and role not in ["developer", "viewer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Managers can only add developers or viewers",
        )

    # 5. Prevent duplicate memberships
    member_result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
    )
    existing_member = member_result.scalar_one_or_none()
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already a member of this project",
        )

    # 6. Create membership
    new_member = ProjectMember(
        project_id=project_id,
        user_id=user_id,
        role=role,
        invited_by=current_user_id,
    )
    db.add(new_member)
    await db.commit()
    await db.refresh(new_member)

    # 7. Create activity log (MEMBER_ADDED) safely
    try:
        from services.activity_service import create_activity_log

        await create_activity_log(
            db=db,
            user_id=current_user_id,
            action="MEMBER_ADDED",
            entity_type="project_member",
            entity_id=new_member.id,
            metadata={
                "project_id": project_id,
                "project_name": project.title,
                "user_id": user_id,
                "user_name": target_user.full_name,
                "role": role,
                "invited_by": current_user_id,
            },
        )
    except Exception as e:
        logger.error(f"Failed to log MEMBER_ADDED event: {e}", exc_info=True)

    # 8. Create notification for invited user safely
    try:
        from services.notification_service import create_notification

        await create_notification(
            db=db,
            user_id=user_id,
            title="Invited to Project",
            message=f"You have been added to project {project.title} as {role}",
            metadata={
                "project_id": project_id,
                "project_name": project.title,
                "role": role,
            },
        )
    except Exception as e:
        logger.error(f"Failed to notify invited user: {e}", exc_info=True)

    return new_member


async def remove_project_member(
    db: AsyncSession, project_id: int, user_id: int, current_user_id: int
) -> None:
    """Remove a user from a project.

    Owner cannot be removed.
    Managers cannot remove owners or other managers.
    """
    # 1. Verify membership exists
    member_result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
    )
    member = member_result.scalar_one_or_none()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Membership not found"
        )

    # 2. Owner cannot be removed
    if member.role == "owner":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The project owner cannot be removed",
        )

    # 3. Check authorization of current_user
    current_role = await get_project_member_role(db, project_id, current_user_id)
    if current_role not in ["owner", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owners and managers can remove members",
        )

    # 4. Managers cannot remove owners or other managers
    if current_role == "manager" and member.role in ["owner", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Managers cannot remove owners or other managers",
        )

    # Fetch project details for logging
    proj_result = await db.execute(
        select(Project.title).where(Project.id == project_id)
    )
    project_title = proj_result.scalar_one_or_none() or ""

    # 5. Remove membership
    await db.delete(member)
    await db.commit()

    # 6. Create activity log (MEMBER_REMOVED) safely
    try:
        from services.activity_service import create_activity_log

        await create_activity_log(
            db=db,
            user_id=current_user_id,
            action="MEMBER_REMOVED",
            entity_type="project_member",
            entity_id=user_id,
            metadata={
                "project_id": project_id,
                "project_name": project_title,
                "user_id": user_id,
                "removed_by": current_user_id,
            },
        )
    except Exception as e:
        logger.error(f"Failed to log MEMBER_REMOVED event: {e}", exc_info=True)


async def update_project_member_role(
    db: AsyncSession,
    project_id: int,
    user_id: int,
    new_role: str,
    current_user_id: int,
) -> ProjectMember:
    """Change member role.

    Owner role cannot be demoted or removed.
    Managers cannot promote users to Owner or demote/modify managers.
    Promoting to Owner transfers ownership.
    """
    # 1. Verify membership exists
    member_result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
    )
    member = member_result.scalar_one_or_none()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Membership not found"
        )

    # 2. Owner role cannot be demoted or removed
    if member.role == "owner":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The project owner role cannot be demoted",
        )

    # 3. Check authorization of current_user
    current_role = await get_project_member_role(db, project_id, current_user_id)
    if current_role not in ["owner", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owners and managers can update member roles",
        )

    # 4. Managers cannot promote to owner or modify manager/owner roles
    if current_role == "manager":
        if new_role == "owner":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Managers cannot promote users to owner",
            )
        if member.role == "manager" or new_role == "manager":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Managers cannot modify manager roles",
            )

    old_role = member.role

    # 5. Handle Owner-to-Owner transfer
    if new_role == "owner" and current_role == "owner":
        # Demote current owner to manager
        owner_member_result = await db.execute(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == current_user_id,
            )
        )
        owner_member = owner_member_result.scalar_one_or_none()
        if owner_member:
            owner_member.role = "manager"

        # Update Project.owner_id fallback reference
        proj_result = await db.execute(
            select(Project).where(Project.id == project_id)
        )
        project = proj_result.scalar_one_or_none()
        if project:
            project.owner_id = user_id

    # 6. Apply update
    member.role = new_role
    await db.commit()
    await db.refresh(member)

    # 7. Create activity log (MEMBER_ROLE_UPDATED) safely
    try:
        from services.activity_service import create_activity_log

        await create_activity_log(
            db=db,
            user_id=current_user_id,
            action="MEMBER_ROLE_UPDATED",
            entity_type="project_member",
            entity_id=member.id,
            metadata={
                "project_id": project_id,
                "user_id": user_id,
                "old_role": old_role,
                "new_role": new_role,
                "updated_by": current_user_id,
            },
        )
    except Exception as e:
        logger.error(
            f"Failed to log MEMBER_ROLE_UPDATED event: {e}", exc_info=True
        )

    # 8. Create notification for target user safely
    try:
        from services.notification_service import create_notification
        proj_result = await db.execute(
            select(Project.title).where(Project.id == project_id)
        )
        project_title = proj_result.scalar_one_or_none() or "Unknown Project"

        await create_notification(
            db=db,
            user_id=user_id,
            title="Project Role Updated",
            message=f"Your role in project '{project_title}' has been updated to {new_role}",
            metadata={
                "project_id": project_id,
                "project_name": project_title,
                "role": new_role,
            },
        )
    except Exception as e:
        logger.error(
            f"Failed to notify user of role update: {e}", exc_info=True
        )

    return member


async def get_project_members(db: AsyncSession, project_id: int) -> list[dict]:
    """Return all members for a project (joins with User)."""
    result = await db.execute(
        select(
            ProjectMember.id,
            ProjectMember.user_id,
            User.full_name,
            User.email,
            User.avatar_url,
            ProjectMember.role,
            ProjectMember.joined_at,
            ProjectMember.invited_by,
        )
        .join(User, ProjectMember.user_id == User.id)
        .where(ProjectMember.project_id == project_id)
        .order_by(ProjectMember.joined_at.asc())
    )
    members = []
    for row in result.fetchall():
        members.append(
            {
                "id": row[0],
                "user_id": row[1],
                "full_name": row[2],
                "email": row[3],
                "avatar_url": row[4],
                "role": row[5],
                "joined_at": row[6],
                "invited_by": row[7],
            }
        )
    return members


async def get_user_projects(db: AsyncSession, user_id: int) -> list[Project]:
    """Return all projects a user belongs to (as owner or member)."""
    result = await db.execute(
        select(Project)
        .outerjoin(ProjectMember, Project.id == ProjectMember.project_id)
        .where((ProjectMember.user_id == user_id) | (Project.owner_id == user_id))
        .distinct()
    )
    return list(result.scalars().all())
