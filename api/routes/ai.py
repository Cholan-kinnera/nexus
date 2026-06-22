import json
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.database import get_db
from dependencies.auth import get_current_user
from models.user import User
from models.project import Project
from models.task import Task
from services.ai_service import generate_content, AIServiceError
from services.project_member_service import require_project_role

logger = logging.getLogger(__name__)

router = APIRouter()


class TaskSuggestion(BaseModel):
    title: str = Field(..., max_length=60)
    description: str = Field(..., max_length=150)
    priority: Optional[str] = Field(default=None, description="Task priority (LOW, MEDIUM, HIGH)")


class ProjectSummaryResponse(BaseModel):
    summary: str


class TaskDescriptionResponse(BaseModel):
    description: str


class MeetingNotesRequest(BaseModel):
    meeting_notes: str


@router.post("/projects/{project_id}/generate-tasks", response_model=List[TaskSuggestion])
async def generate_tasks_from_description(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Fetch the project by project_id
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 2. Check roles/permissions
    await require_project_role(
        db, project_id, current_user.id, ["owner", "manager", "developer", "viewer"]
    )

    # 3. Extract description text
    description_text = ""
    if project.description:
        try:
            data = json.loads(project.description)
            if isinstance(data, dict):
                description_text = data.get("desc", "")
            else:
                description_text = project.description
        except json.JSONDecodeError:
            description_text = project.description

    if not description_text or not description_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Project description is empty. Cannot generate tasks."
        )

    # 4. Call AI Service
    system_prompt = (
        "You are a project management assistant. Given a project description, "
        "generate 5 to 7 actionable task suggestions. Return ONLY a valid JSON array, "
        "no markdown, no explanation. Each item must have: title (string, max 60 chars) "
        "and description (string, max 150 chars). "
        "Example: [{\"title\": \"...\", \"description\": \"...\"}]"
    )

    try:
        response_text = await generate_content(system_prompt, description_text)
    except AIServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # 5. Parse and validate JSON response
    try:
        cleaned_response = response_text.strip()
        if cleaned_response.startswith("```"):
            lines = cleaned_response.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            cleaned_response = "\n".join(lines).strip()

        suggestions = json.loads(cleaned_response)
        if not isinstance(suggestions, list):
            raise ValueError("AI response is not a JSON array")

        validated_suggestions = []
        for sug in suggestions:
            if not isinstance(sug, dict) or "title" not in sug or "description" not in sug:
                raise ValueError("AI suggestion format is incorrect")
            validated_suggestions.append(
                TaskSuggestion(
                    title=str(sug["title"])[:60],
                    description=str(sug["description"])[:150],
                    priority=str(sug.get("priority", "MEDIUM")).upper()
                )
            )

        return validated_suggestions

    except Exception as e:
        logger.error(f"Failed to parse or validate AI suggestions. Raw response: {response_text}. Error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="AI model generated a malformed response. Please try again."
        )


@router.post("/projects/{project_id}/summarize", response_model=ProjectSummaryResponse)
async def summarize_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Fetch the project by project_id
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 2. Check roles/permissions
    await require_project_role(
        db, project_id, current_user.id, ["owner", "manager", "developer", "viewer"]
    )

    # 3. Extract description text and other metadata
    desc = ""
    category = "General"
    priority = "MEDIUM"
    deadline = "None"

    if project.description:
        try:
            data = json.loads(project.description)
            if isinstance(data, dict):
                desc = data.get("desc", "")
                category = data.get("category", "General")
                priority = data.get("priority", "MEDIUM")
                deadline = data.get("deadline", "None")
            else:
                desc = project.description
        except json.JSONDecodeError:
            desc = project.description

    user_input = (
        f"Project Name: {project.title}\n"
        f"Description: {desc}\n"
        f"Category: {category}\n"
        f"Priority: {priority}\n"
        f"Deadline: {deadline}"
    )

    # 4. Call AI Service
    system_prompt = (
        "You are a project management assistant. Given a project's details, "
        "write a concise executive summary in 3-5 sentences. Cover what the project is, "
        "its goal, category, priority level, and deadline context. Be direct and professional. "
        "Return plain text only, no markdown, no bullet points."
    )

    try:
        response_text = await generate_content(system_prompt, user_input)
        return ProjectSummaryResponse(summary=response_text.strip())
    except AIServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tasks/{task_id}/generate-description", response_model=TaskDescriptionResponse)
async def generate_task_description(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Fetch the task by task_id
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # 2. Verify current user has membership in task's project
    await require_project_role(
        db, task.project_id, current_user.id, ["owner", "manager", "developer", "viewer"]
    )

    # 3. Call AI Service
    system_prompt = (
        "You are a project management assistant. Given a task title, "
        "write a clear and actionable task description in 2-4 sentences. Include what "
        "needs to be done, implied acceptance criteria, and a brief reason why it matters. "
        "Return plain text only, no markdown, no bullet points."
    )

    user_input = f"Task Title: {task.title}"

    try:
        response_text = await generate_content(system_prompt, user_input)
        return TaskDescriptionResponse(description=response_text.strip())
    except AIServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/projects/{project_id}/meeting-to-tasks", response_model=List[TaskSuggestion])
async def meeting_notes_to_tasks(
    project_id: int,
    req_body: MeetingNotesRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Fetch the project by project_id
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 2. Check roles/permissions
    await require_project_role(
        db, project_id, current_user.id, ["owner", "manager", "developer", "viewer"]
    )

    # 3. Call AI Service
    system_prompt = (
        "You are a project management assistant. Extract all actionable "
        "tasks from the meeting notes provided. Return ONLY a valid JSON array, no markdown "
        "fences, no extra text. Each item must have exactly these fields:\n"
        "{\n"
        "  \"title\": string (short, starts with a verb),\n"
        "  \"description\": string (1-2 sentences),\n"
        "  \"priority\": one of LOW | MEDIUM | HIGH\n"
        "}"
    )

    try:
        response_text = await generate_content(system_prompt, req_body.meeting_notes)
    except AIServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # 4. Parse and validate JSON response
    try:
        cleaned_response = response_text.strip()
        if cleaned_response.startswith("```"):
            lines = cleaned_response.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            cleaned_response = "\n".join(lines).strip()

        suggestions = json.loads(cleaned_response)
        if not isinstance(suggestions, list):
            raise ValueError("AI response is not a JSON array")

        validated_suggestions = []
        for sug in suggestions:
            if not isinstance(sug, dict) or "title" not in sug or "description" not in sug:
                raise ValueError("AI suggestion format is incorrect")

            validated_suggestions.append(
                TaskSuggestion(
                    title=str(sug["title"])[:60],
                    description=str(sug["description"])[:150],
                    priority=str(sug.get("priority", "MEDIUM")).upper()
                )
            )

        return validated_suggestions

    except Exception as e:
        logger.error(f"Failed to parse or validate AI suggestions. Raw response: {response_text}. Error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="AI returned invalid format"
        )
