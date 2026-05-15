"""MACC API."""

from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.core.exceptions import PermissionDeniedException
from app.domain.models.user import User
from app.services.company_service import CompanyService
from app.services.macc_service import (
    add_option,
    build_curve,
    delete_option,
    list_options,
    update_option,
)

router = APIRouter(prefix="/companies/{company_id}/macc", tags=["MACC"])


async def _check_access(company_id: UUID, user: User, db: AsyncSession) -> None:
    if user.is_superadmin:
        return
    role = await CompanyService(db).get_user_role(company_id, user.id)
    if not role:
        raise PermissionDeniedException("No access to this company")


class AbatementOptionPayload(BaseModel):
    name: str
    category: str
    scope: int = Field(ge=1, le=3)
    abatement_potential_tco2e: float = Field(gt=0)
    cost_per_tonne_usd: float
    capex_usd: float | None = None
    opex_delta_usd: float | None = None
    payback_years: float | None = None
    implementation_status: str = "proposed"
    notes: str | None = None


@router.get("")
async def get_macc(
    company_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_access(company_id, current_user, db)
    options = await list_options(db, company_id)
    return {
        "items": [_serialize(o) for o in options],
        "curve": build_curve(options),
    }


@router.post("/options")
async def create_option(
    company_id: UUID,
    payload: AbatementOptionPayload = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_access(company_id, current_user, db)
    opt = await add_option(db, company_id, payload.model_dump())
    return _serialize(opt)


@router.patch("/options/{option_id}")
async def patch_option(
    company_id: UUID,
    option_id: UUID,
    payload: AbatementOptionPayload = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_access(company_id, current_user, db)
    opt = await update_option(db, option_id, payload.model_dump())
    if not opt:
        raise HTTPException(404, "Option not found")
    return _serialize(opt)


@router.delete("/options/{option_id}")
async def remove_option(
    company_id: UUID,
    option_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_access(company_id, current_user, db)
    ok = await delete_option(db, option_id)
    if not ok:
        raise HTTPException(404, "Option not found")
    return {"deleted": True}


def _serialize(o) -> dict:
    return {
        "id": str(o.id),
        "name": o.name,
        "category": o.category,
        "scope": o.scope,
        "abatement_potential_tco2e": o.abatement_potential_tco2e,
        "cost_per_tonne_usd": o.cost_per_tonne_usd,
        "capex_usd": o.capex_usd,
        "opex_delta_usd": o.opex_delta_usd,
        "payback_years": o.payback_years,
        "implementation_status": o.implementation_status,
        "notes": o.notes,
        "created_at": o.created_at.isoformat() if o.created_at else None,
    }
