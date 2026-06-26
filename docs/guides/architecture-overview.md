# Architecture Overview — Nexus PM

This guide provides a beginner-friendly overview of how the Nexus PM frontend, backend, and database interact when processing user requests.

---

## Related Detailed Architecture
If you need deep technical diagrams or schemas, refer directly to:
* **[Software Architecture Document (PDF)](../architecture/Nexus_PM_Software_Architecture_Document_v1.0.pdf)**
* **[System Architecture Diagram](../system_architecture.md)**
* **[Database ERD (Entity Relationship Mapping)](../database_erd.md)**
* **[Authentication Sequence Flows](../authentication_flow.md)**
* **[API Router Structure](../api_architecture.md)**
* **[Object Storage upload models](../storage_architecture.md)**

---

## 1. System Components Explained Simply

### React Frontend (The Visual UI)
The frontend serves the pages you see in your browser. It runs completely inside the client's web browser, managing:
* **Routing:** Showing login screens, Kanban boards, or file managers without reloading the page.
* **State Management:** Tracking which user is logged in, keeping active access tokens in memory, and updating task board stages dynamically during drag-and-drop operations.

### FastAPI Backend (The API Gateway)
The backend is the coordinator. When the frontend needs database records or files, it requests them from FastAPI. FastAPI is responsible for:
* **Gatekeeping:** Verifying user identities (evaluating JWT headers) and checking member roles before granting access.
* **Business Logic:** Organizing data, generating OTP verification codes, and validating file sizes/extensions.

### PostgreSQL Database (Supabase)
Stores long-term records. Anytime a user makes a board, creates a task card, or types a comment, it is saved in PostgreSQL database tables.

### Redis Cache (Upstash)
Acts as a high-speed, temporary key-value lookup. It is used to temporarily store sign-up profile details and OTP codes during the 15-minute registration verification window.

### Cloudflare R2 (Object Storage)
A remote cloud storage bucket used to store large binary attachments (such as PDF files, ZIP files, or user avatar images) with zero outbound download fees.

### Google Gemini API
An artificial intelligence service that takes your project description text and suggests tasks to populate your boards.

---

## 2. Walkthrough: The Lifecycle of a Request

To understand how these components communicate, let's trace a typical integration workflow—**Uploading a task attachment file**:

```
[Browser UI] React SPA (User selects a PNG to upload)
     │
     ▼ 1. HTTP POST Request with File payload
[API Server] FastAPI storage.py (Receives file bytes)
     │
     ├─► 2. auth.py Middleware (Verifies JWT access token header)
     │
     ├─► 3. storage_service.py (Validates size is < 10MB and type is whitelisted)
     │
     ├─► 4. boto3 S3 Client (Pushes file bytes to Cloudflare R2 Bucket)
     │
     ├─► 5. Async Database Query (Inserts file details into task_attachments table)
     │
     ▼ 6. Returns JSON confirmation with URL
[Browser UI] React SPA (Displays file name and download link on task card)
```
1. **Request Initiation:** The user selects a `PNG` image on a Kanban task card and clicks upload.
2. **Access Check:** The frontend sends the file payload to `/api/storage/upload` containing the Authorization token. FastAPI validates the token to authenticate the user.
3. **Validation & Filter:** The backend storage service verifies that the file size is under 10MB and its MIME-type is in the allowed whitelist.
4. **Cloud Transfer:** The backend proxies the file bytes to Cloudflare R2 via standard S3 API connection pools.
5. **Metadata Save:** Once R2 confirms receipt, the backend inserts a row into the PostgreSQL database (`task_attachments`) storing the file name, key, size, and public download URL.
6. **UI Render:** The backend returns the public URL in a JSON response, and the React frontend updates the UI to show the image attachment.
