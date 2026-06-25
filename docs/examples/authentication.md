# Authentication Developer Examples — Nexus PM

This guide provides practical developer integration examples for the Nexus PM Authentication API.

---

## Related Documentation
* [API Architecture](../../docs/api_architecture.md)
* [Authentication Flow](../../docs/authentication_flow.md)

---

## Workflow

```
Client (Enter Credentials)
   ↓
FastAPI Backend (Password Hashing / Verify OTP)
   ↓
Redis (Temp Registration Queue / Verification Token)
   ↓
PostgreSQL (Database Commit)
   ↓
Response Client (JWT tokens issued)
```

---

## Available Endpoints

| Method | Path | Purpose | Authentication Required | Role Required |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register a new user account (enters OTP pending queue). | No | None |
| `POST` | `/api/auth/verify-otp` | Validate the 6-digit email OTP and write the user to DB. | No | None |
| `POST` | `/api/auth/login` | Log in local credentials and receive HTTP-Only cookie. | No | None |
| `POST` | `/api/auth/refresh` | Rotate JWT Access Token and Refresh cookie. | No | None |
| `POST` | `/api/auth/logout` | Revoke active session refresh keys and clear cookie. | No | None |
| `POST` | `/api/auth/forgot-password` | Generate reset token and email it to the user. | No | None |
| `POST` | `/api/auth/verify-reset-otp` | Verify the password reset code. | No | None |
| `POST` | `/api/auth/reset-password` | Set new password with verified reset OTP. | No | None |
| `POST` | `/api/auth/google` | Map Google Sign-in ID Token to system session. | No | None |

---

## Example Requests

### 1. User Signup
```bash
curl -X POST "http://127.0.0.1:8000/api/auth/signup" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "developer@nexuspm.online",
       "full_name": "Developer Alpha",
       "password": "SecurePassword123"
     }'
```

### 2. Verify Sign-up OTP
```bash
curl -X POST "http://127.0.0.1:8000/api/auth/verify-otp" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "developer@nexuspm.online",
       "otp": "123456"
     }'
```

### 3. User Login
```bash
curl -X POST "http://127.0.0.1:8000/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "developer@nexuspm.online",
       "password": "SecurePassword123"
     }'
```

### 4. Refresh Token Session
```bash
curl -X POST "http://127.0.0.1:8000/api/auth/refresh" \
     -b "refresh_token=your_http_only_cookie_value"
```

---

## Example Responses

### Signup Success Response (HTTP 200)
```json
{
  "message": "Verification code sent to email. Please verify your OTP to complete registration.",
  "email": "developer@nexuspm.online",
  "full_name": "Developer Alpha"
}
```

### Verify OTP / Login Success Response (HTTP 200)
```json
{
  "message": "User verified successfully.",
  "email": "developer@nexuspm.online",
  "full_name": "Developer Alpha",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJk...",
  "token_type": "bearer"
}
```
* **Cookie Header Set:** `Set-Cookie: refresh_token=eyJhbGci...; Path=/api/auth; HttpOnly; SameSite=Lax`

### Invalid Login Error Response (HTTP 401)
```json
{
  "detail": "Invalid credentials"
}
```

---

## Validation Rules

### User Signup Schema (`UserSignup`)
* **`email`:** Required. Valid email string format (EmailStr).
* **`full_name`:** Required. String.
* **`password`:** Required. Minimum 8 characters recommended.

### Verify OTP Schema (`VerifyOTPRequest`)
* **`email`:** Required. Valid email string format.
* **`otp`:** Required. String of length 6.

---

## Authentication Requirements
* Access tokens are returned in the `access_token` JSON body field and must be supplied in headers as `Authorization: Bearer <token>`.
* Refresh tokens are set as HttpOnly cookies matching path `/api/auth` to prevent XSS leakage.

---

## Common Errors

* **`400 Bad Request`:** Raised if the registration email is already verified and exists in PostgreSQL database.
* **`401 Unauthorized`:** Triggered when credentials do not match or the refresh cookie is missing/expired.
* **`422 Unprocessable Entity`:** Pydantic validation errors (missing parameters or badly formatted email).

---

## Best Practices
* **Refresh Interceptors:** In clients, use Axios request interceptors to automatically catch 401 response statuses, hit `/api/auth/refresh`, and retry the original mutation.
* **Token Storage:** Keep the access token in memory state. Avoid local storage to mitigate script injection hazards.

---

## Developer Notes
* Registration details are saved to Upstash Redis with a TTL of 15 minutes. PostgreSQL is only written to once `/verify-otp` returns successfully.
