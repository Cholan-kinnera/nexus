from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime)
from sqlalchemy.orm import Mapped, relationship
from db.database import Base


class Task(Base):
    __tablename__ = "tasks"
    id = Column(
        Integer,
        primary_key=True,
        index=True)
    title = Column(
        String,
        nullable=False)
    
    description = Column(
        String,
        nullable=True)
    
    status = Column(
        String,
        default="TODO")
    
    priority = Column(
        String,
        default="MEDIUM")
    
    due_date = Column(
        DateTime(timezone=True),
        nullable=True)
    
    project_id = Column(
        Integer,
        ForeignKey("projects.id") )
    
    assigned_to = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True )
    
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc))
    
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc) )
    
    project = relationship("Project")
    assignee = relationship("User")

    comments: Mapped[list["Comment"]] = relationship(
    "Comment",
    back_populates="task",
    cascade="all, delete-orphan"
)