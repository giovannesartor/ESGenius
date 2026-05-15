"""
Climate Risk Engine — NGFS / IEA scenarios.

Computes Climate Value-at-Risk per company, decomposed into:
  * Physical risk (acute + chronic) — modeled by sector × geography exposure
  * Transition risk (policy + technology + market) — modeled by carbon footprint
    × scenario carbon price

Scenarios supported (MVP table-driven, swappable for full NGFS Phase IV later):
  NGFS_NZE2050  — Net Zero 2050 (orderly)         carbon $130 by 2030, $250 by 2040
  NGFS_DELAYED  — Delayed transition (disorderly) carbon $0 till 2030, then $400
  NGFS_HOTHOUSE — Current Policies (hot-house)    carbon ~$30, +3°C physical risk
  IEA_STEPS     — Stated Policies                 carbon ~$70, partial alignment
  IEA_NZE       — Net Zero by 2050                carbon $200 by 2030

Output is calibrated for explainability: every figure shows its inputs.
"""

from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.company import Company
from app.domain.models.financial import ClimateScenarioResult
from app.domain.models.regulatory import CarbonEmission

logger = logging.getLogger(__name__)


# Carbon price USD / tCO2e per scenario per horizon year
CARBON_PRICE_PATH: dict[str, dict[int, float]] = {
    "NGFS_NZE2050":  {1: 80,  5: 130, 10: 200},
    "NGFS_DELAYED":  {1: 0,   5: 0,   10: 400},
    "NGFS_HOTHOUSE": {1: 25,  5: 30,  10: 35},
    "IEA_STEPS":     {1: 40,  5: 70,  10: 100},
    "IEA_NZE":       {1: 100, 5: 200, 10: 250},
}

# Physical risk multiplier by scenario (fraction of revenue at risk per year, sector-blind baseline)
PHYSICAL_RISK_MULT: dict[str, float] = {
    "NGFS_NZE2050":  0.005,
    "NGFS_DELAYED":  0.012,
    "NGFS_HOTHOUSE": 0.030,
    "IEA_STEPS":     0.018,
    "IEA_NZE":       0.006,
}

# Sector physical exposure factor (1.0 = average)
SECTOR_PHYSICAL_FACTOR: dict[str, float] = {
    "agriculture": 2.5, "mining": 1.8, "energy": 1.6, "utilities": 1.5,
    "manufacturing": 1.0, "transportation": 1.4, "real_estate": 1.7,
    "retail": 0.7, "finance": 0.5, "technology": 0.4, "healthcare": 0.6,
}

# Sector transition exposure multiplier (1.0 = average emitter)
SECTOR_TRANSITION_FACTOR: dict[str, float] = {
    "energy": 2.5, "mining": 2.0, "utilities": 2.2, "manufacturing": 1.5,
    "transportation": 1.8, "agriculture": 1.6, "real_estate": 0.9,
    "finance": 0.6, "technology": 0.5, "retail": 0.8, "healthcare": 0.6,
}


VALID_SCENARIOS = list(CARBON_PRICE_PATH.keys())
VALID_HORIZONS = [1, 5, 10]


class ClimateRiskService:
    @staticmethod
    async def _company_emissions_tco2e(db: AsyncSession, company_id: UUID) -> float:
        rows = await db.execute(
            select(CarbonEmission).where(CarbonEmission.company_id == company_id)
        )
        emissions = rows.scalars().all()
        if not emissions:
            return 0.0
        # latest year wins
        latest_year = max(e.year for e in emissions)
        latest = [e for e in emissions if e.year == latest_year]
        return sum(e.co2e_kg for e in latest) / 1000.0

    @classmethod
    async def compute(
        cls,
        db: AsyncSession,
        company: Company,
        scenario: str,
        horizon_years: int,
        revenue_usd: float | None = None,
        *,
        persist: bool = True,
    ) -> ClimateScenarioResult:
        if scenario not in CARBON_PRICE_PATH:
            raise ValueError(f"Unsupported scenario {scenario}; choose one of {VALID_SCENARIOS}")
        if horizon_years not in VALID_HORIZONS:
            raise ValueError(f"horizon_years must be one of {VALID_HORIZONS}")

        carbon_price = CARBON_PRICE_PATH[scenario][horizon_years]
        sector = (company.sector or "manufacturing").lower()
        trans_mult = SECTOR_TRANSITION_FACTOR.get(sector, 1.0)
        phys_mult = SECTOR_PHYSICAL_FACTOR.get(sector, 1.0)

        # Transition risk = Scope1+2 emissions * carbon price * sector multiplier
        emissions_tco2e = await cls._company_emissions_tco2e(db, company.id)
        transition_var = emissions_tco2e * carbon_price * trans_mult * (horizon_years / 5.0)

        # Physical risk = revenue * physical_mult * sector_factor (cumulative over horizon)
        # If no revenue provided, estimate from company size buckets
        rev = revenue_usd or _estimate_revenue(company)
        physical_var = rev * PHYSICAL_RISK_MULT[scenario] * phys_mult * horizon_years

        total_var = transition_var + physical_var
        ebitda_at_risk_pct = round(min(100.0, (total_var / max(rev * 0.15, 1.0)) * 100), 2)

        result = ClimateScenarioResult(
            company_id=company.id,
            scenario=scenario,
            horizon_years=horizon_years,
            physical_var=round(physical_var, 2),
            transition_var=round(transition_var, 2),
            total_var=round(total_var, 2),
            ebitda_at_risk_pct=ebitda_at_risk_pct,
            carbon_price_assumed=carbon_price,
            exposed_assets={
                "sector": sector,
                "physical_factor": phys_mult,
                "transition_factor": trans_mult,
                "scope_1_2_emissions_tco2e": emissions_tco2e,
            },
            methodology={
                "version": "v1-mvp",
                "scenario_family": scenario.split("_")[0],
                "carbon_price_path": CARBON_PRICE_PATH[scenario],
                "physical_mult": PHYSICAL_RISK_MULT[scenario],
                "revenue_used_usd": rev,
                "formula": "transition_var = emissions * carbon_price * sector_mult * h/5; physical_var = revenue * mult * sector * h",
                "references": ["NGFS Phase III scenarios", "IEA WEO 2024"],
            },
        )
        if persist:
            db.add(result)
            await db.commit()
            await db.refresh(result)
        return result

    @classmethod
    async def compute_all_scenarios(
        cls, db: AsyncSession, company: Company, horizon_years: int = 5
    ) -> list[ClimateScenarioResult]:
        results = []
        for sc in VALID_SCENARIOS:
            results.append(await cls.compute(db, company, sc, horizon_years))
        return results


def _estimate_revenue(company: Company) -> float:
    size = (getattr(company, "size", "") or "").lower()
    return {
        "small": 5_000_000.0,
        "medium": 50_000_000.0,
        "large": 500_000_000.0,
        "enterprise": 5_000_000_000.0,
    }.get(size, 50_000_000.0)


def list_scenarios() -> list[dict[str, Any]]:
    return [
        {"code": k, "carbon_price_path": v, "physical_risk_mult": PHYSICAL_RISK_MULT[k]}
        for k, v in CARBON_PRICE_PATH.items()
    ]
