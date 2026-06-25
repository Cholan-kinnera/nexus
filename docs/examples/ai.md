# AI Integration Developer Examples — Nexus PM

This guide provides developer examples for using the Generative AI endpoints in Nexus PM.

---

## Related Documentation
* [AI Integration Architecture](../../docs/ai_architecture.md)

---

## Workflow

```
Client (Auth Token + Request API)
   ↓
FastAPI Backend (Check Role & Fetch Database Context)
   ↓
Google GenAI SDK (Call gemini-2.5-flash with Prompt context)
   ↓
FastAPI Router (Clean & Validate Model JSON Output)
   ↓
Response Client (Structured JSON suggestions)
```

---

## Available Endpoints

### Current Implementation (Status: Implemented)

| Method | Path | Purpose | Authentication Required | Role Required |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/projects/{project_id}/generate-tasks` | Generate task suggestions based on project description. | Yes | owner, manager, developer, viewer |
| `POST` | `/api/ai/projects/{project_id}/summarize` | Generate a 3-5 sentence executive project summary. | Yes | owner, manager, developer, viewer |
| `POST` | `/api/ai/tasks/{task_id}/generate-description` | Generate task description options from a task title. | Yes | owner, manager, developer, viewer |
| `POST` | `/api/ai/projects/{project_id}/meeting-to-tasks` | Extract actionable tasks from transcribed meeting notes. | Yes | owner, manager, developer, viewer |

---

## Example Requests

### 1. Generate Project Tasks
```bash
curl -X POST "http://127.0.0.1:8000/api/ai/projects/1/generate-tasks" \
     -H "Authorization: Bearer your_access_token_here"
```

### 2. Extract Tasks from Meeting Notes
```bash
curl -X POST "http://127.0.0.1:8000/api/ai/projects/1/meeting-to-tasks" \
     -H "Authorization: Bearer your_access_token_here" \
     -H "Content-Type: application/json" \
     -d '{
       "meeting_notes": "We need to set up the Postgres database indices by Friday. Also, Sarah needs to draft the authentication flow diagrams so we can review them in the next meeting."
     }'
```

---

## Example Responses

### Generate Tasks Success Response (HTTP 200)
```json
[
  {
    "title": "Set up database indices",
    "description": "Establish PostgreSQL indices for comments, task attachments, and project memberships.",
    "priority": "HIGH"
  },
  {
    "title": "Draft authentication diagrams",
    "description": "Create sequence diagrams illustrating OAuth consent, OTP sign-ups, and session tokens.",
    "priority": "MEDIUM"
  }
]
```

### Project Summarize Success Response (HTTP 200)
```json
{
  "summary": "Project Launch Phase 2 is an engineering project focusing on scale database layouts and integrations. It has a high priority and a target deadline set for July 1st, 2026."
}
```

---

## Validation & Prompt Structure

### Model Configuration
The backend formats prompt strings and sends them to Gemini via the unified `google-genai` SDK. For task extraction endpoints, a strict JSON schema configuration is passed to ensure compliance:

```python
system_prompt = (
    "You are a project management assistant. Extract all actionable "
    "tasks from the meeting notes provided. Return ONLY a valid JSON array..."
)
```

### Constraints & Formats
* **Task Suggestion Output Constraints:** Title is truncated to a maximum of 60 characters; description is truncated to a maximum of 150 characters.

---

## Future AI Roadmap (Status: Planned)

The following analytical capabilities are scheduled for future development phases:

### A. AI Project Health Analyzer (Planned)
* **Goal:** Auto-evaluates active Kanban queues and velocities to flag items at risk of missing deadlines.

### B. AI Automated Task Assignee (Planned)
* **Goal:** Intelligently allocates newly generated cards to developers based on their historic capacity.

### C. AI Notification Digest (Planned)
* **Goal:** Summarizes daily project dashboard modifications and comments history into a single status report email.
