# Authentication Flow — Nexus PM

This document details the security and authentication patterns implemented in Nexus PM, including the OTP sign-up, local login, session refresh, and Google OAuth flows.

---

## 1. Authentication Lifecycle Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as User Client
    participant FE as React Frontend
    participant BE as FastAPI Backend
    participant RD as Upstash Redis
    participant DB as PostgreSQL
    participant RE as Resend SMTP
    participant GO as Google OAuth API

    %% Signup & Verification Flow
    Note over User, RE: Registration & OTP Verification Flow
    User->>FE: Fills signup form
    FE->>BE: POST /api/auth/signup (email, password, full_name)
    BE->>BE: Hash password
    BE->>RD: Store credentials (pending_user:email, OTP code)
    BE->>RE: Send OTP code email
    BE-->>FE: Returns Signup Success (Requires OTP Verification)
    FE-->>User: Displays OTP entry modal
    User->>FE: Enters 6-digit OTP
    FE->>BE: POST /api/auth/verify-otp (email, otp)
    BE->>RD: Validate OTP & Fetch pending credentials
    BE->>DB: Write new User record
    BE->>DB: Create Refresh Token
    BE->>BE: Generate JWT Access & Refresh Tokens
    Note over BE, FE: Sets HttpOnly, Secure, SameSite Refresh Token Cookie
    BE-->>FE: Returns Access Token (JSON) & User details
    FE->>FE: Saves Access Token in memory state

    %% Local Login Flow
    Note over User, DB: Local Session Login Flow
    User->>FE: Fills login form
    FE->>BE: POST /api/auth/login (email, password)
    BE->>DB: Verify email & hashed password
    BE->>DB: Write Refresh Token
    BE->>BE: Generate JWT Access & Refresh Tokens
    Note over BE, FE: Sets HttpOnly Refresh Token Cookie
    BE-->>FE: Returns Access Token & User details
    FE->>FE: Saves Access Token in memory state

    %% Token Refresh Flow
    Note over FE, DB: Token Refresh Flow
    FE->>BE: POST /api/auth/refresh (Cookie: refresh_token automatically sent)
    BE->>DB: Validate Refresh Token & rotation state
    BE->>BE: Generate new Access Token & Rotate Refresh Token Cookie
    BE-->>FE: Returns new Access Token (JSON)

    %% Google OAuth Flow
    Note over User, GO: Google OAuth Flow
    User->>FE: Clicks "Continue with Google"
    FE->>GO: Requests User Identity Consent
    GO-->>FE: Returns Google ID Token
    FE->>BE: POST /api/auth/google (id_token)
    BE->>GO: Verifies Google Signature and extracts claims (email, name)
    BE->>DB: Fetch/create User record
    BE->>DB: Write Refresh Token
    BE->>BE: Generate JWT Access & Refresh Tokens (Sets cookie)
    BE-->>FE: Returns Access Token & User details
```

---

## 2. Design Security Mechanisms

### Token Storage Strategy
* **Access Token:** A short-lived (configured default: 60 minutes) JWT bearer token returned in the JSON response body. The React application keeps it in JavaScript runtime memory (`useState` / Context). It is never saved to `localStorage` or `sessionStorage` to block Cross-Site Scripting (XSS) vectors.
* **Refresh Token:** A long-lived JWT token returned via an HTTP-Only, Secure, SameSite=Lax cookie named `refresh_token`. The browser manages cookie storage and automatically appends it to requests sent to `/api/auth/refresh` or `/api/auth/logout`.

### Session Refresh Rotation
1. When the client intercepts an API call failure due to expired access tokens, it sends a POST request to `/api/auth/refresh`.
2. The backend extracts the `refresh_token` from the HttpOnly cookie, verifies the signature, and matches the token ID against stored refresh sessions in PostgreSQL.
3. If valid, the backend generates a new Access Token, issues a brand new rotated Refresh Token, commits the new token ID to the database, and responds. The old token is invalidated.

### Double-Lock Registration (Redis OTP)
To prevent database bloat from unverified email submissions, the backend implements a registration queue:
* User profile details (and hashed passwords) are stored in Upstash Redis with a 15-minute TTL.
* When the client provides the correct OTP, the details are fetched from Redis and committed to PostgreSQL. Unverified registrations expire automatically without impacting database storage.
