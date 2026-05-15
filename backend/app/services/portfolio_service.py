"""
Portfolio Intelligence (buy-side).

Aggregates per-holding ESG metrics into a portfolio-level view used by funds,
banks and asset managers (the "Finance" door of ESG360).
"""

from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.financial import (
    Portfolio,
    PortfolioHolding,
    ESGFinancialScore,
    ClimateScenarioResult,
)
from app.services.financial_score_service import (
    aggregate_portfolio_score,
    spread_bps_from_score,
)

logger = logging.getLogger(__name__)


class PortfolioService:
    @staticmethod
    async def list_portfolios(db: AsyncSession, owner_company_id: UUID) -> list[Portfolio]:
        rows = await db.execute(
            select(Portfolio).where(Portfolio.owner_company_id == owner_company_id)
        )
        return list(rows.scalars().all())

    @staticmethod
    async def get_portfolio(db: AsyncSession, portfolio_id: UUID) -> Portfolio | None:
        rows = await db.execute(select(Portfolio).where(Portfolio.id == portfolio_id))
        return rows.scalar_one_or_none()

    @staticmethod
    async def create_portfolio(
        db: AsyncSession, owner_company_id: UUID, payload: dict[str, Any]
    ) -> Portfolio:
        p = Portfolio(owner_company_id=owner_company_id, **payload)
        db.add(p)
        await db.commit()
        await db.refresh(p)
        return p

    @staticmethod
    async def add_holding(
        db: AsyncSession, portfolio_id: UUID, payload: dict[str, Any]
    ) -> PortfolioHolding:
        h = PortfolioHolding(portfolio_id=portfolio_id, **payload)
        db.add(h)
        await db.commit()
        await db.refresh(h)
        return h

    @staticmethod
    async def list_holdings(db: AsyncSession, portfolio_id: UUID) -> list[PortfolioHolding]:
        rows = await db.execute(
            select(PortfolioHolding).where(PortfolioHolding.portfolio_id == portfolio_id)
        )
        return list(rows.scalars().all())

    @staticmethod
    async def remove_holding(db: AsyncSession, holding_id: UUID) -> bool:
        rows = await db.execute(select(PortfolioHolding).where(PortfolioHolding.id == holding_id))
        h = rows.scalar_one_or_none()
        if not h:
            return False
        await db.delete(h)
        await db.commit()
        return True

    @classmethod
    async def refresh_holding_scores(
        cls, db: AsyncSession, portfolio_id: UUID
    ) -> int:
        """Pulls latest ESGFinancialScore + ClimateScenarioResult into holding cache."""
        holdings = await cls.list_holdings(db, portfolio_id)
        from datetime import datetime, timezone
        updated = 0
        for h in holdings:
            if not h.company_id:
                continue
            score_rows = await db.execute(
                select(ESGFinancialScore)
                .where(ESGFinancialScore.company_id == h.company_id)
                .order_by(ESGFinancialScore.year.desc())
                .limit(1)
            )
            score = score_rows.scalar_one_or_none()
            if score:
                h.last_esg_score = score.score

            climate_rows = await db.execute(
                select(ClimateScenarioResult)
                .where(
                    ClimateScenarioResult.company_id == h.company_id,
                    ClimateScenarioResult.scenario == "NGFS_DELAYED",
                    ClimateScenarioResult.horizon_years == 5,
                )
                .order_by(ClimateScenarioResult.created_at.desc())
                .limit(1)
            )
            climate = climate_rows.scalar_one_or_none()
            if climate:
                h.last_climate_var_pct = climate.ebitda_at_risk_pct

            h.last_refreshed_at = datetime.now(timezone.utc)
            updated += 1
        await db.commit()
        return updated

    @classmethod
    async def aggregate(cls, db: AsyncSession, portfolio_id: UUID) -> dict[str, Any]:
        portfolio = await cls.get_portfolio(db, portfolio_id)
        if not portfolio:
            return {}
        holdings = await cls.list_holdings(db, portfolio_id)

        weighted_score = aggregate_portfolio_score(
            ((h.weight_pct, h.last_esg_score) for h in holdings)
        )
        weighted_climate_var = (
            sum(h.weight_pct * (h.last_climate_var_pct or 0) for h in holdings) /
            (sum(h.weight_pct for h in holdings) or 1)
        )
        weighted_spread_bps = spread_bps_from_score(weighted_score) if weighted_score else 0

        # Attribution (top contributors to score)
        attribution = []
        for h in holdings:
            if h.last_esg_score is None:
                continue
            contribution = h.weight_pct * (h.last_esg_score - weighted_score)
            attribution.append({
                "company_name": h.company_name,
                "ticker": h.ticker,
                "weight_pct": h.weight_pct,
                "esg_score": h.last_esg_score,
                "contribution": round(contribution, 2),
                "climate_var_pct": h.last_climate_var_pct,
            })
        attribution.sort(key=lambda x: x["contribution"], reverse=True)

        # Sector breakdown
        sectors: dict[str, dict[str, float]] = {}
        for h in holdings:
            sec = h.sector or "unknown"
            slot = sectors.setdefault(sec, {"weight": 0, "score_w": 0, "score_basis": 0})
            slot["weight"] += h.weight_pct
            if h.last_esg_score is not None:
                slot["score_w"] += h.weight_pct * h.last_esg_score
                slot["score_basis"] += h.weight_pct
        sector_summary = [
            {
                "sector": s,
                "weight_pct": round(d["weight"], 2),
                "weighted_score": round(d["score_w"] / d["score_basis"], 1) if d["score_basis"] else None,
            }
            for s, d in sectors.items()
        ]
        sector_summary.sort(key=lambda x: x["weight_pct"], reverse=True)

        coverage = sum(1 for h in holdings if h.last_esg_score is not None)
        return {
            "portfolio_id": str(portfolio.id),
            "name": portfolio.name,
            "holdings_count": len(holdings),
            "coverage_pct": round(100.0 * coverage / len(holdings), 1) if holdings else 0,
            "weighted_score": weighted_score,
            "rating_band": _band(weighted_score),
            "weighted_spread_bps": weighted_spread_bps,
            "weighted_climate_var_pct": round(weighted_climate_var, 2),
            "top_contributors": attribution[:5],
            "bottom_contributors": list(reversed(attribution))[:5],
            "sector_summary": sector_summary,
            "aum_usd": portfolio.aum_usd,
        }


def _band(score: float) -> str:
    if score >= 80:
        return "Leader"
    if score >= 60:
        return "Above average"
    if score >= 40:
        return "Average"
    if score >= 20:
        return "Laggard"
    return "Severe risk"
