# Projects Developer Examples — Nexus PM

This guide provides practical developer integration examples for the Nexus PM Projects and Collaborators API.

---

## Related Documentation
* [API Architecture](../../docs/api_architecture.md)

---

## Workflow

```
Client (Authorized Header)
   ↓
FastAPI Backend (Check Role / Validate Membership)
   ↓
PostgreSQL DB (Select / Insert / Update Query)
   ↓
Response Client (JSON Project Metadata)
```

---

## Available Endpoints

| Method | Path | Purpose | Authentication Required | Role Required |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/projects/` | Create a new project workspace. | Yes | None |
| `GET` | `/api/projects/` | List all projects current user is a member of (Paginated). | Yes | None |
| `GET` | `/api/projects/{project_id}` | Retrieve detailed specs of a single project. | Yes | owner, manager, developer, viewer |
| `PUT` | `/api/projects/{project_id}` | Update project description or title. | Yes | owner, manager |
| `DELETE` | `/api/projects/{project_id}` | Delete a project and all associated tasks. | Yes | owner |
| `POST` | `/api/projects/{project_id}/members` | Add/invite a new member to a project. | Yes | owner, manager |
| `GET` | `/api/projects/{project_id}/members` | List members of a project. | Yes | owner, manager, developer, viewer |
| `PATCH` | `/api/projects/{project_id}/members/{user_id}` | Update member role in project. | Yes | owner, manager |
| `DELETE` | `/api/projects/{project_id}/members/{user_id}` | Remove a member from the project. | Yes | owner, manager |

---

## Example Requests

### 1. Create a Project
```bash
curl -X POST "http://127.0.0.1:8000/api/projects/" \
     -H "Authorization: Bearer your_access_token_here" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Launch Phase 2",
       "description": "{\"desc\":\"Platform scale architecture documentation\",\"category\":\"Engineering\",\"priority\":\"HIGH\",\"deadline\":\"2026-07-01\"}"
     }'
```

### 2. List Projects (Paginated)
```bash
curl -X GET "http://127.0.0.1:8000/api/projects/?page=1&limit=10" \
     -H "Authorization: Bearer your_access_token_here"
```

### 3. Invite Member to Project
```bash
curl -X POST "http://127.0.0.1:8000/api/projects/1/members" \
     -H "Authorization: Bearer your_access_token_here" \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": 4,
       "role": "developer"
     }'
```

---

## Example Responses

### Create Project Success Response (HTTP 200)
```json
{
  "id": 1,
  "title": "Launch Phase 2",
  "description": "{\"desc\":\"Platform scale architecture documentation\",\"category\":\"Engineering\",\"priority\":\"HIGH\",\"deadline\":\"2026-07-01\"}",
  "owner_id": 2
}
```

### List Projects Paginated Response (HTTP 200)
```json
{
  "items": [
    {
      "id": 1,
      "title": "Launch Phase 2",
      "description": "{\"desc\":\"Platform scale architecture documentation\",\"category\":\"Engineering\",\"priority\":\"HIGH\",\"deadline\":\"2026-07-01\"}",
      "owner_id": 2
    }
  ],
  "total": 1,
  "page": 1,
  "pages": 1,
  "limit": 10
}
```

---

## Validation Rules

### Project Creation Schema (`ProjectCreate`)
* **`title`:** Required. String of length 3 to 100 characters.
* **`description`:** Optional. String up to 500 characters (can store serialized JSON structures).

### Member Invitation Schema (`ProjectMemberCreate`)
* **`user_id`:** Required. Integer.
* **`role`:** Required. String. Allowed values: `owner`, `manager`, `developer`, `viewer`.

---

## Authentication Requirements
* All endpoints require a valid JWT Access Token passed in the `Authorization: Bearer` header.
* **RBAC Role Matrix:**
  * **`owner`:** Full permissions (delete project, edit info, invite members, modify roles).
  * **`manager`:** Can edit info, invite members, modify developer/viewer roles, add tasks.
  * **`developer`:** Can read project, view members, and create/update/edit task boards.
  * **`viewer`:** Can read-only project and tasks.

---

## Common Errors
* **`403 Forbidden`:** Occurs if a user tries to modify or delete a project without holding the required project role (e.g. Developer trying to delete a project).
* **`404 Not Found`:** Returned if the requested project ID does not exist in the database or the user is not a member of it.

---

## Best Practices
* **JSON Serialization:** Keep project descriptions JSON-serialized under the format `{"desc": "...", "category": "...", "priority": "...", "deadline": "..."}` to match the schema expected by the frontend landing boards.
