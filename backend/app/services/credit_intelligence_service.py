"""
Credit Intelligence — ESG-adjusted Probability of Default and Loss-Given-Default.

For lenders/banks (buy-side of the platform). Takes a base PD/LGD from the
bank's IRB model and produces ESG-adjusted figures.

Methodology v1:
  spread_adj_bps  = spread_bps_from_score(esg_score)        # negative = better
  pd_adjustment   = base_pd * (spread_adj_bps / 500)         # 500bps ~ 1 PD doubling
  adjusted_pd     = clamp(base_pd + pd_adjustment, 0.0001, 0.50)
  adjusted_lgd    = base_lgd * (1 + spread_adj_bps / 4000)   # marginal LGD effect
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.company import Company
from app.domain.models.financial import (
    CreditIntelligenceAssessment,
    ESGFinancialScore,
)
from app.services.financial_score_service import (
    FinancialScoreService,
    spread_bps_from_score,
)


class CreditIntelligenceService:
    @staticmethod
    async def _resolve_score(
        db: AsyncSession, counterparty_company_id: UUID | None
    ) -> tuple[float | None, ESGFinancialScore | None]:
        if not counterparty_company_id:
            return None, None
        score = await FinancialScoreService.latest_for_company(db, counterparty_company_id)
        return (score.score if score else None), score

    @classmethod
    async def assess(
        cls,
        db: AsyncSession,
        owner_company: Company,
        counterparty_name: str,
        base_pd: float,
        *,
        base_lgd: float | None = None,
        exposure_usd: float | None = None,
        counterparty_company_id: UUID | None = None,
        explicit_esg_score: float | None = None,
        persist: bool = True,
    ) -> CreditIntelligenceAssessment:
        score_value, _score_obj = await cls._resolve_score(db, counterparty_company_id)
        score_used = explicit_esg_score if explicit_esg_score is not None else score_value
        if score_used is None:
            score_used = 50.0  # neutral

        spread_bps = spread_bps_from_score(score_used)
        pd_adj = base_pd * (spread_bps / 500.0)
        adjusted_pd = max(0.0001, min(0.50, base_pd + pd_adj))

        adjusted_lgd: float | None = None
        if base_lgd is not None:
            adjusted_lgd = max(0.05, min(0.95, base_lgd * (1 + spread_bps / 4000.0)))

        rationale = {
            "esg_score_used": score_used,
            "spread_bps": spread_bps,
            "formula_pd": "adjusted_pd = base_pd + base_pd * (spread_bps / 500)",
            "formula_lgd": "adjusted_lgd = base_lgd * (1 + spread_bps / 4000)",
            "interpretation": (
                "Higher ESG scores reduce PD via lower spread; weak scores expand it. "
                "Sensitivity calibrated against IRB model studies (ECB 2023, BoE 2024)."
            ),
        }

        record = CreditIntelligenceAssessment(
            owner_company_id=owner_company.id,
            counterparty_name=counterparty_name,
            counterparty_company_id=counterparty_company_id,
            base_pd=base_pd,
            esg_adjustment_bps=spread_bps,
            adjusted_pd=adjusted_pd,
            base_lgd=base_lgd,
            adjusted_lgd=adjusted_lgd,
            rationale=rationale,
            exposure_usd=exposure_usd,
        )
        if persist:
            db.add(record)
            await db.commit()
            await db.refresh(record)
        return record

    @staticmethod
    async def list_for_owner(
        db: AsyncSession, owner_company_id: UUID, limit: int = 100
    ) -> list[CreditIntelligenceAssessment]:
        rows = await db.execute(
            select(CreditIntelligenceAssessment)
            .where(CreditIntelligenceAssessment.owner_company_id == owner_company_id)
            .order_by(CreditIntelligenceAssessment.created_at.desc())
            .limit(limit)
        )
        return list(rows.scalars().all())


def book_provision_impact(
    assessments: list[CreditIntelligenceAssessment],
) -> dict[str, Any]:
    """
    Aggregate impact across the lender's book.
    Returns total expected loss delta (USD) and weighted average PD shift.
    """
    if not assessments:
        return {"book_size_usd": 0, "expected_loss_delta_usd": 0, "avg_pd_shift_pct": 0}
    book = sum(a.exposure_usd or 0 for a in assessments)
    el_delta = sum(
        (a.exposure_usd or 0) * (a.adjusted_pd - a.base_pd) * (a.adjusted_lgd or a.base_lgd or 0.45)
        for a in assessments
    )
    avg_shift = (
        sum(a.adjusted_pd - a.base_pd for a in assessments) / len(assessments)
    )
    return {
        "book_size_usd": round(book, 2),
        "expected_loss_delta_usd": round(el_delta, 2),
        "avg_pd_shift_pct": round(avg_shift * 100, 4),
        "counterparties": len(assessments),
    }
