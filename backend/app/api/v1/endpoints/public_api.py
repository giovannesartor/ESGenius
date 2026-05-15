"""
Public API v1 — API-key-authenticated endpoints for partners.

These endpoints back the published `https://api.esg360.digital/public/v1/...`
surface used by treasury systems, data vendors and embedded widgets.

Authentication: `Authorization: Bearer <api_key>` where api_key matches a
hashed value in the `api_keys` table. Scopes restrict access.
"""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Path
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domain.models.webhook import ApiKey
from app.services.financial_score_service import FinancialScoreService
from app.services.climate_risk_service import ClimateRiskService
from app.services.company_service import CompanyService

router = APIRouter(prefix="/public/v1", tags=["Public API"])


async def _resolve_api_key(authorization: str | None, db: AsyncSession) -> ApiKey:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Missing API key")
    raw = authorization.split(" ", 1)[1].strip()
    digest = hashlib.sha256(raw.encode()).hexdigest()
    rows = await db.execute(
        select(ApiKey).where(ApiKey.key_hash == digest, ApiKey.is_active.is_(True))
    )
    key = rows.scalar_one_or_none()
    if not key:
        raise HTTPException(401, "Invalid API key")
    if key.expires_at and key.expires_at < datetime.now(timezone.utc):
        raise HTTPException(401, "API key expired")
    key.last_used_at = datetime.now(timezone.utc)
    await db.commit()
    return key


def _require_scope(key: ApiKey, scope: str) -> None:
    if scope not in (key.scopes or []) and "*" not in (key.scopes or []):
        raise HTTPException(403, f"Missing scope: {scope}")


@router.get("/companies/{company_id}/financial-score")
async def public_financial_score(
    company_id: UUID = Path(...),
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    key = await _resolve_api_key(authorization, db)
    _require_scope(key, "read:financial_score")

    score = await FinancialScoreService.latest_for_company(db, company_id)
    if not score:
        raise HTTPException(404, "No score available")
    return {
        "company_id": str(company_id),
        "score": score.score,
        "rating_band": score.rating_band,
        "spread_bps": score.spread_bps,
        "components": {
            "performance": score.performance_score,
            "disclosure": score.disclosure_score,
            "forward_risk": score.forward_risk_score,
        },
        "year": score.year,
        "methodology_version": score.methodology_version,
        "as_of": score.created_at.isoformat() if score.created_at else None,
    }


@router.get("/companies/{company_id}/climate-risk")
async def public_climate_risk(
    company_id: UUID,
    scenario: str = "NGFS_DELAYED",
    horizon_years: int = 5,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    key = await _resolve_api_key(authorization, db)
    _require_scope(key, "read:climate_risk")
    company = await CompanyService(db).get_by_id(company_id)
    if not company:
        raise HTTPException(404, "Company not found")
    try:
        result = await ClimateRiskService.compute(db, company, scenario, horizon_years, persist=False)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return {
        "company_id": str(company_id),
        "scenario": scenario,
        "horizon_years": horizon_years,
        "physical_var_usd": result.physical_var,
        "transition_var_usd": result.transition_var,
        "total_var_usd": result.total_var,
        "ebitda_at_risk_pct": result.ebitda_at_risk_pct,
        "carbon_price_usd_per_tco2e": result.carbon_price_assumed,
    }


@router.get("/health")
async def health():
    return {"status": "ok", "service": "esg360-public-api", "version": "v1"}
