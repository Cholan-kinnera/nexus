from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, func
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
    created_at = Column(
        DateTime, nullable=False, default=datetime.utcnow, server_default=func.now()
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=func.now(),
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"

    comments: Mapped[list["Comment"]] = relationship(
    "Comment",
    back_populates="user",
    cascade="all, delete-orphan"
)