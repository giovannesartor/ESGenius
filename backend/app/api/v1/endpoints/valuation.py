"""Valuation Impact API."""

from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.core.exceptions import PermissionDeniedException
from app.domain.models.user import User
from app.services.company_service import CompanyService
from app.services.valuation_impact_service import (
    ValuationImpactService,
    sensitivity_table,
)

router = APIRouter(prefix="/companies/{company_id}/valuation", tags=["Valuation"])


async def _check_access(company_id: UUID, user: User, db: AsyncSession) -> None:
    if user.is_superadmin:
        return
    role = await CompanyService(db).get_user_role(company_id, user.id)
    if not role:
        raise PermissionDeniedException("No access to this company")


class ValuationRequest(BaseModel):
    base_wacc: float = Field(0.085, gt=0, lt=0.5)
    base_beta: float = Field(1.0, gt=0, lt=5)
    base_terminal_growth: float = Field(0.025, ge=0, lt=0.1)
    free_cash_flow_usd: float = Field(10_000_000.0, gt=0)
    debt_to_value: float = Field(0.30, ge=0, le=0.95)
    equity_risk_premium: float = Field(0.055, gt=0, lt=0.2)
    explicit_score: float | None = Field(default=None, ge=0, le=100)


@router.post("/compute")
async def compute(
    company_id: UUID,
    payload: ValuationRequest = Body(default_factory=ValuationRequest),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_access(company_id, current_user, db)
    company = await CompanyService(db).get_by_id(company_id)
    if not company:
        raise HTTPException(404, "Company not found")
    rec = await ValuationImpactService.compute(
        db, company, **payload.model_dump()
    )
    return _serialize(rec)


@router.get("/sensitivity")
async def sensitivity(
    company_id: UUID,
    base_wacc: float = 0.085,
    free_cash_flow_usd: float = 10_000_000.0,
    growth: float = 0.025,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_access(company_id, current_user, db)
    return {"items": sensitivity_table(base_wacc, free_cash_flow_usd, growth)}


def _serialize(r) -> dict:
    return {
        "id": str(r.id),
        "company_id": str(r.company_id),
        "base_wacc": r.base_wacc,
        "esg_adjusted_wacc": r.esg_adjusted_wacc,
        "base_beta": r.base_beta,
        "esg_adjusted_beta": r.esg_adjusted_beta,
        "base_terminal_growth": r.base_terminal_growth,
        "esg_adjusted_terminal_growth": r.esg_adjusted_terminal_growth,
        "base_enterprise_value_usd": r.base_enterprise_value_usd,
        "esg_adjusted_enterprise_value_usd": r.esg_adjusted_enterprise_value_usd,
        "delta_pct": r.delta_pct,
        "inputs": r.inputs,
        "methodology": r.methodology,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }
