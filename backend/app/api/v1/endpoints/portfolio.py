"""Portfolio Intelligence API (buy-side)."""

from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.core.exceptions import PermissionDeniedException
from app.domain.models.user import User
from app.services.company_service import CompanyService
from app.services.portfolio_service import PortfolioService

router = APIRouter(prefix="/companies/{company_id}/portfolios", tags=["Portfolio Intelligence"])


async def _check_access(company_id: UUID, user: User, db: AsyncSession) -> None:
    if user.is_superadmin:
        return
    role = await CompanyService(db).get_user_role(company_id, user.id)
    if not role:
        raise PermissionDeniedException("No access to this company")


class PortfolioCreate(BaseModel):
    name: str
    description: str | None = None
    aum_usd: float | None = None
    base_currency: str = "USD"
    portfolio_type: str = "equity"


class HoldingCreate(BaseModel):
    company_name: str
    company_id: UUID | None = None
    ticker: str | None = None
    sector: str | None = None
    country: str | None = None
    weight_pct: float = Field(ge=0, le=100)
    market_value_usd: float | None = None


@router.get("")
async def list_portfolios(
    company_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_access(company_id, current_user, db)
    items = await PortfolioService.list_portfolios(db, company_id)
    return {"items": [_serialize_portfolio(p) for p in items]}


@router.post("")
async def create_portfolio(
    company_id: UUID,
    payload: PortfolioCreate = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_access(company_id, current_user, db)
    p = await PortfolioService.create_portfolio(db, company_id, payload.model_dump())
    return _serialize_portfolio(p)


@router.get("/{portfolio_id}/holdings")
async def list_holdings(
    company_id: UUID,
    portfolio_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_access(company_id, current_user, db)
    items = await PortfolioService.list_holdings(db, portfolio_id)
    return {"items": [_serialize_holding(h) for h in items]}


@router.post("/{portfolio_id}/holdings")
async def add_holding(
    company_id: UUID,
    portfolio_id: UUID,
    payload: HoldingCreate = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_access(company_id, current_user, db)
    h = await PortfolioService.add_holding(db, portfolio_id, payload.model_dump())
    return _serialize_holding(h)


@router.delete("/{portfolio_id}/holdings/{holding_id}")
async def remove_holding(
    company_id: UUID,
    portfolio_id: UUID,
    holding_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_access(company_id, current_user, db)
    ok = await PortfolioService.remove_holding(db, holding_id)
    if not ok:
        raise HTTPException(404, "Holding not found")
    return {"deleted": True}


@router.post("/{portfolio_id}/refresh")
async def refresh(
    company_id: UUID,
    portfolio_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_access(company_id, current_user, db)
    n = await PortfolioService.refresh_holding_scores(db, portfolio_id)
    return {"updated": n}


@router.get("/{portfolio_id}/aggregate")
async def aggregate(
    company_id: UUID,
    portfolio_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_access(company_id, current_user, db)
    return await PortfolioService.aggregate(db, portfolio_id)


def _serialize_portfolio(p) -> dict:
    return {
        "id": str(p.id),
        "owner_company_id": str(p.owner_company_id),
        "name": p.name,
        "description": p.description,
        "aum_usd": p.aum_usd,
        "base_currency": p.base_currency,
        "portfolio_type": p.portfolio_type,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


def _serialize_holding(h) -> dict:
    return {
        "id": str(h.id),
        "portfolio_id": str(h.portfolio_id),
        "company_name": h.company_name,
        "company_id": str(h.company_id) if h.company_id else None,
        "ticker": h.ticker,
        "sector": h.sector,
        "country": h.country,
        "weight_pct": h.weight_pct,
        "market_value_usd": h.market_value_usd,
        "last_esg_score": h.last_esg_score,
        "last_climate_var_pct": h.last_climate_var_pct,
        "last_controversy_count": h.last_controversy_count,
        "last_refreshed_at": h.last_refreshed_at.isoformat() if h.last_refreshed_at else None,
    }
