from datetime import datetime
from typing import Optional, Any

from pydantic import BaseModel, ConfigDict


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


class NotificationCountResponse(BaseModel):
    """Response schema for notifications unread count."""
    unread_count: int

