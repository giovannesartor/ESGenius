"""
Marginal Abatement Cost Curve (MACC) service.

Builds the canonical CFO chart: a sorted bar chart of decarbonization
initiatives, each with abatement potential (tCO2e/yr), cost per tonne (USD,
negative = saving), payback, and CAPEX. The X-axis cumulates abatement; the
Y-axis is cost per tonne.

Reference: McKinsey GHG abatement curve methodology (2009, updated 2023).
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.financial import AbatementOption


async def list_options(db: AsyncSession, company_id: UUID) -> list[AbatementOption]:
    rows = await db.execute(
        select(AbatementOption).where(AbatementOption.company_id == company_id)
    )
    return list(rows.scalars().all())


async def add_option(db: AsyncSession, company_id: UUID, payload: dict[str, Any]) -> AbatementOption:
    opt = AbatementOption(company_id=company_id, **payload)
    db.add(opt)
    await db.commit()
    await db.refresh(opt)
    return opt


async def update_option(
    db: AsyncSession, option_id: UUID, payload: dict[str, Any]
) -> AbatementOption | None:
    rows = await db.execute(select(AbatementOption).where(AbatementOption.id == option_id))
    opt = rows.scalar_one_or_none()
    if not opt:
        return None
    for k, v in payload.items():
        if hasattr(opt, k):
            setattr(opt, k, v)
    await db.commit()
    await db.refresh(opt)
    return opt


async def delete_option(db: AsyncSession, option_id: UUID) -> bool:
    rows = await db.execute(select(AbatementOption).where(AbatementOption.id == option_id))
    opt = rows.scalar_one_or_none()
    if not opt:
        return False
    await db.delete(opt)
    await db.commit()
    return True


def build_curve(options: list[AbatementOption]) -> dict[str, Any]:
    """Returns the data structure the frontend chart consumes."""
    sorted_opts = sorted(options, key=lambda o: o.cost_per_tonne_usd)

    cumulative = 0.0
    bars: list[dict[str, Any]] = []
    total_capex = 0.0
    total_abatement = 0.0
    breakeven_abatement = 0.0

    for o in sorted_opts:
        bar = {
            "id": str(o.id),
            "name": o.name,
            "category": o.category,
            "scope": o.scope,
            "abatement_tco2e": o.abatement_potential_tco2e,
            "cost_per_tonne_usd": o.cost_per_tonne_usd,
            "cumulative_start": cumulative,
            "cumulative_end": cumulative + o.abatement_potential_tco2e,
            "capex_usd": o.capex_usd or 0,
            "payback_years": o.payback_years,
            "implementation_status": o.implementation_status,
        }
        bars.append(bar)
        cumulative += o.abatement_potential_tco2e
        total_capex += o.capex_usd or 0
        total_abatement += o.abatement_potential_tco2e
        if o.cost_per_tonne_usd <= 0:
            breakeven_abatement += o.abatement_potential_tco2e

    avg_cost = (
        sum(o.abatement_potential_tco2e * o.cost_per_tonne_usd for o in sorted_opts) / total_abatement
        if total_abatement
        else 0.0
    )

    return {
        "bars": bars,
        "total_options": len(sorted_opts),
        "total_abatement_tco2e": round(total_abatement, 2),
        "negative_cost_abatement_tco2e": round(breakeven_abatement, 2),
        "weighted_avg_cost_per_tonne_usd": round(avg_cost, 2),
        "total_capex_usd": round(total_capex, 2),
    }
