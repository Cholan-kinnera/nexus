import json
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.database import get_db
from dependencies.auth import get_current_user
from models.user import User
from models.project import Project
from services.ai_service import generate_content, AIServiceError
from services.project_member_service import require_project_role

logger = logging.getLogger(__name__)

router = APIRouter()


class TaskSuggestion(BaseModel):
    title: str = Field(..., max_length=60)
    description: str = Field(..., max_length=150)


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
                    description=str(sug["description"])[:150]
                )
            )

        return validated_suggestions

    except Exception as e:
        logger.error(f"Failed to parse or validate AI suggestions. Raw response: {response_text}. Error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="AI model generated a malformed response. Please try again."
        )
