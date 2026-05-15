"""ESG Financial Intelligence API — Score, bps translation, drivers."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.core.exceptions import PermissionDeniedException
from app.domain.models.user import User
from app.services.company_service import CompanyService
from app.services.financial_score_service import (
    FinancialScoreService,
    spread_bps_from_score,
    rating_band,
)

router = APIRouter(prefix="/companies/{company_id}/financial-score", tags=["Financial Intelligence"])


async def _check_access(company_id: UUID, user: User, db: AsyncSession) -> None:
    if user.is_superadmin:
        return
    role = await CompanyService(db).get_user_role(company_id, user.id)
    if not role:
        raise PermissionDeniedException("No access to this company")


@router.post("/compute")
async def compute_score(
    company_id: UUID,
    year: int | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_access(company_id, current_user, db)
    company = await CompanyService(db).get_by_id(company_id)
    if not company:
        raise HTTPException(404, "Company not found")
    yr = year or datetime.now(timezone.utc).year
    score = await FinancialScoreService.compute(db, company, yr)
    return _serialize(score)


@router.get("/latest")
async def latest_score(
    company_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_access(company_id, current_user, db)
    score = await FinancialScoreService.latest_for_company(db, company_id)
    if not score:
        return {"score": None, "message": "No score yet — run /compute first."}
    return _serialize(score)


@router.get("/history")
async def history(
    company_id: UUID,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_access(company_id, current_user, db)
    scores = await FinancialScoreService.history(db, company_id, limit)
    return {"items": [_serialize(s) for s in scores]}


@router.get("/translate")
async def translate_score_to_bps(score: float):
    """Public translator: any score -> bps + rating band. No auth needed (read-only math)."""
    return {
        "score": score,
        "spread_bps": spread_bps_from_score(score),
        "rating_band": rating_band(score),
        "interpretation": (
            "Negative bps = financing discount available; positive = premium required."
        ),
    }


def _serialize(s) -> dict:
    return {
        "id": str(s.id),
        "company_id": str(s.company_id),
        "year": s.year,
        "score": s.score,
        "components": {
            "performance": s.performance_score,
            "disclosure": s.disclosure_score,
            "forward_risk": s.forward_risk_score,
        },
        "spread_bps": s.spread_bps,
        "wacc_adjustment_bps": s.wacc_adjustment_bps,
        "rating_band": s.rating_band,
        "sector": s.sector,
        "sector_percentile": s.sector_percentile,
        "drivers": s.drivers,
        "explainability": s.explainability,
        "methodology_version": s.methodology_version,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }
