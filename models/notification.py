from datetime import datetime, UTC
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON, ForeignKey, func
from sqlalchemy.orm import relationship
from db.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    notification_metadata = Column("metadata", JSON, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        server_default=func.now()
    )

    user = relationship("User")

    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, user_id={self.user_id}, is_read={self.is_read})>"
