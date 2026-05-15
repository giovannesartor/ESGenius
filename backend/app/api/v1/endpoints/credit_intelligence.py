"""Credit Intelligence API (lender-side)."""

from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.core.exceptions import PermissionDeniedException
from app.domain.models.user import User
from app.services.company_service import CompanyService
from app.services.credit_intelligence_service import (
    CreditIntelligenceService,
    book_provision_impact,
)

router = APIRouter(prefix="/companies/{company_id}/credit-intelligence", tags=["Credit Intelligence"])


async def _check_access(company_id: UUID, user: User, db: AsyncSession) -> None:
    if user.is_superadmin:
        return
    role = await CompanyService(db).get_user_role(company_id, user.id)
    if not role:
        raise PermissionDeniedException("No access to this company")


class AssessmentRequest(BaseModel):
    counterparty_name: str
    base_pd: float = Field(ge=0.0001, le=0.5, description="Base PD as decimal (0.05 = 5%)")
    base_lgd: float | None = Field(default=None, ge=0.05, le=0.95)
    exposure_usd: float | None = None
    counterparty_company_id: UUID | None = None
    explicit_esg_score: float | None = Field(default=None, ge=0, le=100)


@router.post("/assess")
async def assess(
    company_id: UUID,
    payload: AssessmentRequest = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_access(company_id, current_user, db)
    owner = await CompanyService(db).get_by_id(company_id)
    if not owner:
        raise HTTPException(404, "Company not found")
    rec = await CreditIntelligenceService.assess(
        db,
        owner_company=owner,
        counterparty_name=payload.counterparty_name,
        base_pd=payload.base_pd,
        base_lgd=payload.base_lgd,
        exposure_usd=payload.exposure_usd,
        counterparty_company_id=payload.counterparty_company_id,
        explicit_esg_score=payload.explicit_esg_score,
    )
    return _serialize(rec)


@router.get("")
async def list_assessments(
    company_id: UUID,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_access(company_id, current_user, db)
    items = await CreditIntelligenceService.list_for_owner(db, company_id, limit)
    return {
        "items": [_serialize(i) for i in items],
        "book_impact": book_provision_impact(items),
    }


def _serialize(r) -> dict:
    return {
        "id": str(r.id),
        "owner_company_id": str(r.owner_company_id),
        "counterparty_name": r.counterparty_name,
        "counterparty_company_id": str(r.counterparty_company_id) if r.counterparty_company_id else None,
        "base_pd": r.base_pd,
        "esg_adjustment_bps": r.esg_adjustment_bps,
        "adjusted_pd": r.adjusted_pd,
        "base_lgd": r.base_lgd,
        "adjusted_lgd": r.adjusted_lgd,
        "exposure_usd": r.exposure_usd,
        "rationale": r.rationale,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }
