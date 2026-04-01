"""ESG Data schemas — request/response models for ESG data points."""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel


class DataPointCreate(BaseModel):
    metric_id: Optional[UUID] = None
    value: Optional[str] = None
    numeric_value: Optional[float] = None
    unit: Optional[str] = None
    year: int
    period: Optional[str] = None
    pillar: Optional[str] = None
    category: Optional[str] = None
    source: str = "manual"


class DataPointUpdate(BaseModel):
    value: Optional[str] = None
    numeric_value: Optional[float] = None
    unit: Optional[str] = None
    status: Optional[str] = None
    pillar: Optional[str] = None
    category: Optional[str] = None


class DataPointResponse(BaseModel):
    id: UUID
    company_id: UUID
    metric_id: Optional[UUID] = None
    document_id: Optional[UUID] = None
    value: Optional[str] = None
    numeric_value: Optional[float] = None
    unit: Optional[str] = None
    year: int
    period: Optional[str] = None
    source: str
    status: str
    pillar: Optional[str] = None
    category: Optional[str] = None
    ai_confidence: Optional[float] = None
    metadata_json: Optional[dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DataPointBulkCreate(BaseModel):
    data_points: list[DataPointCreate]


class DataPointFilter(BaseModel):
    year: Optional[int] = None
    pillar: Optional[str] = None
    category: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    metric_id: Optional[UUID] = None
