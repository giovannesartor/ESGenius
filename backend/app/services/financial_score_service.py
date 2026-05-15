"""
ESG Financial Score service — the "wedge".

Translates ESG performance into financial language (basis points, WACC delta,
shadow rating). This is the core differentiator versus generic ESG scoring tools.

Methodology v1 (transparent, deterministic, replaceable by ML later):

  score = 0.40 * performance + 0.30 * disclosure + 0.30 * forward_risk

  spread_bps = -0.8 * (score - 50)        # i.e. score 78 -> -22.4 bps
  wacc_adj   = spread_bps / 10000          # in decimal

  rating_band:
    >= 90 AAA   |  >= 80 AA   |  >= 70 A   |  >= 60 BBB
    >= 50 BB    |  >= 40 B    |  >= 30 CCC |  >= 20 CC  |  else D

The mapping is calibrated against academic literature on the ESG-credit-spread
nexus (Berg et al. 2022; Capelle-Blancard 2019; ECB Working Paper 2023/2811)
and is intentionally explainable — every customer can reproduce the math.
"""

from __future__ import annotations

import logging
from typing import Any, Iterable
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.financial import ESGFinancialScore
from app.domain.models.data_point import DataPoint
from app.domain.models.regulatory import CarbonEmission, SectorBenchmark
from app.domain.models.company import Company

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Pure scoring math
# ---------------------------------------------------------------------------


def rating_band(score: float) -> str:
    if score >= 90:
        return "AAA"
    if score >= 80:
        return "AA"
    if score >= 70:
        return "A"
    if score >= 60:
        return "BBB"
    if score >= 50:
        return "BB"
    if score >= 40:
        return "B"
    if score >= 30:
        return "CCC"
    if score >= 20:
        return "CC"
    return "D"


def spread_bps_from_score(score: float) -> float:
    """
    Linear translation. Negative bps = better-than-baseline pricing.
    Calibration: investment-grade SLL discounts in 2022-2025 averaged
    -25 to -45 bps for top quartile ESG performers.
    """
    return round(-0.8 * (score - 50.0), 2)


def wacc_adjustment_bps(spread: float) -> float:
    """For now, WACC adj == spread (cost of debt proxy). Future: weight by D/E."""
    return spread


# ---------------------------------------------------------------------------
# Component scorers — each returns 0..100 + a list of drivers
# ---------------------------------------------------------------------------


def _normalize(value: float, low: float, high: float, invert: bool = False) -> float:
    if high == low:
        return 50.0
    pct = (value - low) / (high - low)
    pct = max(0.0, min(1.0, pct))
    return (1 - pct) * 100 if invert else pct * 100


def _performance_score(
    carbon_intensity: float | None,
    benchmark_intensity: float | None,
    renewable_share: float | None,
    trir: float | None,
    diversity_pct: float | None,
) -> tuple[float, list[dict[str, Any]]]:
    drivers: list[dict[str, Any]] = []
    parts: list[float] = []

    # Carbon intensity vs sector benchmark (lower = better)
    if carbon_intensity is not None and benchmark_intensity:
        ratio = carbon_intensity / benchmark_intensity
        sub = _normalize(ratio, 0.4, 1.6, invert=True)
        parts.append(sub)
        drivers.append({
            "metric": "carbon_intensity_vs_peer",
            "value": round(ratio, 3),
            "score": round(sub, 1),
            "direction": "positive" if sub >= 50 else "negative",
        })

    if renewable_share is not None:
        sub = _normalize(renewable_share, 0, 1.0)
        parts.append(sub)
        drivers.append({
            "metric": "renewable_energy_share",
            "value": renewable_share,
            "score": round(sub, 1),
            "direction": "positive" if sub >= 50 else "negative",
        })

    if trir is not None:
        sub = _normalize(trir, 0, 5.0, invert=True)
        parts.append(sub)
        drivers.append({
            "metric": "total_recordable_incident_rate",
            "value": trir,
            "score": round(sub, 1),
            "direction": "positive" if sub >= 50 else "negative",
        })

    if diversity_pct is not None:
        sub = _normalize(diversity_pct, 0.1, 0.5)
        parts.append(sub)
        drivers.append({
            "metric": "leadership_diversity_pct",
            "value": diversity_pct,
            "score": round(sub, 1),
            "direction": "positive" if sub >= 50 else "negative",
        })

    perf = sum(parts) / len(parts) if parts else 50.0
    return perf, drivers


def _disclosure_score(
    coverage_pct: float, framework_count: int, has_external_assurance: bool
) -> tuple[float, list[dict[str, Any]]]:
    drivers: list[dict[str, Any]] = []
    cov = _normalize(coverage_pct, 0, 1.0)
    fw = _normalize(framework_count, 0, 5)
    assurance = 80.0 if has_external_assurance else 30.0
    drivers += [
        {"metric": "datapoint_coverage", "value": coverage_pct, "score": round(cov, 1),
         "direction": "positive" if cov >= 50 else "negative"},
        {"metric": "frameworks_reported", "value": framework_count, "score": round(fw, 1),
         "direction": "positive" if fw >= 50 else "negative"},
        {"metric": "external_assurance", "value": has_external_assurance, "score": assurance,
         "direction": "positive" if assurance >= 50 else "negative"},
    ]
    return (cov * 0.5 + fw * 0.3 + assurance * 0.2), drivers


def _forward_risk_score(
    transition_exposure_pct: float,
    physical_exposure_pct: float,
    target_alignment: str,
) -> tuple[float, list[dict[str, Any]]]:
    drivers: list[dict[str, Any]] = []
    transition = _normalize(transition_exposure_pct, 0, 1.0, invert=True)
    physical = _normalize(physical_exposure_pct, 0, 1.0, invert=True)
    targets = {"sbti_15c": 90, "sbti_2c": 75, "net_zero_2050": 60, "none": 30}.get(target_alignment, 50)
    drivers += [
        {"metric": "transition_risk_exposure", "value": transition_exposure_pct,
         "score": round(transition, 1), "direction": "positive" if transition >= 50 else "negative"},
        {"metric": "physical_risk_exposure", "value": physical_exposure_pct,
         "score": round(physical, 1), "direction": "positive" if physical >= 50 else "negative"},
        {"metric": "decarbonization_target_alignment", "value": target_alignment,
         "score": targets, "direction": "positive" if targets >= 50 else "negative"},
    ]
    return (transition * 0.4 + physical * 0.3 + targets * 0.3), drivers


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------


class FinancialScoreService:
    METHODOLOGY_VERSION = "v1"

    @staticmethod
    async def _gather_inputs(db: AsyncSession, company: Company, year: int) -> dict[str, Any]:
        # Aggregate carbon
        em = await db.execute(
            select(CarbonEmission).where(
                CarbonEmission.company_id == company.id, CarbonEmission.year == year
            )
        )
        emissions = em.scalars().all()
        total_kg = sum(e.co2e_kg for e in emissions)
        # Carbon intensity proxy: tCO2e per $M revenue (revenue not modeled — use 1 for relative)
        carbon_intensity = total_kg / 1000.0  # tonnes; absolute (peer ratio handles scale)

        bm = await db.execute(
            select(SectorBenchmark).where(
                SectorBenchmark.sector == (company.sector or "general"),
                SectorBenchmark.metric == "ghg_intensity",
            ).limit(1)
        )
        bench = bm.scalar_one_or_none()
        benchmark_intensity = bench.avg_value if bench else None

        # Datapoint coverage
        dp = await db.execute(
            select(DataPoint).where(DataPoint.company_id == company.id)
        )
        datapoints = dp.scalars().all()
        framework_codes = {d.category for d in datapoints if d.category}
        coverage_pct = min(1.0, len(datapoints) / 100.0)  # naive: 100 datapoints = full

        return {
            "carbon_intensity": carbon_intensity,
            "benchmark_intensity": benchmark_intensity,
            # The platform stores qualitative attrs in extra fields — defaults below.
            "renewable_share": getattr(company, "renewable_share", None),
            "trir": getattr(company, "trir", None),
            "diversity_pct": getattr(company, "diversity_pct", None),
            "coverage_pct": coverage_pct,
            "framework_count": len(framework_codes),
            "has_external_assurance": False,
            "transition_exposure_pct": 0.4,  # default mid; replaced when Climate Risk module computes
            "physical_exposure_pct": 0.3,
            "target_alignment": "none",
        }

    @classmethod
    async def compute(
        cls, db: AsyncSession, company: Company, year: int, *, persist: bool = True
    ) -> ESGFinancialScore:
        inputs = await cls._gather_inputs(db, company, year)

        perf, perf_drivers = _performance_score(
            inputs["carbon_intensity"], inputs["benchmark_intensity"],
            inputs["renewable_share"], inputs["trir"], inputs["diversity_pct"],
        )
        disc, disc_drivers = _disclosure_score(
            inputs["coverage_pct"], inputs["framework_count"], inputs["has_external_assurance"]
        )
        risk, risk_drivers = _forward_risk_score(
            inputs["transition_exposure_pct"], inputs["physical_exposure_pct"], inputs["target_alignment"]
        )

        score = round(0.40 * perf + 0.30 * disc + 0.30 * risk, 1)
        spread = spread_bps_from_score(score)
        wacc = wacc_adjustment_bps(spread)

        all_drivers = perf_drivers + disc_drivers + risk_drivers
        all_drivers.sort(key=lambda d: d["score"], reverse=True)

        # Compute peer percentile
        sector_percentile = await cls._sector_percentile(db, company.sector, score)

        record = ESGFinancialScore(
            company_id=company.id,
            year=year,
            score=score,
            performance_score=round(perf, 1),
            disclosure_score=round(disc, 1),
            forward_risk_score=round(risk, 1),
            spread_bps=spread,
            wacc_adjustment_bps=wacc,
            rating_band=rating_band(score),
            sector=company.sector,
            sector_percentile=sector_percentile,
            drivers={
                "top_positive": all_drivers[:5],
                "top_negative": list(reversed(all_drivers))[:5],
            },
            explainability={
                "weights": {"performance": 0.40, "disclosure": 0.30, "forward_risk": 0.30},
                "inputs": inputs,
                "formula": "score = 0.40*performance + 0.30*disclosure + 0.30*forward_risk",
                "spread_formula": "spread_bps = -0.8 * (score - 50)",
            },
            methodology_version=cls.METHODOLOGY_VERSION,
        )

        if persist:
            # Upsert by (company, year, methodology)
            existing = await db.execute(
                select(ESGFinancialScore).where(
                    ESGFinancialScore.company_id == company.id,
                    ESGFinancialScore.year == year,
                    ESGFinancialScore.methodology_version == cls.METHODOLOGY_VERSION,
                )
            )
            old = existing.scalar_one_or_none()
            if old:
                for f in (
                    "score", "performance_score", "disclosure_score", "forward_risk_score",
                    "spread_bps", "wacc_adjustment_bps", "rating_band", "sector",
                    "sector_percentile", "drivers", "explainability",
                ):
                    setattr(old, f, getattr(record, f))
                record = old
            else:
                db.add(record)
            await db.commit()
            await db.refresh(record)
        return record

    @staticmethod
    async def _sector_percentile(db: AsyncSession, sector: str | None, score: float) -> float | None:
        if not sector:
            return None
        rows = await db.execute(
            select(ESGFinancialScore.score).where(ESGFinancialScore.sector == sector)
        )
        peers = [s for (s,) in rows.all()]
        if len(peers) < 3:
            return None
        below = sum(1 for p in peers if p < score)
        return round(100.0 * below / len(peers), 1)

    @staticmethod
    async def latest_for_company(
        db: AsyncSession, company_id: UUID
    ) -> ESGFinancialScore | None:
        rows = await db.execute(
            select(ESGFinancialScore)
            .where(ESGFinancialScore.company_id == company_id)
            .order_by(ESGFinancialScore.year.desc(), ESGFinancialScore.created_at.desc())
            .limit(1)
        )
        return rows.scalar_one_or_none()

    @staticmethod
    async def history(
        db: AsyncSession, company_id: UUID, limit: int = 10
    ) -> list[ESGFinancialScore]:
        rows = await db.execute(
            select(ESGFinancialScore)
            .where(ESGFinancialScore.company_id == company_id)
            .order_by(ESGFinancialScore.year.desc())
            .limit(limit)
        )
        return list(rows.scalars().all())


def aggregate_portfolio_score(holdings: Iterable[tuple[float, float]]) -> float:
    """Weighted average ESG score for portfolio. holdings: iterable of (weight_pct, score)."""
    items = [(w, s) for (w, s) in holdings if s is not None]
    if not items:
        return 0.0
    total_w = sum(w for w, _ in items)
    if total_w == 0:
        return 0.0
    return round(sum(w * s for w, s in items) / total_w, 1)
