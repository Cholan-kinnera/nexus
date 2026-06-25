# Database Entity Relationship Diagram — Nexus PM

This document presents the schema architecture of the PostgreSQL database, visualised using a Mermaid ER Diagram directly derived from the SQLAlchemy models.

---

## 1. Entity Relationship Diagram

```mermaid
erDiagram
    users {
        int id PK
        string full_name
        string email UK
        string password
        string role
        string avatar_url
        string google_id UK
        string auth_provider
        datetime created_at
        datetime updated_at
    }
    projects {
        int id PK
        string title
        string description
        int owner_id FK
    }
    project_members {
        int id PK
        int project_id FK
        int user_id FK
        string role
        int invited_by FK
        datetime joined_at
    }
    tasks {
        int id PK
        string title
        string description
        string status
        string priority
        datetime due_date
        int project_id FK
        int assigned_to FK
        datetime created_at
        datetime updated_at
    }
    task_attachments {
        int id PK
        int task_id FK
        int user_id FK
        string file_name
        string file_key UK
        int file_size
        string mime_type
        string file_url
        datetime created_at
    }
    comments {
        int id PK
        string content
        int task_id FK
        int user_id FK
        datetime created_at
    }
    notifications {
        int id PK
        int user_id FK
        string title
        string message
        boolean is_read
        json metadata
        datetime created_at
    }
    activity_logs {
        int id PK
        int user_id FK
        string action
        string entity_type
        int entity_id
        json metadata
        datetime created_at
    }
    refresh_tokens {
        int id PK
        int user_id FK
        string token_hash UK
        datetime expires_at
        datetime created_at
    }
    password_reset_otps {
        int id PK
        string email
        string otp_hash
        datetime expires_at
        boolean used
        int attempts
        datetime created_at
    }
    forgot_password_rate_limits {
        int id PK
        string ip_address
        string email
        datetime created_at
    }

    users ||--o{ projects : "owns"
    users ||--o{ project_members : "participates"
    projects ||--o{ project_members : "contains"
    projects ||--o{ tasks : "houses"
    users ||--o{ tasks : "assigned"
    tasks ||--o{ task_attachments : "has"
    users ||--o{ task_attachments : "uploads"
    tasks ||--o{ comments : "has"
    users ||--o{ comments : "writes"
    users ||--o{ notifications : "receives"
    users ||--o{ activity_logs : "triggers"
    users ||--o{ refresh_tokens : "has"
```

---

## 2. Model Breakdown & Relationships

### Core Workspaces
* **`users`:** The central tenant directory. Accounts authenticate via local email/password credentials or Google SSO integration mappings.
* **`projects`:** Core working boards. Each project links to an owner (`owner_id`) representing the user who generated the board.
* **`project_members`:** A many-to-many relationship bridge connecting `users` to `projects` with specific roles (Owner, Manager, Developer, Viewer).

### Task Boards
* **`tasks`:** Individual action cards associated with a `project`. Tasks track a specific state (TODO, IN_PROGRESS, DONE) and priority weighting. They can be assigned to a team member (`assigned_to`).
* **`task_attachments`:** Tracks binary objects uploaded to the storage bucket. Attachments are isolated by task and uploader context.
* **`comments`:** Tracks text feedback messages posted under task cards.

### Monitoring & Security Logs
* **`notifications`:** Multi-tenant unread alert lists pushed to the client UI.
* **`activity_logs`:** Auditable system operation logs tracking changes across resources.
* **`refresh_tokens`:** Stores cryptographically hashed access tokens to coordinate session rotation.
* **`password_reset_otps` / `forgot_password_rate_limits`:** Unassociated validation tables used to protect authentication routes against password reset brute-forcing.
