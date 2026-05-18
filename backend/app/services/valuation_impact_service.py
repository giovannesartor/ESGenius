"""
Valuation Impact service v2 — sector-aware FCFE/DCF with ESG WACC adjustment.

Engine: Valuora v7.1 ported to ESG360 (see app/core/valuation_engine/).

Method:
  1. Fetch live US 10-Year Treasury rate (FRED) for risk-free rate.
  2. Build 5-Factor beta: sector (Damodaran) + size + stage + profitability + liquidity.
     ESG layer: score ≥ 70 → beta −0.05; score < 40 → beta +0.05.
  3. Project FCFE for 5 years (sector NWC/CapEx/D&A, exponential growth decay).
  4. Terminal value = 50/50 Gordon + exit multiple blend (stage-adjusted).
  5. ESG credit spread: spread_bps = −0.8 × (score − 50).
  6. Compare base equity value (no ESG) vs ESG-adjusted to yield delta_pct.
  7. Multiples CCA as parallel sanity check.
  8. Optional Monte Carlo (2000 runs, P5/P50/P95).

References: Berg et al. 2022; ECB WP 2023/2811; Damodaran NYU Stern (2025);
            Dimson 1979 liquidity premium.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.company import Company
from app.domain.models.financial import ValuationImpact
from app.services.financial_score_service import FinancialScoreService
from app.core.valuation_engine.engine import (
    fetch_risk_free_rate,
    run_esg_valuation,
    get_risk_free_rate,
)

# Map company.size → approximate employee count for beta sizing
_SIZE_TO_EMPLOYEES: dict[str, int] = {
    "micro": 5,
    "small": 25,
    "medium": 100,
    "large": 500,
}


class ValuationImpactService:
    @classmethod
    async def compute(
        cls,
        db: AsyncSession,
        company: Company,
        *,
        revenue: float = 5_000_000.0,
        net_margin: float = 0.10,
        growth_rate: float = 0.08,
        debt: float = 0.0,
        cash: float = 0.0,
        years_in_business: int = 5,
        explicit_score: float | None = None,
        refresh_rate: bool = False,
        run_monte_carlo_sim: bool = True,
        persist: bool = True,
    ) -> ValuationImpact:
        """
        Compute ESG-aware valuation impact for a company.

        Parameters
        ----------
        revenue : float
            Annual revenue in USD (default 5M).
        net_margin : float
            Net margin as decimal (default 0.10 = 10%).
        growth_rate : float
            Expected revenue growth rate (default 0.08 = 8%).
        debt : float
            Total financial debt in USD.
        cash : float
            Cash and equivalents in USD.
        years_in_business : int
            Company age (used for stage beta and DLOM).
        explicit_score : float | None
            Override ESG score; otherwise fetched from DB.
        refresh_rate : bool
            If True, re-fetch live FRED rate before computing.
        run_monte_carlo_sim : bool
            If True, run Monte Carlo (adds ~100ms).
        persist : bool
            If True, save record to DB.
        """
        if refresh_rate:
            await fetch_risk_free_rate()

        score_obj = await FinancialScoreService.latest_for_company(db, company.id)
        score = explicit_score if explicit_score is not None else (
            score_obj.score if score_obj else 50.0
        )

        sector = (company.sector or "outros").lower().strip()
        num_employees = _SIZE_TO_EMPLOYEES.get(company.size or "", 0)

        result = run_esg_valuation(
            revenue=revenue,
            net_margin=net_margin,
            sector=sector,
            growth_rate=growth_rate,
            debt=debt,
            cash=cash,
            num_employees=num_employees,
            years_in_business=years_in_business,
            esg_score=score,
            run_monte_carlo_sim=run_monte_carlo_sim,
        )

        base_ke = result["base"]["cost_of_equity"]
        esg_ke = result["esg_adjusted"]["cost_of_equity"]
        base_ev = result["base"]["equity_value"]
        esg_ev = result["esg_adjusted"]["equity_value"]

        record = ValuationImpact(
            company_id=company.id,
            base_wacc=round(base_ke, 5),
            esg_adjusted_wacc=round(esg_ke, 5),
            base_beta=round(result["base"]["coe_detail"]["beta_levered"], 4),
            esg_adjusted_beta=round(result["esg_adjusted"]["coe_detail"]["beta_levered"], 4),
            base_terminal_growth=0.025,
            esg_adjusted_terminal_growth=0.025,
            base_enterprise_value_usd=base_ev,
            esg_adjusted_enterprise_value_usd=esg_ev,
            delta_pct=result["delta_pct"],
            inputs={
                "revenue": revenue,
                "net_margin": net_margin,
                "growth_rate": growth_rate,
                "debt": debt,
                "cash": cash,
                "sector": sector,
                "num_employees": num_employees,
                "years_in_business": years_in_business,
                "esg_score": score,
                "esg_spread_bps": result["esg_spread_bps"],
                "risk_free_rate": result["risk_free_rate"],
            },
            methodology=result["methodology"] | {
                "engine": result["engine_version"],
                "multiples_valuation": result["multiples"]["valuation"],
                "monte_carlo": result.get("monte_carlo"),
            },
        )
        if persist:
            db.add(record)
            await db.commit()
            await db.refresh(record)
        return record

    @classmethod
    async def compute_full(
        cls,
        db: AsyncSession,
        company: Company,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """
        Same as compute() but returns the full engine result dict
        (including FCFE projections, multiples breakdown, Monte Carlo)
        without persisting to DB.
        """
        if kwargs.pop("refresh_rate", False):
            await fetch_risk_free_rate()

        score_obj = await FinancialScoreService.latest_for_company(db, company.id)
        explicit_score = kwargs.pop("explicit_score", None)
        score = explicit_score if explicit_score is not None else (
            score_obj.score if score_obj else 50.0
        )

        sector = (company.sector or "outros").lower().strip()
        num_employees = _SIZE_TO_EMPLOYEES.get(company.size or "", 0)

        return run_esg_valuation(
            revenue=kwargs.get("revenue", 5_000_000.0),
            net_margin=kwargs.get("net_margin", 0.10),
            sector=sector,
            growth_rate=kwargs.get("growth_rate", 0.08),
            debt=kwargs.get("debt", 0.0),
            cash=kwargs.get("cash", 0.0),
            num_employees=num_employees,
            years_in_business=kwargs.get("years_in_business", 5),
            esg_score=score,
            run_monte_carlo_sim=kwargs.get("run_monte_carlo_sim", True),
        )


def sensitivity_table(
    base_ke: float,
    revenue: float,
    net_margin: float,
    sector: str = "outros",
    growth: float = 0.025,
) -> list[dict[str, Any]]:
    """Sensitivity table: equity value vs ESG score deltas, for UI charts."""
    from app.core.valuation_engine.engine import (
        project_fcfe,
        calculate_terminal_value_gordon,
        calculate_equity_value_fcfe,
    )
    rows = []
    for delta_bps in (-100, -50, -25, 0, 25, 50, 100):
        ke = base_ke + delta_bps / 10000.0
        projs = project_fcfe(revenue, net_margin, growth, sector=sector)
        tv = calculate_terminal_value_gordon(projs[-1]["fcf"], ke)
        ev = calculate_equity_value_fcfe(projs, ke, tv["terminal_value"])
        rows.append({
            "ke_delta_bps": delta_bps,
            "ke": round(ke, 5),
            "equity_value_usd": round(ev["equity_value"], 2),
        })
    return rows
