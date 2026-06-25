# Environment Variables Reference — Nexus PM

This document lists all environment variables used by the backend and frontend configurations.

---

## 1. Backend Configurations (`.env`)

### Database Settings
* **`DATABASE_URL`**
  * **Purpose:** Database connection string.
  * **Required:** Yes.
  * **Development Value:** `postgresql+asyncpg://postgres:password@localhost:5432/nexus_pm`
  * **Production Value:** `postgresql+asyncpg://postgres:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
  * **Security Considerations:** PostgreSQL connection passwords must be URL-encoded if they contain special characters (e.g. replacing `#` with `%23`).

### Caching Settings
* **`REDIS_URL`**
  * **Purpose:** Redis connection URL.
  * **Required:** Yes (falls back to local dev warnings if unreachable).
  * **Development Value:** `redis://localhost:6379/0`
  * **Production Value:** `redis://:[password]@upstash.com:6379`
  * **Security Considerations:** Secure connection details with SSL in production (`rediss://...`).

### API Server Host Configuration
* **`BACKEND_HOST`**
  * **Purpose:** Network host interface for Uvicorn bindings.
  * **Required:** No (defaults to `127.0.0.1`).
  * **Development Value:** `127.0.0.1`
  * **Production Value:** `0.0.0.0`
* **`BACKEND_PORT`**
  * **Purpose:** Port binding.
  * **Required:** No (defaults to `8000`).
  * **Development Value:** `8000`
  * **Production Value:** `8000` (mapped dynamically by Render).

### Authentication & JWT Security
* **`SECRET_KEY`**
  * **Purpose:** Secret key used to sign access JWTs.
  * **Required:** Yes.
  * **Development Value:** `supersecretkey123`
  * **Production Value:** High-entropy cryptographically random string (e.g. generated via `openssl rand -hex 32`).
  * **Security Considerations:** Must never be committed to repository files. Keep it out of Git history.
* **`REFRESH_SECRET_KEY`**
  * **Purpose:** Secret key used to sign refresh JWTs.
  * **Required:** Yes.
  * **Development Value:** `supersecretrefreshkey123_refresh`
  * **Production Value:** High-entropy random string.
* **`ALGORITHM`**
  * **Purpose:** HMAC hashing method.
  * **Required:** No (defaults to `HS256`).
  * **Value:** `HS256`
* **`ACCESS_TOKEN_EXPIRE_MINUTES`**
  * **Purpose:** Lifespan of short-lived access JWT tokens.
  * **Required:** No (defaults to `15`).
  * **Development Value:** `60`
  * **Production Value:** `15` to `30` minutes.

### CORS & Host Access Security
* **`ALLOWED_ORIGINS`**
  * **Purpose:** Comma-separated list of origins allowed by `CORSMiddleware`.
  * **Required:** Yes.
  * **Development Value:** `http://localhost:5173,http://127.0.0.1:5173`
  * **Production Value:** `https://www.nexuspm.online,https://nexuspm.online`
  * **Security Considerations:** Enforce strict https origins in production. Do not use wildcards (`*`) when `allow_credentials=True`.
* **`ALLOWED_HOSTS`**
  * **Purpose:** Comma-separated list of hosts allowed by `TrustedHostMiddleware`.
  * **Required:** Yes.
  * **Development Value:** `localhost,127.0.0.1`
  * **Production Value:** `nexus-pm-backend-21kc.onrender.com,*.onrender.com`
  * **Security Considerations:** Rejects request domains not matching this set, mitigating Host Header Injection exploits.

### Object Storage (Cloudflare R2)
* **`R2_ACCOUNT_ID`**
  * **Purpose:** Cloudflare Account ID.
  * **Required:** Yes (triggers local mock storage mode if missing).
* **`R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`**
  * **Purpose:** S3 API access credentials.
  * **Required:** Yes.
* **`R2_BUCKET_NAME`**
  * **Purpose:** Bucket storage namespace.
  * **Required:** Yes.
* **`R2_PUBLIC_URL`**
  * **Purpose:** Custom public domain or bucket subdomain URL to generate download links.
  * **Required:** Yes.

### Transactional Email (Resend)
* **`RESEND_API_KEY`**
  * **Purpose:** Resend service API key.
  * **Required:** Yes (falls back to console stdout logging if missing).
  * **Production Value:** `re_your_api_key_here`
* **`SES_SENDER_EMAIL`**
  * **Purpose:** Verified sender email address.
  * **Required:** Yes.
  * **Production Value:** `noreply@nexuspm.online`

### Generative AI (Gemini)
* **`GEMINI_API_KEY`**
  * **Purpose:** Google Gemini developer key.
  * **Required:** Yes (AI features raise errors if missing).

---

## 2. Frontend Configurations (`frontend/.env`)

* **`VITE_API_URL`**
  * **Purpose:** Base URL for API requests.
  * **Required:** Yes.
  * **Development Value:** `http://localhost:8000` (Axios client normalises to `http://localhost:8000/api`)
  * **Production Value:** `https://nexus-pm-backend-21kc.onrender.com`
* **`VITE_GOOGLE_CLIENT_ID`**
  * **Purpose:** Client ID for Google Identity Services mapping login buttons.
  * **Required:** Yes (required for Google Sign-In).
