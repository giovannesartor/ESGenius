"""ESG Analytics schemas — request/response models for the analytics engine."""

from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ─── Sub-indicator Definitions ───────────────────────────────────────────────

class SubIndicatorScore(BaseModel):
    """Score for a single sub-indicator within a pillar."""
    name: str
    code: str
    weight: float = Field(..., ge=0, le=1)
    raw_score: float = Field(..., ge=0, le=100)
    data_quality: str = Field(default="complete")  # complete, partial, missing
    penalty: float = Field(default=0.0)
    adjusted_score: float = Field(..., ge=0, le=100)
    justification: str


class PillarBreakdown(BaseModel):
    """Detailed breakdown for a single ESG pillar (E, S, or G)."""
    pillar: str  # environmental, social, governance
    pillar_code: str  # E, S, G
    weight: float = Field(..., ge=0, le=1)
    raw_score: float = Field(..., ge=0, le=100)
    weighted_score: float = Field(..., ge=0, le=100)
    sub_indicators: list[SubIndicatorScore]
    data_completeness: float = Field(..., ge=0, le=1)
    strengths: list[str]
    weaknesses: list[str]


# ─── ESG Score Response ──────────────────────────────────────────────────────

class ESGScoreRequest(BaseModel):
    """Request to compute ESG scores for a company."""
    company_id: UUID
    year: int
    include_breakdown: bool = True


class ESGScoreResponse(BaseModel):
    """Full ESG score with detailed breakdown and justification."""
    company_id: UUID
    year: int
    overall_score: float = Field(..., ge=0, le=100)
    overall_grade: str  # A+, A, B+, B, C+, C, D, F
    environmental: PillarBreakdown
    social: PillarBreakdown
    governance: PillarBreakdown
    data_completeness: float = Field(..., ge=0, le=1)
    confidence_level: float = Field(..., ge=0, le=1)
    total_data_points: int
    validated_data_points: int
    methodology_version: str = "2.0"


# ─── Benchmark ───────────────────────────────────────────────────────────────

class BenchmarkComparison(BaseModel):
    """Single comparison point."""
    metric: str
    company_score: float
    industry_average: float
    best_in_class: float
    gap_to_average: float
    gap_to_best: float
    percentile: float = Field(..., ge=0, le=100)


class BenchmarkRequest(BaseModel):
    """Request to compute benchmark comparison."""
    company_id: UUID
    year: int
    sector: Optional[str] = None


class BenchmarkResponse(BaseModel):
    """Full benchmark comparison result."""
    company_id: UUID
    year: int
    sector: str
    classification: str  # lagging, average, competitive, leading
    overall: BenchmarkComparison
    environmental: BenchmarkComparison
    social: BenchmarkComparison
    governance: BenchmarkComparison
    sub_indicator_comparisons: list[BenchmarkComparison]
    strengths_vs_peers: list[str]
    weaknesses_vs_peers: list[str]


# ─── KPI Generator ──────────────────────────────────────────────────────────

class GeneratedKPI(BaseModel):
    """A single generated KPI recommendation."""
    id: str
    name: str
    description: str
    pillar: str  # E, S, G
    category: str
    current_value: float
    current_unit: str
    target_value: float
    target_unit: str
    improvement_percentage: float
    timeframe: str  # short-term, mid-term, long-term
    timeframe_months: int
    measurement_method: str
    priority: str  # critical, high, medium, low
    difficulty: str  # easy, moderate, hard
    estimated_score_impact: float


class KPIRequest(BaseModel):
    """Request to generate KPIs."""
    company_id: UUID
    year: int
    max_kpis: int = Field(default=10, ge=1, le=30)


class KPIResponse(BaseModel):
    """Generated KPI list with targets."""
    company_id: UUID
    year: int
    total_kpis: int
    short_term: list[GeneratedKPI]  # 3 months
    mid_term: list[GeneratedKPI]    # 6 months
    long_term: list[GeneratedKPI]   # 12 months
    estimated_total_improvement: float
    priority_summary: dict[str, int]


# ─── What-If Simulation ─────────────────────────────────────────────────────

class SimulationAction(BaseModel):
    """A single improvement action to simulate."""
    action_id: str
    name: str
    description: str
    pillar: str  # E, S, G
    sub_indicator: str
    estimated_improvement: float = Field(..., ge=0, le=100, description="Points improvement for the sub-indicator")
    cost_level: str = Field(default="medium")  # low, medium, high
    implementation_months: int = Field(default=6, ge=1, le=36)


class SimulationRequest(BaseModel):
    """Request to simulate ESG improvements."""
    company_id: UUID
    year: int
    actions: list[SimulationAction]


class SimulationResult(BaseModel):
    """Result of a single action simulation."""
    action_id: str
    action_name: str
    pillar: str
    before_pillar_score: float
    after_pillar_score: float
    pillar_delta: float
    before_overall: float
    after_overall: float
    overall_delta: float
    before_grade: str
    after_grade: str


class SimulationResponse(BaseModel):
    """Full what-if simulation results."""
    company_id: UUID
    year: int
    current_overall_score: float
    current_grade: str
    projected_overall_score: float
    projected_grade: str
    total_improvement: float
    results: list[SimulationResult]
    cumulative_impact: dict[str, float]  # { "E": delta, "S": delta, "G": delta, "overall": delta }


# ─── Multi-Scenario Simulation ──────────────────────────────────────────────

class ScenarioProjection(BaseModel):
    """Projection for a single scenario."""
    scenario: str  # conservative, moderate, aggressive
    label: str
    description: str
    projected_overall: float
    projected_environmental: float
    projected_social: float
    projected_governance: float
    projected_grade: str
    improvement_delta: float
    timeline_months: int
    actions_required: int
    estimated_investment: str  # low, medium, high


class MultiScenarioRequest(BaseModel):
    """Request to run multi-scenario simulation."""
    company_id: UUID
    year: int


class MultiScenarioResponse(BaseModel):
    """Multi-scenario projection result."""
    company_id: UUID
    year: int
    current_score: float
    current_grade: str
    scenarios: list[ScenarioProjection]
    recommendation: str


# ─── Company Comparison ──────────────────────────────────────────────────────

class CompanyScoreSummary(BaseModel):
    """Summary scores for a single company."""
    company_id: UUID
    company_name: str
    sector: Optional[str] = None
    overall_score: float
    environmental_score: float
    social_score: float
    governance_score: float
    grade: str
    rank: int
    strengths: list[str]
    weaknesses: list[str]


class ComparisonRequest(BaseModel):
    """Request to compare multiple companies."""
    company_ids: list[UUID] = Field(..., min_length=2, max_length=10)
    year: int


class ComparisonResponse(BaseModel):
    """Company comparison result with rankings."""
    year: int
    companies: list[CompanyScoreSummary]
    ranking: list[dict[str, Any]]  # ordered by overall score
    best_environmental: UUID
    best_social: UUID
    best_governance: UUID
    analysis_summary: str
