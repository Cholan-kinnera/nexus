import random
import logging
from datetime import datetime, timedelta
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
    hash_token
)
from services.activity_service import create_activity_log

logger = logging.getLogger(__name__)

# In-memory registration cache
otp_cache = {}

async def signup_service(
    full_name: str,
    email: str,
    password: str,
    db: AsyncSession
):
    try:
        # Check if user already exists
        result = await db.execute(
            select(User).where(User.email == email)
        )

        existing_user = result.scalar_one_or_none()

        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="User already exists"
            )

        # Generate random 6-digit OTP code
        otp_code = "".join([str(random.randint(0, 9)) for _ in range(6)])

        # Cache signup details with hashed password
        otp_cache[email] = {
            "full_name": full_name,
            "email": email,
            "password": hash_password(password),
            "otp": otp_code
        }

        # Send AWS SES verification email
        email_sent = await send_otp_email(email, otp_code)
        if not email_sent:
            raise HTTPException(
                status_code=500,
                detail="Failed to send verification email. Please try again or verify your email in AWS SES sandbox."
            )
        
        return {
            "message": "Verification code sent to email. Please verify OTP.",
            "email": email,
            "access_token": None
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup setup error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during registration setup"
        )


async def verify_otp_service(
    email: str,
    otp: str,
    db: AsyncSession
):
    try:
        cached_data = otp_cache.get(email)
        if not cached_data or cached_data["otp"] != otp:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired verification code"
            )

        # Confirm user doesn't exist (concurrency check)
        result = await db.execute(
            select(User).where(User.email == email)
        )
        existing_user = result.scalar_one_or_none()
        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="User already exists"
            )

        # Persist user in database
        new_user = User(
            full_name=cached_data["full_name"],
            email=cached_data["email"],
            password=cached_data["password"]
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        # Remove cache entry on successful persistence
        otp_cache.pop(email, None)

        # Generate Access and Refresh Tokens
        access_token = create_access_token(
            data={"sub": new_user.email}
        )
        refresh_token = create_refresh_token(
            data={"sub": str(new_user.id)}
        )
        token_hash = hash_token(refresh_token)
        db_refresh = RefreshToken(
            user_id=new_user.id,
            token_hash=token_hash,
            expires_at=datetime.utcnow() + timedelta(days=7),
            revoked=False
        )
        db.add(db_refresh)
        await db.commit()

        # Create OTP_VERIFIED activity log
        try:
            await create_activity_log(
                db=db,
                user_id=new_user.id,
                action="OTP_VERIFIED",
                entity_type="user",
                entity_id=new_user.id,
                metadata={
                    "user_id": new_user.id,
                    "email": new_user.email
                }
            )
        except Exception as exc:
            logger.error(f"Failed to log OTP_VERIFIED event: {exc}", exc_info=True)

        return {
            "message": "Email verified successfully",
            "email": new_user.email,
            "full_name": new_user.full_name,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OTP Verification error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during OTP verification"
        )


async def login_service(
    email: str,
    password: str,
    db: AsyncSession
):
    try:
        # Validate input parameters
        if not email or not password:
            raise HTTPException(
                status_code=400,
                detail="Email and password are required"
            )

        # Find user by email
        result = await db.execute(
            select(User).where(User.email == email)
        )

        user = result.scalar_one_or_none()

        # Check if user exists and password is correct
        if not user or not verify_password(password, user.password):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        # Generate access and refresh tokens
        access_token = create_access_token(
            data={"sub": user.email}
        )
        refresh_token = create_refresh_token(
            data={"sub": str(user.id)}
        )
        token_hash = hash_token(refresh_token)
        db_refresh = RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.utcnow() + timedelta(days=7),
            revoked=False
        )
        db.add(db_refresh)
        await db.commit()

        # Create LOGIN_SUCCESS activity log
        try:
            await create_activity_log(
                db=db,
                user_id=user.id,
                action="LOGIN_SUCCESS",
                entity_type="user",
                entity_id=user.id,
                metadata={
                    "user_id": user.id,
                    "email": user.email
                }
            )
        except Exception as exc:
            logger.error(f"Failed to log LOGIN_SUCCESS event: {exc}", exc_info=True)

        return {
            "message": "Login successful",
            "email": user.email,
            "full_name": user.full_name,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Handle any unexpected errors
        raise HTTPException(
            status_code=500,
            detail="Internal server error during login"
        )


async def refresh_token_service(refresh_token: str, db: AsyncSession):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Invalid or expired refresh token",
    )
    
    try:
        # 1. Decode JWT with REFRESH_SECRET_KEY
        payload = jwt.decode(
            refresh_token,
            settings.REFRESH_SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        # Validate token type and sub
        token_type = payload.get("type")
        user_id_str = payload.get("sub")
        if token_type != "refresh" or not user_id_str:
            raise credentials_exception
            
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

    # 2. Check token hash in database
    token_hash = hash_token(refresh_token)
    stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    result = await db.execute(stmt)
    db_token = result.scalar_one_or_none()

    if not db_token or db_token.revoked or db_token.expires_at < datetime.utcnow():
        raise credentials_exception

    # 3. Rotate Refresh Token: Revoke old token
    db_token.revoked = True
    
    # 4. Fetch the User
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise credentials_exception

    # 5. Generate new access and refresh tokens
    new_access_token = create_access_token(
        data={"sub": user.email}
    )
    
    new_refresh_token = create_refresh_token(
        data={"sub": str(user.id)}
    )
    
    # Save the new refresh token
    new_token_hash = hash_token(new_refresh_token)
    new_db_token = RefreshToken(
        user_id=user.id,
        token_hash=new_token_hash,
        expires_at=datetime.utcnow() + timedelta(days=7),
        revoked=False
    )
    db.add(new_db_token)
    await db.commit()

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


async def logout_service(refresh_token: str, db: AsyncSession):
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
        fifteen_minutes_ago = datetime.utcnow() - timedelta(minutes=15)
        email_limit_stmt = select(func.count(ForgotPasswordRateLimit.id)).where(
            ForgotPasswordRateLimit.email == email,
            ForgotPasswordRateLimit.created_at >= fifteen_minutes_ago
        )
        email_count_result = await db.execute(email_limit_stmt)
        email_count = email_count_result.scalar() or 0

        if email_count >= 3:
            raise HTTPException(
                status_code=429,
                detail="Too many password reset requests for this email. Please try again later."
            )

        # 1.b. Check IP limit: 10 requests / hour per IP
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        ip_limit_stmt = select(func.count(ForgotPasswordRateLimit.id)).where(
            ForgotPasswordRateLimit.ip_address == ip_address,
            ForgotPasswordRateLimit.created_at >= one_hour_ago
        )
        ip_count_result = await db.execute(ip_limit_stmt)
        ip_count = ip_count_result.scalar() or 0

        if ip_count >= 10:
            raise HTTPException(
                status_code=429,
                detail="Too many requests from this IP address. Please try again later."
            )

        # 2. Log this rate limit attempt
        rate_limit_log = ForgotPasswordRateLimit(
            email=email,
            ip_address=ip_address
        )
        db.add(rate_limit_log)
        await db.commit()

        # 3. Verify user exists.
        # To prevent user enumeration, we return generic success even if they don't exist.
        user_result = await db.execute(select(User).where(User.email == email))
        user = user_result.scalar_one_or_none()
        
        if not user:
            logger.info(f"Forgot password request for non-existent email: {email}")
            return {"message": "If the email is registered, a password reset code has been sent."}

        # 4. Ensure only one active OTP exists per email (invalidate all previous active OTPs)
        await db.execute(
            update(PasswordResetOTP)
            .where(PasswordResetOTP.email == email, PasswordResetOTP.used == False)
            .values(used=True)
        )

        # 5. Generate new 6-digit OTP
        otp_code = "".join([str(random.randint(0, 9)) for _ in range(6)])
        otp_hash_val = hash_token(otp_code)

        # 6. Store OTP in DB
        expires_at = datetime.utcnow() + timedelta(minutes=5)
        new_otp = PasswordResetOTP(
            email=email,
            otp_hash=otp_hash_val,
            expires_at=expires_at,
            used=False,
            attempts=0
        )
        db.add(new_otp)
        await db.commit()

        logger.info(f"Generated password reset OTP for {email}: {otp_code}")

        # 7. Send OTP email using existing SES service
        await send_password_reset_email(email, otp_code)

        return {"message": "If the email is registered, a password reset code has been sent."}

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        logger.error(f"Error during forgot password setup: {e}")
        # Make sure database rollbacks if something fails
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Internal server error during password reset request"
        )


async def verify_reset_otp_service(email: str, otp: str, db: AsyncSession):
    try:
        # Find active OTP record for the email
        stmt = select(PasswordResetOTP).where(
            PasswordResetOTP.email == email,
            PasswordResetOTP.used == False,
            PasswordResetOTP.expires_at > datetime.utcnow()
        )
        result = await db.execute(stmt)
        otp_record = result.scalar_one_or_none()

        if not otp_record:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired verification code"
            )

        # Check lock status (attempts >= 5)
        if otp_record.attempts >= 5:
            # Mark as used/invalidated
            otp_record.used = True
            await db.commit()
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired verification code"
            )

        # Validate OTP code hash
        otp_hash_val = hash_token(otp)
        if otp_record.otp_hash != otp_hash_val:
            # Increment attempts
            otp_record.attempts += 1
            await db.commit()
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired verification code"
            )

        return {"message": "OTP verified successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying reset OTP: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Internal server error during OTP verification"
        )


async def reset_password_service(email: str, otp: str, new_password: str, db: AsyncSession):
    try:
        # Validate password strength first
        if not validate_password_strength(new_password):
            raise HTTPException(
                status_code=400,
                detail="Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters."
            )

        # Find active OTP record
        stmt = select(PasswordResetOTP).where(
            PasswordResetOTP.email == email,
            PasswordResetOTP.used == False,
            PasswordResetOTP.expires_at > datetime.utcnow()
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
                status_code=400,
                detail="Invalid or expired verification code"
            )

        # Check lock status
        if otp_record.attempts >= 5:
            otp_record.used = True
            await db.commit()
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired verification code"
            )

        # Validate OTP code hash
        otp_hash_val = hash_token(otp)
        if otp_record.otp_hash != otp_hash_val:
            otp_record.attempts += 1
            await db.commit()
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired verification code"
            )

        # Retrieve user
        user_result = await db.execute(select(User).where(User.email == email))
        user = user_result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

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
            metadata={
                "user_id": user.id,
                "email": user.email
            }
        )

        return {"message": "Password reset successfully"}

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error resetting password: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during password reset"
        )

