# Tasks Developer Examples — Nexus PM

This guide provides practical developer integration examples for the Nexus PM Task Management, Kanban board updates, comments, and task attachments API.

---

## Related Documentation
* [API Architecture](../../docs/api_architecture.md)

---

## Workflow

```
Client (Authorized Header)
   ↓
FastAPI Backend (Verify project membership & roles)
   ↓
PostgreSQL DB (Insert/Update task or attachment record)
   ↓
Response Client (JSON Task payload)
```

---

## Available Endpoints

| Method | Path | Purpose | Authentication Required | Role Required |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/tasks/` | Create a new task in a project. | Yes | owner, manager, developer |
| `GET` | `/api/tasks/` | List all tasks for current user. | Yes | owner, manager, developer, viewer |
| `GET` | `/api/tasks/{task_id}` | Retrieve details of a task. | Yes | owner, manager, developer, viewer |
| `PUT` | `/api/tasks/{task_id}` | Update task details (Kanban status transition). | Yes | owner, manager, developer |
| `DELETE` | `/api/tasks/{task_id}` | Delete a task from a project board. | Yes | owner, manager, developer |
| `GET` | `/api/tasks/project/{project_id}` | List tasks under a specific project board. | Yes | owner, manager, developer, viewer |
| `POST` | `/api/tasks/{task_id}/comments` | Add a comment to a task. | Yes | owner, manager, developer, viewer |
| `GET` | `/api/tasks/{task_id}/comments` | Retrieve comments history for a task. | Yes | owner, manager, developer, viewer |
| `POST` | `/api/tasks/{task_id}/attachments` | Upload a binary file attachment. | Yes | owner, manager, developer |
| `GET` | `/api/tasks/{task_id}/attachments` | List attachment records linked to a task. | Yes | owner, manager, developer, viewer |
| `DELETE` | `/api/tasks/attachments/{attachment_id}` | Remove a task file attachment. | Yes | owner, manager, developer |

---

## Example Requests

### 1. Create a Task card
```bash
curl -X POST "http://127.0.0.1:8000/api/tasks/" \
     -H "Authorization: Bearer your_access_token_here" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Document API Endpoints",
       "description": "Create curl examples for developer onboarding",
       "priority": "HIGH",
       "project_id": 1
     }'
```

### 2. Update Kanban Board Stage (Status Update)
```bash
curl -X PUT "http://127.0.0.1:8000/api/tasks/12" \
     -H "Authorization: Bearer your_access_token_here" \
     -H "Content-Type: application/json" \
     -d '{
       "status": "IN_PROGRESS"
     }'
```

### 3. Add comment to Task
```bash
curl -X POST "http://127.0.0.1:8000/api/tasks/12/comments" \
     -H "Authorization: Bearer your_access_token_here" \
     -H "Content-Type: application/json" \
     -d '{
       "content": "Finished drafting authentications guides"
     }'
```

---

## Example Responses

### Create Task Success Response (HTTP 200)
```json
{
  "id": 12,
  "title": "Document API Endpoints",
  "description": "Create curl examples for developer onboarding",
  "status": "TODO",
  "priority": "HIGH",
  "due_date": null,
  "project_id": 1,
  "assigned_to": null,
  "attachments": []
}
```

### Add Comment Response (HTTP 201)
```json
{
  "id": 43,
  "content": "Finished drafting authentications guides",
  "task_id": 12,
  "user_id": 2,
  "created_at": "2026-06-25T16:15:33Z"
}
```

---

## Validation Rules

### Task Creation Schema (`TaskCreate`)
* **`title`:** Required. String of length 3 to 100 characters.
* **`description`:** Optional. String up to 500 characters.
* **`priority`:** Optional. String (defaults to `"MEDIUM"`). Allowed: `"LOW"`, `"MEDIUM"`, `"HIGH"`.
* **`project_id`:** Required. Integer.
* **`assigned_to`:** Optional. Integer (User ID).

### Comment Creation Schema (`CommentCreate`)
* **`content`:** Required. String of length 1 to 1000 characters.

---

## Authentication Requirements
* Header `Authorization: Bearer <JWT>` is required for all endpoints.
* To perform task updates (moving stages) or deletions, user must hold at least a **developer** or **manager** role in that project workspace. Viewers can post comments.

---

## Common Errors
* **`403 Forbidden`:** Occurs if a user tries to create or update tasks in a project they are not members of or hold a "viewer" role.
* **`404 Not Found`:** Returned if the specified `task_id` or `project_id` does not exist.
