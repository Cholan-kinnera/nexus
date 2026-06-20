from datetime import datetime, timedelta, timezone
from typing import Any, Dict
from jose import jwt
from passlib.context import CryptContext
from core.config import settings

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plain text password using bcrypt.

    Args:
        password: Plain text password

    Returns:
        Hashed password
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain text password against a hashed password.

    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password to verify against

    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    data: Dict[str, Any], expires_delta: timedelta | None = None
) -> str:
    """Create a JWT access token.

    Args:
        data: Payload data to encode in the token
        expires_delta: Optional custom expiration time. Defaults to ACCESS_TOKEN_EXPIRE_MINUTES

    Returns:
        Encoded JWT token
    """
    import uuid

    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire, "type": "access", "jti": str(uuid.uuid4())})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


import hashlib  # noqa: E402

REFRESH_SECRET_KEY = settings.REFRESH_SECRET_KEY


def hash_token(token: str) -> str:
    """Hash a token using SHA-256 for secure database storage.

    Args:
        token: Raw token string

    Returns:
        Hex-encoded SHA-256 hash
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_refresh_token(
    data: Dict[str, Any], expires_delta: timedelta | None = None
) -> str:
    """Create a JWT refresh token.

    Args:
        data: Payload data to encode in the token (e.g. sub as user ID)
        expires_delta: Optional custom expiration time. Defaults to 7 days

    Returns:
        Encoded JWT token
    """
    import uuid

    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=7)

    to_encode.update({"exp": expire, "type": "refresh", "jti": str(uuid.uuid4())})
    encoded_jwt = jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt
