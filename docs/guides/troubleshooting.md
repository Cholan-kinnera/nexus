# Troubleshooting Guide — Nexus PM

This reference guide provides resolutions for common errors encountered during local development and deployment.

---

## 1. Database Connection & Pooling Failures

### Symptom: `Connection refused` or `asyncpg.exceptions` on Startup
* **Possible Cause:** 
  1. The backend is attempting to query PostgreSQL before the service container has fully initialized.
  2. The database password contains a special character (like `#` or `@`) that is not URL-encoded.
  3. The local `.env` connection string uses the incorrect asyncpg driver prefix.
* **Resolution:**
  * Ensure the URI begins with `postgresql+asyncpg://` (the SQLAlchemy async driver).
  * URL-encode your database password (e.g. replace `password#01` with `password%2301`).
  * If executing migrations, verify you are targeting the direct PostgreSQL port (`5432`) rather than the Supabase PgBouncer pooler port (`6543`), which does not support DDL changes.

---

## 2. Authentication & JWT Cookie Issues

### Symptom: Both Login and Signup fail with CORS Policy errors
* **Possible Cause:** 
  1. `TrustedHostMiddleware` is rejecting the Host header request because the Render backend domain or wildcards are missing from `ALLOWED_HOSTS`.
  2. `ALLOWED_ORIGINS` contains quote marks (e.g. `ALLOWED_ORIGINS="https://www.nexuspm.online"`) which prevents exact matches against the browser's `Origin` header.
* **Resolution:**
  * Clean up any quotes in your environment variables dashboard.
  * Verify that `ALLOWED_HOSTS` includes the API host (e.g., `nexus-pm-backend-21kc.onrender.com` or `*.onrender.com`).

### Symptom: `/refresh` requests return `401 Unauthorized` (Missing refresh token)
* **Possible Cause:** The browser is blocking the `refresh_token` cookie from being saved or sent because of secure cookie configurations.
* **Resolution:**
  * **For Local Dev:** Ensure `COOKIE_SECURE` is set to `false` and `COOKIE_SAMESITE` is set to `lax`. Browsers reject secure cookies on unencrypted localhost requests.
  * **For Production:** Ensure `COOKIE_SECURE` is set to `true` and your API endpoint matches HTTPS.

---

## 3. Storage Upload Failures (Cloudflare R2)

### Symptom: Attachments fail with `boto3` client exceptions
* **Possible Cause:** 
  1. The R2 credentials (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) are incorrect or have expired.
  2. The custom public bucket URL in `R2_PUBLIC_URL` is malformed.
* **Resolution:**
  * Log into your Cloudflare dashboard, verify your R2 keys are active, and ensure your bucket permits public read access.
  * If running locally, you can omit the keys to fallback to the local folder storage simulator (`local_storage_uploads/`).

---

## 4. Google OAuth Redirect Failures

### Symptom: Google Sign-in returns `idpiframe_initialization_failed` or validation errors
* **Possible Cause:**
  1. The frontend's client ID `VITE_GOOGLE_CLIENT_ID` does not match the backend's `GOOGLE_CLIENT_ID` setting.
  2. The domain (e.g. `http://localhost:5173` or `https://www.nexuspm.online`) is not added to the **Authorized JavaScript Origins** list in Google Cloud Console.
* **Resolution:**
  * Add your frontend URLs to the Google Console Credentials configuration page under authorized origins.
  * Wait 5–10 minutes for Google to update cache routing.

---

## 5. Port Conflicts

### Symptom: `Address already in use` or Port `8000` / `5173` is Busy
* **Possible Cause:** A background task from a previous execution is still running and binding to the port.
* **Resolution:**
  * **On Windows (PowerShell):**
    ```powershell
    # Find process ID binding port 8000
    Get-NetTCPConnection -LocalPort 8000 | Format-Table -Property OwningProcess
    # Kill the process
    Stop-Process -Id <PID>
    ```
  * **On Linux / macOS:**
    ```bash
    lsof -i :8000
    kill -9 <PID>
    ```
