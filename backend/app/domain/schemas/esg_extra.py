"""Schemas for ESG-specific features: emissions, benchmarks, regulatory, chat, templates.

Designed to match the actual service outputs (permissive where helpful).
"""

from datetime import date, datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ---- Emissions / carbon footprint ----
class EmissionCalculateRequest(BaseModel):
    scope: int = Field(..., ge=1, le=3)
    category: str
    activity: str
    quantity: float = Field(..., gt=0)
    unit: str
    region: Optional[str] = None
    year: Optional[int] = None
    notes: Optional[str] = None


class EmissionCalculateResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
    co2e_kg: float
    co2e_tonnes: float
    factor_used: float
    factor_unit: str
    factor_source: str
    scope: int


class CarbonEmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    company_id: UUID
    year: int
    scope: int
    category: str
    activity: str
    quantity: float
    unit: str
    co2e_kg: float
    notes: Optional[str] = None
    created_at: datetime


class CarbonSummary(BaseModel):
    year: int
    scope_1_kg: float = 0.0
    scope_2_kg: float = 0.0
    scope_3_kg: float = 0.0
    total_kg: float = 0.0
    total_tonnes: float = 0.0
    by_category: dict[str, float] = Field(default_factory=dict)


# ---- Benchmarks ----
class BenchmarkResult(BaseModel):
    metric_code: str
    sector: str
    year: int
    avg_value: Optional[float] = None
    median_value: Optional[float] = None
    p25: Optional[float] = None
    p75: Optional[float] = None
    unit: Optional[str] = None
    sample_size: Optional[int] = None


# ---- Predictive scoring ----
class ScorePrediction(BaseModel):
    horizon_years: int
    base_score: float
    predicted_score: float
    confidence: float
    trend: str
    drivers: list[dict[str, Any]] = Field(default_factory=list)


# ---- Materiality matrix ----
class MaterialityTopic(BaseModel):
    model_config = ConfigDict(extra="allow")
    name: str
    category: str
    impact_score: float
    financial_score: float
    description: Optional[str] = None


class MaterialityMatrixResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
    topics: list[MaterialityTopic] = Field(default_factory=list)


# ---- Greenwashing ----
class GreenwashingFlag(BaseModel):
    model_config = ConfigDict(extra="allow")
    phrase: Optional[str] = None
    issue: Optional[str] = None
    severity: str = "low"
    suggestion: Optional[str] = None


class GreenwashingScanResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
    overall_risk: str = "low"
    score: float = 0.0
    flags: list[GreenwashingFlag] = Field(default_factory=list)


# ---- Regulatory ----
class RegulatoryUpdateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    title: str
    summary: Optional[str] = None
    body: Optional[str] = None
    source: Optional[str] = None
    region: Optional[str] = None
    sectors: Optional[list[str]] = None
    framework_codes: Optional[list[str]] = None
    severity: Optional[str] = None
    effective_date: Optional[date] = None
    deadline_date: Optional[date] = None
    url: Optional[str] = None
    published_at: Optional[datetime] = None


# ---- Chat ----
class ChatMessageRequest(BaseModel):
    company_id: UUID
    message: str = Field(..., min_length=1, max_length=4000)
    conversation_id: Optional[UUID] = None
    language: Optional[str] = "en"


class ChatCitation(BaseModel):
    model_config = ConfigDict(extra="allow")
    document_id: Optional[str] = None
    page_number: Optional[int] = None
    snippet: Optional[str] = None


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
    conversation_id: UUID
    message_id: UUID
    answer: str
    citations: list[ChatCitation] = Field(default_factory=list)


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ---- Templates marketplace ----
class ReportTemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    slug: str
    description: Optional[str] = None
    sector: Optional[str] = None
    region: Optional[str] = None
    framework_codes: list[str] = Field(default_factory=list)
    language: str = "en"
    is_premium: bool = False
    is_official: bool = False
    download_count: int = 0
    rating: float = 0.0
    created_at: datetime


# ---- Recommendations ----
class Recommendation(BaseModel):
    model_config = ConfigDict(extra="allow")
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    estimated_impact: Optional[float] = None
    effort: Optional[str] = None
    framework_codes: Optional[list[str]] = None


class RecommendationsResponse(BaseModel):
    recommendations: list[Recommendation] = Field(default_factory=list)
    generated_at: datetime


# ---- Auto-fill ----
class AutoFillRequest(BaseModel):
    company_id: UUID
    year: int
    framework_codes: list[str] = Field(default_factory=list)


class AutoFilledValue(BaseModel):
    model_config = ConfigDict(extra="allow")
    metric_code: Optional[str] = None
    suggested_value: Optional[float] = None
    unit: Optional[str] = None
    source: Optional[str] = None
    confidence: Optional[float] = None
    framework_codes: Optional[list[str]] = None


class AutoFillResponse(BaseModel):
    company_id: UUID
    year: int
    suggestions: list[AutoFilledValue] = Field(default_factory=list)


# ---- CSV mapping ----
class CSVMappingRequest(BaseModel):
    csv_text: str
    language: Optional[str] = "en"


class CSVColumnMapping(BaseModel):
    model_config = ConfigDict(extra="allow")
    column_name: Optional[str] = None
    suggested_metric_code: Optional[str] = None
    confidence: Optional[float] = None
    suggested_unit: Optional[str] = None
    suggested_category: Optional[str] = None
    notes: Optional[str] = None


class CSVMappingResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
    mappings: list[CSVColumnMapping] = Field(default_factory=list)
    headers: list[str] = Field(default_factory=list)
    sample: list[list[str]] = Field(default_factory=list)


# ---- Report version diff ----
class ReportVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    report_id: UUID
    version_number: int
    created_by: Optional[UUID] = None
    change_summary: Optional[str] = None
    language: str = "en"
    created_at: datetime


class ReportDiffResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
    v1: int
    v2: int
    diff: dict[str, Any] = Field(default_factory=dict)
    score_diff: dict[str, Any] = Field(default_factory=dict)
