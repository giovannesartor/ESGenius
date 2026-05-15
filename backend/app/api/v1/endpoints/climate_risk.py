"""Climate Risk API — NGFS / IEA scenarios."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.core.exceptions import PermissionDeniedException
from app.domain.models.user import User
from app.services.climate_risk_service import (
    ClimateRiskService,
    list_scenarios,
    VALID_SCENARIOS,
)
from app.services.company_service import CompanyService

router = APIRouter(prefix="/companies/{company_id}/climate-risk", tags=["Climate Risk"])


async def _check_access(company_id: UUID, user: User, db: AsyncSession) -> None:
    if user.is_superadmin:
        return
    role = await CompanyService(db).get_user_role(company_id, user.id)
    if not role:
        raise PermissionDeniedException("No access to this company")


@router.get("/scenarios")
async def get_scenarios():
    return {"scenarios": list_scenarios()}


@router.post("/compute")
async def compute(
    company_id: UUID,
    scenario: str = Query(..., description=f"One of {VALID_SCENARIOS}"),
    horizon_years: int = Query(5, ge=1, le=10),
    revenue_usd: float | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_access(company_id, current_user, db)
    company = await CompanyService(db).get_by_id(company_id)
    if not company:
        raise HTTPException(404, "Company not found")
    try:
        result = await ClimateRiskService.compute(db, company, scenario, horizon_years, revenue_usd)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return _serialize(result)


@router.post("/compute-all")
async def compute_all(
    company_id: UUID,
    horizon_years: int = Query(5, ge=1, le=10),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_access(company_id, current_user, db)
    company = await CompanyService(db).get_by_id(company_id)
    if not company:
        raise HTTPException(404, "Company not found")
    results = await ClimateRiskService.compute_all_scenarios(db, company, horizon_years)
    return {"items": [_serialize(r) for r in results]}


def _serialize(r) -> dict:
    return {
        "id": str(r.id),
        "company_id": str(r.company_id),
        "scenario": r.scenario,
        "horizon_years": r.horizon_years,
        "physical_var": r.physical_var,
        "transition_var": r.transition_var,
        "total_var": r.total_var,
        "ebitda_at_risk_pct": r.ebitda_at_risk_pct,
        "carbon_price_assumed": r.carbon_price_assumed,
        "exposed_assets": r.exposed_assets,
        "methodology": r.methodology,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }
