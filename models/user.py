from datetime import datetime, UTC

from sqlalchemy import Column, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, relationship

from db.database import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models.comment import Comment
class User(Base):
    """User model for storing user information."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String(255), nullable=True)
    avatar_url = Column(Text, nullable=True)
    google_id = Column(String(255), nullable=True, unique=True)
    auth_provider = Column(String(50), nullable=False, default="local", server_default="local")
    created_at = Column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC), server_default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        server_default=func.now(),
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"

    comments: Mapped[list["Comment"]] = relationship(
    "Comment",
    back_populates="user",
    cascade="all, delete-orphan"
)