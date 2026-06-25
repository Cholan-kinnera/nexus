# Storage Developer Examples — Nexus PM

This guide provides practical developer integration examples for the Nexus PM Cloud Storage API.

---

## Related Documentation
* [API Architecture](../../docs/api_architecture.md)
* [Storage Architecture](../../docs/storage_architecture.md)

---

## Workflow

```
Client (Auth Header + Multipart payload)
   ↓
FastAPI Backend (Validate size/type and proxy byte-stream)
   ↓
Cloudflare R2 Bucket (Object upload)
   ↓
PostgreSQL DB (Insert TaskAttachment metadata record)
   ↓
Response Client (Attachment JSON + download URL)
```

---

## Available Endpoints

| Method | Path | Purpose | Authentication Required | Role Required |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/storage/upload` | Upload a file to Cloudflare R2 storage bucket. | Yes | None |
| `GET` | `/api/storage` | List all files uploaded by current user. | Yes | None |
| `DELETE` | `/api/storage/delete/{file_key}` | Delete file from storage and clear DB metadata. | Yes | None |

---

## Example Requests

### 1. Upload File
```bash
curl -X POST "http://127.0.0.1:8000/api/storage/upload" \
     -H "Authorization: Bearer your_access_token_here" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@/path/to/diagram.png"
```

### 2. List Uploaded Files
```bash
curl -X GET "http://127.0.0.1:8000/api/storage" \
     -H "Authorization: Bearer your_access_token_here"
```

### 3. Delete File
```bash
curl -X DELETE "http://127.0.0.1:8000/api/storage/delete/5a3b98c7.png" \
     -H "Authorization: Bearer your_access_token_here"
```

---

## Example Responses

### Upload File Success Response (HTTP 201)
```json
{
  "file_key": "5a3b98c7f212bcde38a1.png",
  "url": "https://pub-ef8127e05a164602b4fca7757c5ea889.r2.dev/5a3b98c7f212bcde38a1.png",
  "filename": "diagram.png",
  "content_type": "image/png"
}
```

### List Uploaded Files Response (HTTP 200)
```json
[
  {
    "file_key": "5a3b98c7f212bcde38a1.png",
    "filename": "diagram.png",
    "size": 42023,
    "content_type": "image/png",
    "url": "https://pub-ef8127e05a164602b4fca7757c5ea889.r2.dev/5a3b98c7f212bcde38a1.png",
    "updated_at": "2026-06-25T16:18:22.043000"
  }
]
```

---

## Validation Rules

### Size Limits
* **Maximum Size:** Enforces a strict cap of **10 MB** (10,485,760 bytes). Files larger than this will be rejected by the backend validator.

### Supported File Whitelist
* **Images:** `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`
* **Documents:** `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx`, `.txt`, `.csv`
* **Archives:** `.zip`, `.tar`, `.gz`, `.rar`
* **Source Code:** `.json`, `.xml`, `.html`, `.css`, `.js`, `.ts`, `.py`

---

## Authentication Requirements
* Valid JWT Access Token in the Authorization header.
* File deletion endpoints verify ownership. A user cannot delete file keys uploaded by other user IDs.

---

## Common Errors
* **`400 Bad Request`:** Raised if the file size exceeds the 10MB limit or if the file extension/MIME-type is not in the whitelist.
* **`401 Unauthorized`:** Triggered when the access token header is invalid or absent.
* **`404 Not Found`:** Returned if deleting a file key that is not in the system storage.

---

## Developer Notes
* If Cloudflare R2 environment variables are omitted during startup, the backend automatically redirects all storage mutations to write locally in `local_storage_uploads/` folder and resolves links to a mock local URL (`http://127.0.0.1:8000/static/uploads/{file_key}`).
