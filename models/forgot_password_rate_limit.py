from datetime import datetime, UTC
from sqlalchemy import Column, Integer, String, DateTime

from db.database import Base


class ForgotPasswordRateLimit(Base):
    """ForgotPasswordRateLimit model to log requests and enforce rate limits for forgot password endpoint."""

    __tablename__ = "forgot_password_rate_limits"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String(45), index=True, nullable=False)
    email = Column(String(255), index=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    def __repr__(self) -> str:
        return f"<ForgotPasswordRateLimit(id={self.id}, ip={self.ip_address}, email={self.email})>"
