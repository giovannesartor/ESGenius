"""Funding Readiness API."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.core.exceptions import PermissionDeniedException
from app.domain.models.user import User
from app.services.company_service import CompanyService
from app.services.funding_readiness_service import (
    FundingReadinessService,
    list_instruments,
)

router = APIRouter(prefix="/companies/{company_id}/funding-readiness", tags=["Funding Readiness"])


async def _check_access(company_id: UUID, user: User, db: AsyncSession) -> None:
    if user.is_superadmin:
        return
    role = await CompanyService(db).get_user_role(company_id, user.id)
    if not role:
        raise PermissionDeniedException("No access to this company")


@router.get("/instruments")
async def instruments():
    return {"instruments": list_instruments()}


@router.post("/assess")
async def assess(
    company_id: UUID,
    instrument: str = Query(..., description="SLL | GREEN_BOND | IPO_ESG | M&A | PE"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_access(company_id, current_user, db)
    company = await CompanyService(db).get_by_id(company_id)
    if not company:
        raise HTTPException(404, "Company not found")
    try:
        result = await FundingReadinessService.assess(db, company, instrument)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return _serialize(result)


def _serialize(r) -> dict:
    return {
        "id": str(r.id),
        "company_id": str(r.company_id),
        "instrument": r.instrument,
        "overall_score": r.overall_score,
        "status": r.status,
        "checklist": r.checklist,
        "gaps": r.gaps,
        "remediation_plan": r.remediation_plan,
        "estimated_pricing_benefit_bps": r.estimated_pricing_benefit_bps,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }
