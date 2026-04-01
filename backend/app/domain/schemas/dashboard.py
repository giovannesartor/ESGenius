"""Dashboard schemas — response models for dashboard data."""

from typing import Any, Optional

from pydantic import BaseModel


class ESGScore(BaseModel):
    overall: float
    environmental: float
    social: float
    governance: float


class CompletionStats(BaseModel):
    total_metrics: int
    completed_metrics: int
    completion_percentage: float
    by_pillar: dict[str, float]


class RiskFlag(BaseModel):
    severity: str  # high, medium, low
    category: str
    message: str
    metric_id: Optional[str] = None


class DashboardResponse(BaseModel):
    esg_score: ESGScore
    completion: CompletionStats
    risk_flags: list[RiskFlag]
    insights: list[str]
    recent_activity: list[dict[str, Any]]
    trend_data: dict[str, Any]
