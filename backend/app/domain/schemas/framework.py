"""Framework schemas — request/response models for ESG frameworks."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


# --- Framework ---
class FrameworkCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    version: Optional[str] = None


class FrameworkUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    version: Optional[str] = None
    is_active: Optional[bool] = None


class FrameworkResponse(BaseModel):
    id: UUID
    name: str
    code: str
    description: Optional[str] = None
    version: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Category ---
class CategoryCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    pillar: str
    sort_order: int = 0


class CategoryResponse(BaseModel):
    id: UUID
    framework_id: UUID
    name: str
    code: str
    description: Optional[str] = None
    pillar: str
    sort_order: int

    model_config = {"from_attributes": True}


# --- Indicator ---
class IndicatorCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    unit: Optional[str] = None
    data_type: str = "numeric"
    is_required: bool = False
    sort_order: int = 0


class IndicatorResponse(BaseModel):
    id: UUID
    category_id: UUID
    name: str
    code: str
    description: Optional[str] = None
    unit: Optional[str] = None
    data_type: str
    is_required: bool
    sort_order: int

    model_config = {"from_attributes": True}


# --- Metric ---
class MetricCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    unit: Optional[str] = None
    data_type: str = "numeric"
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    is_required: bool = False


class MetricResponse(BaseModel):
    id: UUID
    indicator_id: UUID
    name: str
    code: str
    description: Optional[str] = None
    unit: Optional[str] = None
    data_type: str
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    is_required: bool

    model_config = {"from_attributes": True}


# --- Full framework with nested children ---
class FrameworkFullResponse(BaseModel):
    id: UUID
    name: str
    code: str
    description: Optional[str] = None
    version: Optional[str] = None
    is_active: bool
    categories: list[CategoryResponse] = []

    model_config = {"from_attributes": True}
