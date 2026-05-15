"""
Valuation Impact service — translates ESG into WACC and DCF deltas.

Method (transparent v1):
  spread_bps          = spread_bps_from_score(score)        # neg = better
  cost_of_debt_delta  = spread_bps / 10000                   # decimal (e.g. -22bps -> -0.0022)
  beta_delta          = -0.05 if score >= 70 else (+0.05 if score < 40 else 0)
  cost_of_equity_delta= beta_delta * equity_risk_premium
  wacc_delta          = (D/V) * cost_of_debt_delta + (E/V) * cost_of_equity_delta
  enterprise_value    = sum_of_DCF(fcf, wacc, growth)        # Gordon terminal

Defaults can be overridden by user inputs.
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.company import Company
from app.domain.models.financial import ValuationImpact
from app.services.financial_score_service import (
    FinancialScoreService,
    spread_bps_from_score,
)


def _gordon_dcf(
    free_cash_flow_usd: float,
    wacc: float,
    growth: float,
    forecast_years: int = 5,
    fcf_growth: float = 0.03,
) -> float:
    """Two-stage DCF with Gordon terminal."""
    if wacc <= growth:
        wacc = growth + 0.005
    pv = 0.0
    fcf = free_cash_flow_usd
    for t in range(1, forecast_years + 1):
        fcf = fcf * (1 + fcf_growth)
        pv += fcf / ((1 + wacc) ** t)
    terminal_fcf = fcf * (1 + growth)
    terminal_value = terminal_fcf / (wacc - growth)
    pv += terminal_value / ((1 + wacc) ** forecast_years)
    return pv


class ValuationImpactService:
    @classmethod
    async def compute(
        cls,
        db: AsyncSession,
        company: Company,
        *,
        base_wacc: float = 0.085,
        base_beta: float = 1.0,
        base_terminal_growth: float = 0.025,
        free_cash_flow_usd: float = 10_000_000.0,
        debt_to_value: float = 0.30,
        equity_risk_premium: float = 0.055,
        explicit_score: float | None = None,
        persist: bool = True,
    ) -> ValuationImpact:
        score_obj = await FinancialScoreService.latest_for_company(db, company.id)
        score = explicit_score if explicit_score is not None else (score_obj.score if score_obj else 50.0)

        spread = spread_bps_from_score(score)
        cod_delta = spread / 10000.0  # decimal

        if score >= 70:
            beta_delta = -0.05
        elif score < 40:
            beta_delta = 0.05
        else:
            beta_delta = 0.0
        adj_beta = base_beta + beta_delta
        coe_delta = beta_delta * equity_risk_premium

        equity_share = 1 - debt_to_value
        wacc_delta = debt_to_value * cod_delta + equity_share * coe_delta
        adj_wacc = max(0.02, base_wacc + wacc_delta)

        # Terminal growth: small uplift for top performers (innovation/optionality)
        if score >= 80:
            terminal_delta = 0.003
        elif score < 30:
            terminal_delta = -0.003
        else:
            terminal_delta = 0.0
        adj_growth = max(0.0, base_terminal_growth + terminal_delta)

        base_ev = _gordon_dcf(free_cash_flow_usd, base_wacc, base_terminal_growth)
        adj_ev = _gordon_dcf(free_cash_flow_usd, adj_wacc, adj_growth)
        delta_pct = round(((adj_ev / base_ev) - 1) * 100, 2) if base_ev else 0.0

        record = ValuationImpact(
            company_id=company.id,
            base_wacc=base_wacc,
            esg_adjusted_wacc=round(adj_wacc, 5),
            base_beta=base_beta,
            esg_adjusted_beta=round(adj_beta, 3),
            base_terminal_growth=base_terminal_growth,
            esg_adjusted_terminal_growth=round(adj_growth, 5),
            base_enterprise_value_usd=round(base_ev, 2),
            esg_adjusted_enterprise_value_usd=round(adj_ev, 2),
            delta_pct=delta_pct,
            inputs={
                "score": score,
                "spread_bps": spread,
                "cost_of_debt_delta": cod_delta,
                "beta_delta": beta_delta,
                "cost_of_equity_delta": coe_delta,
                "free_cash_flow_usd": free_cash_flow_usd,
                "debt_to_value": debt_to_value,
                "equity_risk_premium": equity_risk_premium,
            },
            methodology={
                "version": "v1",
                "wacc_formula": "wacc = (D/V)*Kd + (E/V)*Ke; ESG modifies both Kd and beta",
                "dcf_model": "two-stage Gordon (5y forecast + perpetuity)",
                "references": ["Berg, Kölbel, Rigobon 2022", "MSCI ESG-Adjusted DCF guide 2024"],
            },
        )
        if persist:
            db.add(record)
            await db.commit()
            await db.refresh(record)
        return record


def sensitivity_table(
    base_wacc: float, free_cash_flow_usd: float, growth: float = 0.025
) -> list[dict[str, Any]]:
    """Return a small sensitivity table for the UI to plot."""
    rows = []
    for delta_bps in (-100, -50, -25, 0, 25, 50, 100):
        wacc = base_wacc + delta_bps / 10000.0
        ev = _gordon_dcf(free_cash_flow_usd, wacc, growth)
        rows.append({"wacc_delta_bps": delta_bps, "wacc": round(wacc, 5), "enterprise_value_usd": round(ev, 2)})
    return rows
