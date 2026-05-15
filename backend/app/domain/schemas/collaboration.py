"""Schemas for collaboration: comments and tasks."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class CommentCreate(BaseModel):
    entity_type: str = Field(..., pattern="^(data_point|document|report)$")
    entity_id: UUID
    body: str = Field(..., min_length=1, max_length=5000)
    parent_id: Optional[UUID] = None


class CommentUpdate(BaseModel):
    body: Optional[str] = Field(None, min_length=1, max_length=5000)
    is_resolved: Optional[bool] = None


class CommentResponse(BaseModel):
    id: UUID
    company_id: UUID
    author_id: Optional[UUID]
    entity_type: str
    entity_id: UUID
    parent_id: Optional[UUID]
    body: str
    is_resolved: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[UUID] = None
    assignee_id: Optional[UUID] = None
    priority: str = Field("medium", pattern="^(low|medium|high|urgent)$")
    due_date: Optional[datetime] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignee_id: Optional[UUID] = None
    status: Optional[str] = Field(None, pattern="^(open|in_progress|done|cancelled)$")
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|urgent)$")
    due_date: Optional[datetime] = None


class TaskResponse(BaseModel):
    id: UUID
    company_id: UUID
    title: str
    description: Optional[str]
    entity_type: Optional[str]
    entity_id: Optional[UUID]
    assignee_id: Optional[UUID]
    created_by: Optional[UUID]
    status: str
    priority: str
    due_date: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
