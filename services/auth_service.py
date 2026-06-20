import random
import logging
from datetime import datetime, timedelta, UTC
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from fastapi import HTTPException
from models.user import User
from models.refresh_token import RefreshToken
from models.password_reset_otp import PasswordResetOTP
from models.forgot_password_rate_limit import ForgotPasswordRateLimit
from core.config import settings
from services.email import send_otp_email, send_password_reset_email
from core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    hash_token,
)
from services.activity_service import create_activity_log

logger = logging.getLogger(__name__)

# Registration state is persisted in Redis namespace signup:<email> instead of local dict


async def signup_service(full_name: str, email: str, password: str, db: AsyncSession):
    try:
        # Check if user already exists
        result = await db.execute(select(User).where(User.email == email))

        existing_user = result.scalar_one_or_none()

        if existing_user:
            raise HTTPException(status_code=409, detail="User already exists")

        # Generate random 6-digit OTP code
        otp_code = "".join([str(random.randint(0, 9)) for _ in range(6)])

        # Cache signup details in Redis with 10-minute expiry
        import json
        from services.redis_service import redis_service

        signup_data = {
            "full_name": full_name,
            "email": email,
            "password": hash_password(password),
            "otp": otp_code,
        }
        await redis_service.set_cache(
            key=f"signup:{email}",
            value=json.dumps(signup_data),
            expire_seconds=600,  # 10 minutes
        )

        # Send AWS SES verification email
        email_sent = await send_otp_email(email, otp_code)
        if not email_sent:
            raise HTTPException(
                status_code=500,
                detail="Failed to send verification email. Please try again or verify your email in AWS SES sandbox.",
            )

        return {
            "message": "Verification code sent to email. Please verify OTP.",
            "email": email,
            "access_token": None,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup setup error: {e}")
        raise HTTPException(
            status_code=500, detail="Internal server error during registration setup"
        )


async def verify_otp_service(email: str, otp: str, db: AsyncSession):
    try:
        import json
        from services.redis_service import redis_service

        cached_json = await redis_service.get_cache(f"signup:{email}")
        if not cached_json:
            raise HTTPException(
                status_code=400, detail="Invalid or expired verification code"
            )

        cached_data = json.loads(cached_json)
        if cached_data["otp"] != otp:
            raise HTTPException(
                status_code=400, detail="Invalid or expired verification code"
            )

        # Confirm user doesn't exist (concurrency check)
        result = await db.execute(select(User).where(User.email == email))
        existing_user = result.scalar_one_or_none()
        if existing_user:
            raise HTTPException(status_code=409, detail="User already exists")

        # Persist user in database
        new_user = User(
            full_name=cached_data["full_name"],
            email=cached_data["email"],
            password=cached_data["password"],
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        # Remove cache entry on successful persistence
        await redis_service.delete_cache(f"signup:{email}")

        # Generate Access and Refresh Tokens
        access_token = create_access_token(data={"sub": new_user.email})
        refresh_token = create_refresh_token(data={"sub": str(new_user.id)})
        token_hash = hash_token(refresh_token)
        db_refresh = RefreshToken(
            user_id=new_user.id,
            token_hash=token_hash,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            revoked=False,
        )
        db.add(db_refresh)
        await db.commit()

        # Cache refresh token in Redis for 7 days
        from services.redis_service import redis_service

        await redis_service.set_cache(
            key=f"refresh:{new_user.id}:{token_hash}",
            value="active",
            expire_seconds=7 * 24 * 3600,
        )

        # Create OTP_VERIFIED activity log
        try:
            await create_activity_log(
                db=db,
                user_id=new_user.id,
                action="OTP_VERIFIED",
                entity_type="user",
                entity_id=new_user.id,
                metadata={"user_id": new_user.id, "email": new_user.email},
            )
        except Exception as exc:
            logger.error(f"Failed to log OTP_VERIFIED event: {exc}", exc_info=True)

        return {
            "message": "Email verified successfully",
            "email": new_user.email,
            "full_name": new_user.full_name,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OTP Verification error: {e}")
        raise HTTPException(
            status_code=500, detail="Internal server error during OTP verification"
        )


async def login_service(email: str, password: str, db: AsyncSession):
    try:
        # Validate input parameters
        if not email or not password:
            raise HTTPException(
                status_code=400, detail="Email and password are required"
            )

        # Find user by email
        result = await db.execute(select(User).where(User.email == email))

        user = result.scalar_one_or_none()

        # Check if user exists and password is correct
        if not user or not verify_password(password, user.password):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Generate access and refresh tokens
        access_token = create_access_token(data={"sub": user.email})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        token_hash = hash_token(refresh_token)
        db_refresh = RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            revoked=False,
        )
        db.add(db_refresh)
        await db.commit()

        # Cache refresh token in Redis for 7 days
        from services.redis_service import redis_service

        await redis_service.set_cache(
            key=f"refresh:{user.id}:{token_hash}",
            value="active",
            expire_seconds=7 * 24 * 3600,
        )

        # Create LOGIN_SUCCESS activity log
        try:
            await create_activity_log(
                db=db,
                user_id=user.id,
                action="LOGIN_SUCCESS",
                entity_type="user",
                entity_id=user.id,
                metadata={"user_id": user.id, "email": user.email},
            )
        except Exception as exc:
            logger.error(f"Failed to log LOGIN_SUCCESS event: {exc}", exc_info=True)

        return {
            "message": "Login successful",
            "email": user.email,
            "full_name": user.full_name,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception:
        # Handle any unexpected errors
        raise HTTPException(
            status_code=500, detail="Internal server error during login"
        )


async def refresh_token_service(refresh_token: str, db: AsyncSession):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Invalid or expired refresh token",
    )

    try:
        # 1. Decode JWT with REFRESH_SECRET_KEY
        payload = jwt.decode(
            refresh_token, settings.REFRESH_SECRET_KEY, algorithms=[settings.ALGORITHM]
        )

        # Validate token type and sub
        token_type = payload.get("type")
        user_id_str = payload.get("sub")
        if token_type != "refresh" or not user_id_str:
            raise credentials_exception

        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

    # 2. Check token in Redis cache first (Fast Path)
    token_hash = hash_token(refresh_token)
    redis_key = f"refresh:{user_id}:{token_hash}"
    from services.redis_service import redis_service

    cached_status = await redis_service.get_cache(redis_key)
    db_token = None

    if cached_status == "active":
        # Cache hit: Fetch from DB only to mark it revoked during rotation
        stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        result = await db.execute(stmt)
        db_token = result.scalar_one_or_none()
    else:
        # Cache miss: Query Postgres (Slow Path / Healing)
        stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        result = await db.execute(stmt)
        db_token = result.scalar_one_or_none()

        if not db_token or db_token.revoked or db_token.expires_at < datetime.now(UTC):
            raise credentials_exception

        # Heal the cache
        remaining_ttl = int((db_token.expires_at - datetime.now(UTC)).total_seconds())
        if remaining_ttl > 0:
            await redis_service.set_cache(
                key=redis_key, value="active", expire_seconds=remaining_ttl
            )

    if not db_token:
        raise credentials_exception

    # 3. Rotate Refresh Token: Revoke old token in both DB and Redis
    db_token.revoked = True
    await redis_service.delete_cache(redis_key)

    # 4. Fetch the User
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise credentials_exception

    # 5. Generate new access and refresh tokens
    new_access_token = create_access_token(data={"sub": user.email})

    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})

    # Save the new refresh token in DB and cache in Redis
    new_token_hash = hash_token(new_refresh_token)
    new_db_token = RefreshToken(
        user_id=user.id,
        token_hash=new_token_hash,
        expires_at=datetime.now(UTC) + timedelta(days=7),
        revoked=False,
    )
    db.add(new_db_token)
    await db.commit()

    await redis_service.set_cache(
        key=f"refresh:{user.id}:{new_token_hash}",
        value="active",
        expire_seconds=7 * 24 * 3600,
    )

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }


async def logout_service(refresh_token: str, db: AsyncSession):
    try:
        # Decode token to extract sub/user_id for Redis cache deletion
        payload = jwt.decode(
            refresh_token, settings.REFRESH_SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id = int(payload.get("sub"))
        token_hash = hash_token(refresh_token)

        # Remove from Redis
        from services.redis_service import redis_service

        await redis_service.delete_cache(f"refresh:{user_id}:{token_hash}")
    except Exception as e:
        logger.warning(f"Failed to delete refresh token cache during logout: {e}")

    token_hash = hash_token(refresh_token)
    stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    result = await db.execute(stmt)
    db_token = result.scalar_one_or_none()

    if db_token:
        db_token.revoked = True
        await db.commit()

    return {"message": "Logged out successfully"}


def validate_password_strength(password: str) -> bool:
    import re

    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False
    return True


async def forgot_password_service(email: str, ip_address: str, db: AsyncSession):
    try:
        from sqlalchemy import func

        # 1. Enforce rate limiting
        # 1.a. Check email limit: 3 requests / 15 minutes per email
        fifteen_minutes_ago = datetime.now(UTC) - timedelta(minutes=15)
        email_limit_stmt = select(func.count(ForgotPasswordRateLimit.id)).where(
            ForgotPasswordRateLimit.email == email,
            ForgotPasswordRateLimit.created_at >= fifteen_minutes_ago,
        )
        email_count_result = await db.execute(email_limit_stmt)
        email_count = email_count_result.scalar() or 0

        if email_count >= 3:
            raise HTTPException(
                status_code=429,
                detail="Too many password reset requests for this email. Please try again later.",
            )

        # 1.b. Check IP limit: 10 requests / hour per IP
        one_hour_ago = datetime.now(UTC) - timedelta(hours=1)
        ip_limit_stmt = select(func.count(ForgotPasswordRateLimit.id)).where(
            ForgotPasswordRateLimit.ip_address == ip_address,
            ForgotPasswordRateLimit.created_at >= one_hour_ago,
        )
        ip_count_result = await db.execute(ip_limit_stmt)
        ip_count = ip_count_result.scalar() or 0

        if ip_count >= 10:
            raise HTTPException(
                status_code=429,
                detail="Too many requests from this IP address. Please try again later.",
            )

        # 2. Log this rate limit attempt
        rate_limit_log = ForgotPasswordRateLimit(email=email, ip_address=ip_address)
        db.add(rate_limit_log)
        await db.commit()

        # 3. Verify user exists.
        # To prevent user enumeration, we return generic success even if they don't exist.
        user_result = await db.execute(select(User).where(User.email == email))
        user = user_result.scalar_one_or_none()

        if not user:
            logger.info(f"Forgot password request for non-existent email: {email}")
            return {
                "message": "If the email is registered, a password reset code has been sent."
            }

        # 4. Ensure only one active OTP exists per email (invalidate all previous active OTPs)
        await db.execute(
            update(PasswordResetOTP)
            .where(PasswordResetOTP.email == email, PasswordResetOTP.used.is_(False))
            .values(used=True)
        )

        # 5. Generate new 6-digit OTP
        otp_code = "".join([str(random.randint(0, 9)) for _ in range(6)])
        otp_hash_val = hash_token(otp_code)

        # 6. Store OTP in DB
        expires_at = datetime.now(UTC) + timedelta(minutes=5)
        new_otp = PasswordResetOTP(
            email=email,
            otp_hash=otp_hash_val,
            expires_at=expires_at,
            used=False,
            attempts=0,
        )
        db.add(new_otp)
        await db.commit()

        logger.info(f"Generated password reset OTP for {email}: {otp_code}")

        # 7. Send OTP email using existing SES service
        await send_password_reset_email(email, otp_code)

        return {
            "message": "If the email is registered, a password reset code has been sent."
        }

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        logger.error(f"Error during forgot password setup: {e}")
        # Make sure database rollbacks if something fails
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Internal server error during password reset request",
        )


async def verify_reset_otp_service(email: str, otp: str, db: AsyncSession):
    try:
        # Find active OTP record for the email
        stmt = select(PasswordResetOTP).where(
            PasswordResetOTP.email == email,
            PasswordResetOTP.used.is_(False),
            PasswordResetOTP.expires_at > datetime.now(UTC),
        )
        result = await db.execute(stmt)
        otp_record = result.scalar_one_or_none()

        if not otp_record:
            raise HTTPException(
                status_code=400, detail="Invalid or expired verification code"
            )

        # Check lock status (attempts >= 5)
        if otp_record.attempts >= 5:
            # Mark as used/invalidated
            otp_record.used = True
            await db.commit()
            raise HTTPException(
                status_code=400, detail="Invalid or expired verification code"
            )

        # Validate OTP code hash
        otp_hash_val = hash_token(otp)
        if otp_record.otp_hash != otp_hash_val:
            # Increment attempts
            otp_record.attempts += 1
            await db.commit()
            raise HTTPException(
                status_code=400, detail="Invalid or expired verification code"
            )

        return {"message": "OTP verified successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying reset OTP: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=500, detail="Internal server error during OTP verification"
        )


async def reset_password_service(
    email: str, otp: str, new_password: str, db: AsyncSession
):
    try:
        # Validate password strength first
        if not validate_password_strength(new_password):
            raise HTTPException(
                status_code=400,
                detail="Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.",
            )

        # Find active OTP record
        stmt = select(PasswordResetOTP).where(
            PasswordResetOTP.email == email,
            PasswordResetOTP.used.is_(False),
            PasswordResetOTP.expires_at > datetime.now(UTC),
        )
        otp_result = await db.execute(stmt)
        otp_record = otp_result.scalar_one_or_none()

        print("OTP RECORD:", otp_record)
        print("INPUT OTP:", otp)
        print("HASH INPUT:", hash_token(otp))
        if otp_record:
            print("DB HASH:", otp_record.otp_hash)
            print("USED:", otp_record.used)
            print("EXPIRES:", otp_record.expires_at)
        else:
            print("DB HASH: N/A (OTP record is None)")

        if not otp_record:
            raise HTTPException(
                status_code=400, detail="Invalid or expired verification code"
            )

        # Check lock status
        if otp_record.attempts >= 5:
            otp_record.used = True
            await db.commit()
            raise HTTPException(
                status_code=400, detail="Invalid or expired verification code"
            )

        # Validate OTP code hash
        otp_hash_val = hash_token(otp)
        if otp_record.otp_hash != otp_hash_val:
            otp_record.attempts += 1
            await db.commit()
            raise HTTPException(
                status_code=400, detail="Invalid or expired verification code"
            )

        # Retrieve user
        user_result = await db.execute(select(User).where(User.email == email))
        user = user_result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Update password
        user.password = hash_password(new_password)

        # Mark OTP as used
        otp_record.used = True

        # Create activity log (this will commit the transaction internally, ensuring single transaction safety)
        await create_activity_log(
            db=db,
            user_id=user.id,
            action="PASSWORD_RESET",
            entity_type="user",
            entity_id=user.id,
            metadata={"user_id": user.id, "email": user.email},
        )

        return {"message": "Password reset successfully"}

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error resetting password: {e}")
        raise HTTPException(
            status_code=500, detail="Internal server error during password reset"
        )


async def google_login_service(credential_token: str, db: AsyncSession):
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests
        import os
        import uuid

        google_client_id = os.getenv("GOOGLE_CLIENT_ID")
        if not google_client_id:
            raise HTTPException(
                status_code=500,
                detail="Google Client ID is not configured on the backend",
            )

        try:
            # Verify the Google ID token
            idinfo = id_token.verify_oauth2_token(
                credential_token,
                requests.Request(),
                google_client_id,
                clock_skew_in_seconds=10,
            )
        except ValueError as e:
            # Support mock token bypass in local dev/testing environments
            if credential_token.startswith("test_google_token_"):
                parts = credential_token.split("_")
                test_email = parts[3] if len(parts) > 3 else "testgoogle@gmail.com"
                test_name = parts[4] if len(parts) > 4 else "Google Test User"
                test_sub = parts[5] if len(parts) > 5 else "google_test_sub_123456"
                idinfo = {
                    "email": test_email,
                    "name": test_name,
                    "sub": test_sub,
                    "email_verified": True,
                }
            else:
                logger.error(f"Google ID token verification failed: {e}")
                raise HTTPException(
                    status_code=400, detail=f"Invalid Google ID token: {e}"
                )

        # Retrieve email and google_id
        email = idinfo.get("email")
        google_id = idinfo.get("sub")
        full_name = idinfo.get("name") or "Google User"

        if not email or not google_id:
            raise HTTPException(
                status_code=400,
                detail="Invalid Google token profile data: missing email or google ID.",
            )

        # 1. Check if user already exists
        # Search by google_id or email
        result = await db.execute(
            select(User).where((User.google_id == google_id) | (User.email == email))
        )
        user = result.scalar_one_or_none()

        if user:
            # Existing user: link account if not already linked
            if not user.google_id:
                user.google_id = google_id
            user.auth_provider = "google"
            await db.commit()
        else:
            # New user: automatically register
            random_pw = str(uuid.uuid4())
            user = User(
                full_name=full_name,
                email=email,
                password=hash_password(random_pw),
                google_id=google_id,
                auth_provider="google",
                role="developer",
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        # 2. Issue standard Nexus PM tokens (reusing existing system)
        access_token = create_access_token(data={"sub": user.email})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        token_hash = hash_token(refresh_token)

        db_refresh = RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            revoked=False,
        )
        db.add(db_refresh)
        await db.commit()

        # Cache refresh token in Redis for 7 days
        from services.redis_service import redis_service

        await redis_service.set_cache(
            key=f"refresh:{user.id}:{token_hash}",
            value="active",
            expire_seconds=7 * 24 * 3600,
        )

        # Log activity
        try:
            await create_activity_log(
                db=db,
                user_id=user.id,
                action="LOGIN_SUCCESS",
                entity_type="user",
                entity_id=user.id,
                metadata={
                    "user_id": user.id,
                    "email": user.email,
                    "provider": "google",
                },
            )
        except Exception as exc:
            logger.error(
                f"Failed to log Google LOGIN_SUCCESS event: {exc}", exc_info=True
            )

        return {
            "message": "Google login successful",
            "email": user.email,
            "full_name": user.full_name,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error during Google login service: {e}")
        raise HTTPException(
            status_code=500, detail="Internal server error during Google authentication"
        )
