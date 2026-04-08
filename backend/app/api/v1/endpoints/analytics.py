"""ESG Analytics API endpoints — scoring, benchmark, KPI, simulation, comparison."""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import PermissionDeniedException
from app.api.dependencies import get_current_user
from app.domain.models.user import User
from app.domain.schemas.analytics import (
    BenchmarkRequest,
    BenchmarkResponse,
    ComparisonRequest,
    ComparisonResponse,
    ESGScoreResponse,
    KPIResponse,
    MultiScenarioResponse,
    SimulationAction,
    SimulationRequest,
    SimulationResponse,
)
from app.services.analytics_engine import ESGAnalyticsEngine
from app.services.company_service import CompanyService

router = APIRouter(prefix="/analytics", tags=["ESG Analytics"])


# ─── Helpers ─────────────────────────────────────────────────────────────────

async def _check_access(company_id: UUID, user: User, db: AsyncSession) -> None:
    """Verify user has access to the company. Superadmin bypasses."""
    if user.is_superadmin:
        return
    svc = CompanyService(db)
    role = await svc.get_user_role(company_id, user.id)
    if not role:
        raise PermissionDeniedException("No access to this company")


# ═══════════════════════════════════════════════════════════════════════════════
# 1. ESG SCORING
# ═══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/scores/{company_id}",
    response_model=ESGScoreResponse,
    summary="Compute ESG Scores",
    description="Calculate weighted ESG scores with full sub-indicator breakdown, "
    "data quality assessment, and grade classification.",
)
async def get_esg_scores(
    company_id: UUID,
    year: int = Query(default_factory=lambda: datetime.now().year, ge=2020, le=2030),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ESGScoreResponse:
    await _check_access(company_id, current_user, db)
    engine = ESGAnalyticsEngine(db)
    return await engine.compute_scores(company_id, year)


# ═══════════════════════════════════════════════════════════════════════════════
# 2. BENCHMARK
# ═══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/benchmark/{company_id}",
    response_model=BenchmarkResponse,
    summary="Industry Benchmark Comparison",
    description="Compare company ESG scores against industry averages and "
    "best-in-class performers. Returns classification (lagging → leading) "
    "and gap analysis.",
)
async def get_benchmark(
    company_id: UUID,
    year: int = Query(default_factory=lambda: datetime.now().year, ge=2020, le=2030),
    sector: str | None = Query(default=None, description="Override company sector for benchmark"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BenchmarkResponse:
    await _check_access(company_id, current_user, db)
    engine = ESGAnalyticsEngine(db)
    return await engine.compute_benchmark(company_id, year, sector)


# ═══════════════════════════════════════════════════════════════════════════════
# 3. KPI GENERATOR
# ═══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/kpis/{company_id}",
    response_model=KPIResponse,
    summary="Generate ESG KPIs",
    description="Generate prioritized KPI recommendations targeting the weakest "
    "ESG areas. Includes short-term (3mo), mid-term (6mo), and long-term (12mo) targets.",
)
async def get_kpis(
    company_id: UUID,
    year: int = Query(default_factory=lambda: datetime.now().year, ge=2020, le=2030),
    max_kpis: int = Query(default=10, ge=1, le=30, description="Maximum KPIs to generate"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> KPIResponse:
    await _check_access(company_id, current_user, db)
    engine = ESGAnalyticsEngine(db)
    return await engine.generate_kpis(company_id, year, max_kpis)


# ═══════════════════════════════════════════════════════════════════════════════
# 4. WHAT-IF SIMULATION
# ═══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/simulate/{company_id}",
    response_model=SimulationResponse,
    summary="What-If Simulation",
    description="Simulate the impact of specific ESG improvement actions. "
    "Returns before/after scores, deltas, and grade changes.",
)
async def simulate_actions(
    company_id: UUID,
    request: SimulationRequest,
    year: int = Query(default_factory=lambda: datetime.now().year, ge=2020, le=2030),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SimulationResponse:
    await _check_access(company_id, current_user, db)
    engine = ESGAnalyticsEngine(db)
    return await engine.simulate_actions(company_id, year, request.actions)


# ═══════════════════════════════════════════════════════════════════════════════
# 5. MULTI-SCENARIO SIMULATION
# ═══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/scenarios/{company_id}",
    response_model=MultiScenarioResponse,
    summary="Multi-Scenario Projection",
    description="Simulate 3 improvement scenarios (conservative, moderate, aggressive) "
    "with projected scores, timelines, and investment levels.",
)
async def get_scenarios(
    company_id: UUID,
    year: int = Query(default_factory=lambda: datetime.now().year, ge=2020, le=2030),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MultiScenarioResponse:
    await _check_access(company_id, current_user, db)
    engine = ESGAnalyticsEngine(db)
    return await engine.simulate_scenarios(company_id, year)


# ═══════════════════════════════════════════════════════════════════════════════
# 6. COMPANY COMPARISON
# ═══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/compare",
    response_model=ComparisonResponse,
    summary="Compare Companies",
    description="Compare multiple companies side-by-side with score rankings, "
    "strengths/weaknesses analysis, and category winners.",
)
async def compare_companies(
    request: ComparisonRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ComparisonResponse:
    # Check access for each company
    for cid in request.company_ids:
        await _check_access(cid, current_user, db)
    engine = ESGAnalyticsEngine(db)
    return await engine.compare_companies(request.company_ids, request.year)
