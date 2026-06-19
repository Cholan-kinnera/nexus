from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func
from fastapi import HTTPException

from models.project import Project
from models.project_member import ProjectMember
from models.task import Task
from services.activity_service import create_activity_log
from services.notification_service import create_notification
from services.project_member_service import require_project_role
from core.pagination import PaginationParams, paginate
import logging

logger = logging.getLogger(__name__)


async def create_project_service(
    project_data,
    owner_id: int,
    db: AsyncSession
):
    new_project = Project(
        title=project_data.title,
        description=project_data.description,
        owner_id=owner_id
    )

    db.add(new_project)
    await db.flush()  # assigns new_project.id without committing

    # Automatically add creator as OWNER in project_members
    owner_member = ProjectMember(
        project_id=new_project.id,
        user_id=owner_id,
        role="owner",
        invited_by=None,
    )
    db.add(owner_member)

    await db.commit()
    await db.refresh(new_project)

    # Log PROJECT_CREATED
    try:
        await create_activity_log(
            db=db,
            user_id=owner_id,
            action="PROJECT_CREATED",
            entity_type="project",
            entity_id=new_project.id,
            metadata={
                "project_id": new_project.id,
                "project_name": new_project.title
            }
        )
    except Exception as e:
        logger.error(f"Failed to log PROJECT_CREATED event: {e}", exc_info=True)

    return new_project


async def get_projects_service(
    db: AsyncSession,
    owner_id: int,
    params: PaginationParams
):
    query = (
        select(Project)
        .outerjoin(ProjectMember, Project.id == ProjectMember.project_id)
        .where((ProjectMember.user_id == owner_id) | (Project.owner_id == owner_id))
        .distinct()
    )
    
    # 1. Log current authenticated user ID on every projects request.
    logger.info(f"PROJECT FETCH DEBUG - Current User ID: {owner_id}")
    
    # 2. Log SQL query used to fetch projects.
    try:
        from sqlalchemy.dialects import postgresql
        compiled_sql = query.compile(dialect=postgresql.dialect(), compile_kwargs={"literal_binds": True})
        logger.info(f"PROJECT FETCH SQL QUERY:\n{compiled_sql}")
    except Exception as e:
        logger.error(f"Failed to compile SQL query for projects fetch: {e}")

    result_dict = await paginate(
        db=db,
        query=query,
        model=Project,
        params=params,
        search_fields=["title", "description"]
    )

    projects = result_dict.get("items", [])
    project_owner_ids = [p.owner_id for p in projects]

    # Calculate members count for each returned project
    member_counts = []
    for p in projects:
        count_res = await db.execute(
            select(func.count(ProjectMember.id)).where(ProjectMember.project_id == p.id)
        )
        member_counts.append(count_res.scalar_one() or 0)

    # Compare current_user.id (owner_id here) and project.owner_id
    for p in projects:
        logger.info(f"Comparing project id={p.id}: current_user.id={owner_id}, project.owner_id={p.owner_id}")

    # Add required diagnostics
    diagnostics = (
        f"\nPROJECT FETCH DEBUG\n"
        f"Current User ID: {owner_id}\n"
        f"Projects Returned: {len(projects)}\n"
        f"Project Owner IDs: {project_owner_ids}\n"
        f"Project Members Count: {member_counts}\n"
    )
    logger.info(diagnostics)
    print(diagnostics)

    return result_dict


async def get_project_by_id_service(
    project_id: int,
    current_user,
    db: AsyncSession
):
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )

    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    await require_project_role(
        db, project_id, current_user.id,
        ["owner", "manager", "developer", "viewer"]
    )

    return project


async def update_project_service(
    project_id: int,
    project_data,
    current_user,
    db: AsyncSession
):
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )

    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    await require_project_role(
        db, project_id, current_user.id,
        ["owner", "manager"]
    )

    update_data = project_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(project, key, value)

    await db.commit()
    await db.refresh(project)

    # Log PROJECT_UPDATED
    try:
        await create_activity_log(
            db=db,
            user_id=current_user.id,
            action="PROJECT_UPDATED",
            entity_type="project",
            entity_id=project.id,
            metadata={
                "project_id": project.id,
                "project_name": project.title
            }
        )
    except Exception as e:
        logger.error(f"Failed to log PROJECT_UPDATED event: {e}", exc_info=True)

    # Notify all project members (excluding updater)
    try:
        member_result = await db.execute(
            select(ProjectMember.user_id).where(
                ProjectMember.project_id == project.id
            )
        )
        stakeholders = {row[0] for row in member_result.fetchall()}
            
        stakeholders.discard(current_user.id)
        
        for stakeholder_id in stakeholders:
            await create_notification(
                db=db,
                user_id=stakeholder_id,
                title="Project Updated",
                message=f"Project {project.title} was updated",
                metadata={
                    "project_id": project.id,
                    "project_name": project.title
                }
            )
    except Exception as e:
        logger.error(f"Failed to notify project stakeholders: {e}", exc_info=True)

    return project


async def delete_project_service(
    project_id: int,
    current_user,
    db: AsyncSession
):
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )

    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    await require_project_role(
        db, project_id, current_user.id,
        ["owner"]
    )

    # Keep metadata for logging post-deletion
    project_title = project.title

    # Delete all tasks belonging to this project
    await db.execute(
        delete(Task).where(
            Task.project_id == project.id
        )
    )

    # Delete project
    await db.delete(project)

    await db.commit()

    # Log PROJECT_DELETED
    try:
        await create_activity_log(
            db=db,
            user_id=current_user.id,
            action="PROJECT_DELETED",
            entity_type="project",
            entity_id=project_id,
            metadata={
                "project_id": project_id,
                "project_name": project_title
            }
        )
    except Exception as e:
        logger.error(f"Failed to log PROJECT_DELETED event: {e}", exc_info=True)

    return {
        "message": "Project deleted successfully"
    }