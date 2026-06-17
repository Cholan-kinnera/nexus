from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean

from db.database import Base

class PasswordResetOTP(Base):
    """PasswordResetOTP model for storing hashed OTP codes used to reset passwords."""

    __tablename__ = "password_reset_otps"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), index=True, nullable=False)
    otp_hash = Column(String(64), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<PasswordResetOTP(id={self.id}, email={self.email}, used={self.used})>"
