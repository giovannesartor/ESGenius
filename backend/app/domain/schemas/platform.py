"""Schemas for notifications, audit logs, webhooks/api-keys."""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl


class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    company_id: Optional[UUID]
    type: str
    title: str
    body: Optional[str]
    link_url: Optional[str]
    payload: Optional[dict[str, Any]]
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime]

    class Config:
        from_attributes = True


class NotificationPrefsUpdate(BaseModel):
    email_enabled: bool = True
    types: list[str] = Field(default_factory=list)


class AuditLogResponse(BaseModel):
    id: UUID
    company_id: Optional[UUID]
    user_id: Optional[UUID]
    action: str
    entity_type: Optional[str]
    entity_id: Optional[UUID]
    description: Optional[str]
    before_state: Optional[dict[str, Any]]
    after_state: Optional[dict[str, Any]]
    ip_address: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class WebhookCreate(BaseModel):
    name: str = Field(..., max_length=255)
    url: str = Field(..., max_length=1000)
    events: list[str] = Field(..., min_length=1)


class WebhookResponse(BaseModel):
    id: UUID
    company_id: UUID
    name: str
    url: str
    events: list[str]
    is_active: bool
    secret: str
    created_at: datetime
    last_triggered_at: Optional[datetime]
    failure_count: int

    class Config:
        from_attributes = True


class ApiKeyCreate(BaseModel):
    name: str = Field(..., max_length=255)
    scopes: list[str] = Field(default_factory=list)
    expires_at: Optional[datetime] = None


class ApiKeyResponse(BaseModel):
    id: UUID
    name: str
    key_prefix: str
    scopes: list[str]
    is_active: bool
    last_used_at: Optional[datetime]
    expires_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class ApiKeyCreatedResponse(ApiKeyResponse):
    """Returned only on creation, includes the plaintext key once."""

    plaintext_key: str


class PrivacyExportResponse(BaseModel):
    exported_at: Optional[str] = None
    user: dict[str, Any]
    notifications: list[dict[str, Any]] = Field(default_factory=list)
    audit_logs: list[dict[str, Any]] = Field(default_factory=list)


class MessageResponse(BaseModel):
    message: str
