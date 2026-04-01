"""Report schemas — request/response models for reports."""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel


class ReportCreate(BaseModel):
    title: str
    report_type: str = "full"
    format: str = "pdf"
    year: int
    period: Optional[str] = None
    framework_ids: Optional[list[UUID]] = None


class ReportResponse(BaseModel):
    id: UUID
    company_id: UUID
    title: str
    report_type: str
    format: str
    year: int
    period: Optional[str] = None
    status: str
    esg_scores: Optional[dict[str, Any]] = None
    file_path: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ReportListResponse(BaseModel):
    reports: list[ReportResponse]
    total: int
