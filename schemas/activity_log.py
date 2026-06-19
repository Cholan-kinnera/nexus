from datetime import datetime
from typing import Optional, Any

from pydantic import BaseModel, ConfigDict


class ActivityLogResponse(BaseModel):
    """Response schema for activity log entries."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: Optional[int] = None
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    log_metadata: Optional[dict[str, Any]] = None
    created_at: datetime


class NotificationResponse(BaseModel):
    """Response schema for notification entries."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    notification_metadata: Optional[dict[str, Any]] = None
    created_at: datetime


class NotificationReadResponse(BaseModel):
    """Response schema after marking notification(s) as read."""

    success: bool
    message: str
    updated_count: int = 0
