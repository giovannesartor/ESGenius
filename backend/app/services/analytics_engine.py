"""
ESG Analytics Engine — Core intelligence of the ESG360 platform.

Provides:
  • Quantitative ESG scoring with weighted sub-indicators
  • Benchmark comparison against industry baselines
  • KPI generation with short/mid/long-term targets
  • What-if simulation (single & multi-scenario)
  • Multi-company comparison & ranking

Methodology version: 2.0
"""

from __future__ import annotations

import math
import uuid
from typing import Any, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.data_point_repository import DataPointRepository
from app.repositories.company_repository import CompanyRepository
from app.repositories.framework_repository import FrameworkRepository
from app.domain.schemas.analytics import (
    BenchmarkComparison,
    BenchmarkResponse,
    CompanyScoreSummary,
    ComparisonResponse,
    ESGScoreResponse,
    GeneratedKPI,
    KPIResponse,
    MultiScenarioResponse,
    PillarBreakdown,
    ScenarioProjection,
    SimulationAction,
    SimulationResponse,
    SimulationResult,
    SubIndicatorScore,
)


# ═══════════════════════════════════════════════════════════════════════════════
# WEIGHT CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

PILLAR_WEIGHTS = {
    "E": 0.40,
    "S": 0.30,
    "G": 0.30,
}

SUB_INDICATORS: dict[str, list[dict[str, Any]]] = {
    "E": [
        {"code": "E1", "name": "Emissions", "weight": 0.30, "categories": ["emissions", "carbon", "ghg", "scope"]},
        {"code": "E2", "name": "Energy Usage", "weight": 0.25, "categories": ["energy", "electricity", "fuel", "renewable"]},
        {"code": "E3", "name": "Waste Management", "weight": 0.20, "categories": ["waste", "recycling", "circular", "disposal"]},
        {"code": "E4", "name": "Resource Efficiency", "weight": 0.25, "categories": ["water", "resource", "material", "efficiency", "biodiversity"]},
    ],
    "S": [
        {"code": "S1", "name": "Workforce", "weight": 0.30, "categories": ["workforce", "labor", "employment", "turnover", "training"]},
        {"code": "S2", "name": "Diversity & Inclusion", "weight": 0.20, "categories": ["diversity", "inclusion", "gender", "equity"]},
        {"code": "S3", "name": "Health & Safety", "weight": 0.30, "categories": ["health", "safety", "incident", "injury", "wellbeing"]},
        {"code": "S4", "name": "Community Impact", "weight": 0.20, "categories": ["community", "social", "philanthropy", "volunteer", "stakeholder"]},
    ],
    "G": [
        {"code": "G1", "name": "Board Structure", "weight": 0.25, "categories": ["board", "governance", "structure", "independence"]},
        {"code": "G2", "name": "Ethics & Compliance", "weight": 0.25, "categories": ["ethics", "compliance", "anti-corruption", "bribery", "code"]},
        {"code": "G3", "name": "Transparency & Reporting", "weight": 0.25, "categories": ["transparency", "reporting", "disclosure", "audit"]},
        {"code": "G4", "name": "Risk Management", "weight": 0.25, "categories": ["risk", "management", "control", "oversight", "cybersecurity"]},
    ],
}

# ═══════════════════════════════════════════════════════════════════════════════
# GRADE THRESHOLDS
# ═══════════════════════════════════════════════════════════════════════════════

GRADE_MAP = [
    (90, "A+"),
    (80, "A"),
    (73, "B+"),
    (65, "B"),
    (55, "C+"),
    (45, "C"),
    (30, "D"),
    (0,  "F"),
]

CLASSIFICATION_MAP = [
    (80, "leading"),
    (65, "competitive"),
    (50, "average"),
    (0,  "lagging"),
]

# ═══════════════════════════════════════════════════════════════════════════════
# INDUSTRY BENCHMARK DATA (simulated baselines by sector)
# ═══════════════════════════════════════════════════════════════════════════════

INDUSTRY_BASELINES: dict[str, dict[str, Any]] = {
    "_default": {
        "overall": {"average": 52, "best": 88},
        "E": {"average": 48, "best": 90},
        "S": {"average": 55, "best": 86},
        "G": {"average": 54, "best": 89},
        "E1": {"average": 45, "best": 92}, "E2": {"average": 50, "best": 88},
        "E3": {"average": 48, "best": 85}, "E4": {"average": 50, "best": 90},
        "S1": {"average": 58, "best": 88}, "S2": {"average": 45, "best": 82},
        "S3": {"average": 60, "best": 90}, "S4": {"average": 52, "best": 80},
        "G1": {"average": 55, "best": 90}, "G2": {"average": 52, "best": 88},
        "G3": {"average": 50, "best": 86}, "G4": {"average": 56, "best": 92},
    },
    "technology": {
        "overall": {"average": 58, "best": 91},
        "E": {"average": 52, "best": 88},
        "S": {"average": 60, "best": 90},
        "G": {"average": 62, "best": 93},
        "E1": {"average": 50, "best": 90}, "E2": {"average": 55, "best": 92},
        "E3": {"average": 48, "best": 82}, "E4": {"average": 52, "best": 88},
        "S1": {"average": 62, "best": 90}, "S2": {"average": 55, "best": 88},
        "S3": {"average": 65, "best": 92}, "S4": {"average": 55, "best": 82},
        "G1": {"average": 60, "best": 92}, "G2": {"average": 58, "best": 90},
        "G3": {"average": 62, "best": 90}, "G4": {"average": 65, "best": 95},
    },
    "energy": {
        "overall": {"average": 48, "best": 85},
        "E": {"average": 42, "best": 82},
        "S": {"average": 52, "best": 86},
        "G": {"average": 50, "best": 88},
        "E1": {"average": 38, "best": 80}, "E2": {"average": 45, "best": 85},
        "E3": {"average": 42, "best": 78}, "E4": {"average": 44, "best": 82},
        "S1": {"average": 55, "best": 88}, "S2": {"average": 42, "best": 78},
        "S3": {"average": 58, "best": 90}, "S4": {"average": 48, "best": 80},
        "G1": {"average": 52, "best": 88}, "G2": {"average": 48, "best": 85},
        "G3": {"average": 48, "best": 84}, "G4": {"average": 52, "best": 90},
    },
    "finance": {
        "overall": {"average": 56, "best": 90},
        "E": {"average": 50, "best": 85},
        "S": {"average": 58, "best": 90},
        "G": {"average": 62, "best": 95},
        "E1": {"average": 48, "best": 82}, "E2": {"average": 52, "best": 88},
        "E3": {"average": 50, "best": 80}, "E4": {"average": 50, "best": 85},
        "S1": {"average": 60, "best": 90}, "S2": {"average": 52, "best": 85},
        "S3": {"average": 62, "best": 88}, "S4": {"average": 56, "best": 84},
        "G1": {"average": 65, "best": 95}, "G2": {"average": 60, "best": 92},
        "G3": {"average": 58, "best": 90}, "G4": {"average": 62, "best": 95},
    },
    "manufacturing": {
        "overall": {"average": 46, "best": 82},
        "E": {"average": 40, "best": 78},
        "S": {"average": 50, "best": 84},
        "G": {"average": 48, "best": 86},
        "E1": {"average": 35, "best": 75}, "E2": {"average": 42, "best": 80},
        "E3": {"average": 40, "best": 78}, "E4": {"average": 42, "best": 80},
        "S1": {"average": 52, "best": 85}, "S2": {"average": 40, "best": 76},
        "S3": {"average": 55, "best": 88}, "S4": {"average": 48, "best": 78},
        "G1": {"average": 50, "best": 86}, "G2": {"average": 46, "best": 84},
        "G3": {"average": 46, "best": 82}, "G4": {"average": 50, "best": 88},
    },
    "healthcare": {
        "overall": {"average": 55, "best": 89},
        "E": {"average": 48, "best": 84},
        "S": {"average": 62, "best": 92},
        "G": {"average": 56, "best": 90},
        "E1": {"average": 45, "best": 82}, "E2": {"average": 50, "best": 86},
        "E3": {"average": 48, "best": 82}, "E4": {"average": 48, "best": 84},
        "S1": {"average": 65, "best": 92}, "S2": {"average": 55, "best": 88},
        "S3": {"average": 68, "best": 95}, "S4": {"average": 58, "best": 86},
        "G1": {"average": 58, "best": 90}, "G2": {"average": 55, "best": 88},
        "G3": {"average": 54, "best": 88}, "G4": {"average": 56, "best": 92},
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# KPI TEMPLATES
# ═══════════════════════════════════════════════════════════════════════════════

KPI_TEMPLATES: dict[str, list[dict[str, Any]]] = {
    "E1": [
        {
            "name": "Reduce Scope 1 & 2 GHG Emissions",
            "description": "Achieve measurable reduction in direct and energy-indirect greenhouse gas emissions through operational efficiency and renewable energy procurement.",
            "unit": "tCO2e",
            "measurement_method": "GHG Protocol Scope 1+2 calculation, verified by third party",
            "difficulty": "hard",
            "improvement_per_10pct": 5.0,
        },
        {
            "name": "Establish Scope 3 Emissions Tracking",
            "description": "Implement upstream and downstream value chain emissions measurement covering at least 80% of material categories.",
            "unit": "% categories covered",
            "measurement_method": "GHG Protocol Scope 3 Category Assessment",
            "difficulty": "hard",
            "improvement_per_10pct": 4.0,
        },
    ],
    "E2": [
        {
            "name": "Increase Renewable Energy Share",
            "description": "Raise the proportion of electricity sourced from certified renewable sources.",
            "unit": "%",
            "measurement_method": "Renewable Energy Certificates (RECs) or PPA documentation",
            "difficulty": "moderate",
            "improvement_per_10pct": 4.5,
        },
        {
            "name": "Reduce Energy Intensity",
            "description": "Decrease energy consumption per unit of revenue or production output.",
            "unit": "MWh / $M revenue",
            "measurement_method": "Total energy consumption divided by normalizing metric, tracked quarterly",
            "difficulty": "moderate",
            "improvement_per_10pct": 3.5,
        },
    ],
    "E3": [
        {
            "name": "Achieve Zero Waste to Landfill",
            "description": "Divert 95%+ of operational waste from landfill through recycling, composting, and circular economy initiatives.",
            "unit": "% diverted",
            "measurement_method": "Waste audit and diversion tracking by certified waste management partner",
            "difficulty": "moderate",
            "improvement_per_10pct": 4.0,
        },
    ],
    "E4": [
        {
            "name": "Reduce Water Consumption Intensity",
            "description": "Lower water withdrawal per unit of output, particularly in water-stressed regions.",
            "unit": "m³ / unit",
            "measurement_method": "Water withdrawal meters at facility level, normalized by production",
            "difficulty": "moderate",
            "improvement_per_10pct": 3.5,
        },
    ],
    "S1": [
        {
            "name": "Reduce Voluntary Turnover Rate",
            "description": "Decrease employee voluntary turnover through improved engagement, compensation benchmarking, and career development programs.",
            "unit": "%",
            "measurement_method": "Monthly HRIS voluntary separation tracking",
            "difficulty": "moderate",
            "improvement_per_10pct": 4.0,
        },
        {
            "name": "Increase Employee Training Hours",
            "description": "Expand average annual training hours per employee to support skill development and retention.",
            "unit": "hours / employee / year",
            "measurement_method": "LMS completion records aggregated annually",
            "difficulty": "easy",
            "improvement_per_10pct": 3.0,
        },
    ],
    "S2": [
        {
            "name": "Improve Gender Diversity in Leadership",
            "description": "Increase representation of women in senior leadership and board positions.",
            "unit": "% women in leadership",
            "measurement_method": "HR demographic data for VP+ levels, reported quarterly",
            "difficulty": "hard",
            "improvement_per_10pct": 5.0,
        },
    ],
    "S3": [
        {
            "name": "Reduce Lost Time Injury Frequency Rate (LTIFR)",
            "description": "Lower workplace injury rates through enhanced safety protocols and training.",
            "unit": "per 1M hours worked",
            "measurement_method": "OSHA recordable incident tracking normalized by hours worked",
            "difficulty": "moderate",
            "improvement_per_10pct": 4.5,
        },
    ],
    "S4": [
        {
            "name": "Increase Community Investment",
            "description": "Grow corporate social investment as percentage of pre-tax profit.",
            "unit": "% of pre-tax profit",
            "measurement_method": "Finance-reported community investment according to LBG framework",
            "difficulty": "easy",
            "improvement_per_10pct": 3.0,
        },
    ],
    "G1": [
        {
            "name": "Increase Board Independence",
            "description": "Ensure majority of board members are independent non-executive directors.",
            "unit": "% independent directors",
            "measurement_method": "Annual proxy statement / governance report",
            "difficulty": "moderate",
            "improvement_per_10pct": 4.0,
        },
    ],
    "G2": [
        {
            "name": "Achieve 100% Anti-Corruption Training Coverage",
            "description": "Ensure all employees complete annual anti-corruption and ethics training.",
            "unit": "% employees trained",
            "measurement_method": "LMS compliance training completion tracking",
            "difficulty": "easy",
            "improvement_per_10pct": 3.5,
        },
    ],
    "G3": [
        {
            "name": "Publish Integrated ESG Report",
            "description": "Produce and publish a comprehensive ESG report aligned with GRI, SASB, and TCFD frameworks.",
            "unit": "frameworks covered",
            "measurement_method": "External assurance of ESG report content and framework alignment",
            "difficulty": "moderate",
            "improvement_per_10pct": 4.0,
        },
    ],
    "G4": [
        {
            "name": "Implement Enterprise Risk Management (ERM) Framework",
            "description": "Establish or enhance integrated risk management covering ESG-specific risks with board-level oversight.",
            "unit": "% risks mapped",
            "measurement_method": "Risk register with ESG-specific entries reviewed quarterly by risk committee",
            "difficulty": "hard",
            "improvement_per_10pct": 5.0,
        },
    ],
}


# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def _score_to_grade(score: float) -> str:
    for threshold, grade in GRADE_MAP:
        if score >= threshold:
            return grade
    return "F"


def _score_to_classification(score: float) -> str:
    for threshold, classification in CLASSIFICATION_MAP:
        if score >= threshold:
            return classification
    return "lagging"


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def _percentile(score: float, average: float, best: float) -> float:
    """Estimate percentile position between 0 and 100."""
    if best <= average:
        return 50.0
    if score <= average:
        return max(0, (score / average) * 50) if average > 0 else 0
    return min(100, 50 + ((score - average) / (best - average)) * 50)


def _match_category(dp_category: Optional[str], keywords: list[str]) -> bool:
    """Check if a data point's category matches sub-indicator keywords."""
    if not dp_category:
        return False
    cat_lower = dp_category.lower()
    return any(kw in cat_lower for kw in keywords)


# ═══════════════════════════════════════════════════════════════════════════════
# ESG ANALYTICS ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class ESGAnalyticsEngine:
    """
    Core analytical engine for the ESG360 platform.

    Provides financial-grade ESG scoring, benchmarking, KPI generation,
    predictive simulation, and multi-company comparison.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.dp_repo = DataPointRepository(db)
        self.company_repo = CompanyRepository(db)
        self.fw_repo = FrameworkRepository(db)

    # ─── 1. ESG SCORING ──────────────────────────────────────────────────

    async def compute_scores(
        self, company_id: UUID, year: int
    ) -> ESGScoreResponse:
        """
        Compute weighted ESG scores with sub-indicator breakdown.

        Methodology:
        1. Classify data points into pillars (E/S/G) and sub-indicators
        2. Score each sub-indicator 0–100 based on data quality & values
        3. Apply penalties for missing/partial data
        4. Weighted aggregation → pillar scores → overall score
        """
        data_points = await self.dp_repo.list_by_company(
            company_id, year=year, limit=10_000
        )
        company = await self.company_repo.get_by_id(company_id)

        pillar_breakdowns: dict[str, PillarBreakdown] = {}
        pillar_scores: dict[str, float] = {}

        for pillar_code, sub_indicators in SUB_INDICATORS.items():
            pillar_dps = [dp for dp in data_points if dp.pillar == pillar_code]
            breakdown = self._compute_pillar(pillar_code, pillar_dps, sub_indicators)
            pillar_breakdowns[pillar_code] = breakdown
            pillar_scores[pillar_code] = breakdown.weighted_score

        # Overall weighted score
        overall = sum(
            pillar_scores.get(code, 0) * weight
            for code, weight in PILLAR_WEIGHTS.items()
        )
        overall = round(_clamp(overall), 2)

        # Data completeness
        total_dp = len(data_points)
        validated_dp = len([dp for dp in data_points if dp.status == "validated"])
        completeness = validated_dp / total_dp if total_dp > 0 else 0

        # Confidence based on data volume & quality
        volume_factor = min(1.0, total_dp / 50)  # ideally 50+ data points
        quality_factor = completeness
        confidence = round((volume_factor * 0.4 + quality_factor * 0.6), 2)

        return ESGScoreResponse(
            company_id=company_id,
            year=year,
            overall_score=overall,
            overall_grade=_score_to_grade(overall),
            environmental=pillar_breakdowns["E"],
            social=pillar_breakdowns["S"],
            governance=pillar_breakdowns["G"],
            data_completeness=round(completeness, 2),
            confidence_level=_clamp(confidence, 0, 1),
            total_data_points=total_dp,
            validated_data_points=validated_dp,
        )

    def _compute_pillar(
        self,
        pillar_code: str,
        data_points: list,
        sub_indicators: list[dict],
    ) -> PillarBreakdown:
        """Compute score for a single ESG pillar with sub-indicator breakdown."""
        pillar_names = {"E": "environmental", "S": "social", "G": "governance"}
        pillar_name = pillar_names[pillar_code]

        sub_scores: list[SubIndicatorScore] = []
        weighted_total = 0.0
        strengths: list[str] = []
        weaknesses: list[str] = []
        total_completeness = 0.0

        for si in sub_indicators:
            # Find data points matching this sub-indicator
            si_dps = [
                dp for dp in data_points
                if _match_category(dp.category, si["categories"])
            ]

            # Also match unclassified data points by order if no category match
            if not si_dps:
                # Try to assign from remaining data points
                si_dps = []

            # Score the sub-indicator
            raw_score, data_quality, justification = self._score_sub_indicator(
                si["name"], si_dps
            )

            # Apply penalties
            penalty = 0.0
            if data_quality == "missing":
                penalty = 0.30
            elif data_quality == "partial":
                penalty = 0.15

            adjusted = round(_clamp(raw_score * (1 - penalty)), 2)

            sub_scores.append(SubIndicatorScore(
                name=si["name"],
                code=si["code"],
                weight=si["weight"],
                raw_score=round(raw_score, 2),
                data_quality=data_quality,
                penalty=penalty,
                adjusted_score=adjusted,
                justification=justification,
            ))

            weighted_total += adjusted * si["weight"]

            completeness_val = 1.0 if data_quality == "complete" else (0.5 if data_quality == "partial" else 0.0)
            total_completeness += completeness_val * si["weight"]

            # Classify strengths / weaknesses
            if adjusted >= 70:
                strengths.append(f"{si['name']}: {adjusted}/100")
            elif adjusted < 50:
                weaknesses.append(f"{si['name']}: {adjusted}/100 — needs improvement")

        pillar_raw = round(_clamp(weighted_total), 2)
        pillar_weight = PILLAR_WEIGHTS[pillar_code]

        return PillarBreakdown(
            pillar=pillar_name,
            pillar_code=pillar_code,
            weight=pillar_weight,
            raw_score=pillar_raw,
            weighted_score=pillar_raw,  # score within pillar (not yet multiplied by pillar weight)
            sub_indicators=sub_scores,
            data_completeness=round(total_completeness, 2),
            strengths=strengths,
            weaknesses=weaknesses,
        )

    def _score_sub_indicator(
        self, name: str, data_points: list
    ) -> tuple[float, str, str]:
        """
        Score a sub-indicator based on available data points.

        Returns: (raw_score, data_quality, justification)
        """
        if not data_points:
            return (
                0.0,
                "missing",
                f"No data points available for {name}. Score set to 0 with 30% penalty applied.",
            )

        total = len(data_points)
        has_value = len([dp for dp in data_points if dp.value or dp.numeric_value is not None])
        validated = len([dp for dp in data_points if dp.status == "validated"])
        flagged = len([dp for dp in data_points if dp.status == "flagged"])

        # Data availability score (0-100)
        availability = (has_value / total) * 100 if total > 0 else 0

        # Validation score (0-100)
        validation = (validated / total) * 100 if total > 0 else 0

        # Consistency penalty
        consistency_deduction = (flagged / total) * 20 if total > 0 else 0

        # AI confidence bonus
        ai_scores = [dp.ai_confidence for dp in data_points if dp.ai_confidence is not None]
        avg_confidence = sum(ai_scores) / len(ai_scores) if ai_scores else 0.5
        confidence_bonus = avg_confidence * 10  # up to 10 points

        # Composite score
        raw = (availability * 0.45) + (validation * 0.35) + confidence_bonus - consistency_deduction
        raw = _clamp(raw)

        # Determine data quality
        if has_value / total >= 0.8 and total >= 2:
            quality = "complete"
        elif has_value > 0:
            quality = "partial"
        else:
            quality = "missing"

        justification = (
            f"{name}: {total} data points found, {has_value} with values, "
            f"{validated} validated. Availability={availability:.0f}%, "
            f"Validation={validation:.0f}%. "
            f"{'Consistency deduction applied.' if flagged > 0 else 'No data flags.'}"
        )

        return (round(raw, 2), quality, justification)

    # ─── 2. BENCHMARK ENGINE ─────────────────────────────────────────────

    async def compute_benchmark(
        self, company_id: UUID, year: int, sector: Optional[str] = None
    ) -> BenchmarkResponse:
        """
        Compare company ESG scores against industry baselines.

        Returns classification: lagging, average, competitive, leading.
        """
        scores = await self.compute_scores(company_id, year)
        company = await self.company_repo.get_by_id(company_id)

        effective_sector = (sector or (company.sector if company else None) or "").lower().strip()
        baseline = INDUSTRY_BASELINES.get(effective_sector, INDUSTRY_BASELINES["_default"])

        # Overall comparison
        overall_cmp = self._make_comparison(
            "Overall ESG", scores.overall_score, baseline["overall"]
        )

        # Pillar comparisons
        env_cmp = self._make_comparison(
            "Environmental", scores.environmental.raw_score, baseline["E"]
        )
        soc_cmp = self._make_comparison(
            "Social", scores.social.raw_score, baseline["S"]
        )
        gov_cmp = self._make_comparison(
            "Governance", scores.governance.raw_score, baseline["G"]
        )

        # Sub-indicator comparisons
        sub_comparisons: list[BenchmarkComparison] = []
        for pillar_code, sub_indicators in SUB_INDICATORS.items():
            pillar_bd = {"E": scores.environmental, "S": scores.social, "G": scores.governance}[pillar_code]
            for si in pillar_bd.sub_indicators:
                si_baseline = baseline.get(si.code, baseline.get(pillar_code, {"average": 50, "best": 85}))
                sub_comparisons.append(
                    self._make_comparison(si.name, si.adjusted_score, si_baseline)
                )

        # Classification
        classification = _score_to_classification(scores.overall_score)

        # Strengths / weaknesses vs peers
        strengths_vs: list[str] = []
        weaknesses_vs: list[str] = []
        for cmp in [overall_cmp, env_cmp, soc_cmp, gov_cmp] + sub_comparisons:
            if cmp.gap_to_average > 10:
                strengths_vs.append(f"{cmp.metric}: {cmp.gap_to_average:+.1f} above industry average")
            elif cmp.gap_to_average < -10:
                weaknesses_vs.append(f"{cmp.metric}: {abs(cmp.gap_to_average):.1f} below industry average")

        return BenchmarkResponse(
            company_id=company_id,
            year=year,
            sector=effective_sector or "general",
            classification=classification,
            overall=overall_cmp,
            environmental=env_cmp,
            social=soc_cmp,
            governance=gov_cmp,
            sub_indicator_comparisons=sub_comparisons,
            strengths_vs_peers=strengths_vs[:5],
            weaknesses_vs_peers=weaknesses_vs[:5],
        )

    def _make_comparison(
        self, metric: str, score: float, baseline: dict[str, float]
    ) -> BenchmarkComparison:
        avg = baseline["average"]
        best = baseline["best"]
        return BenchmarkComparison(
            metric=metric,
            company_score=round(score, 2),
            industry_average=avg,
            best_in_class=best,
            gap_to_average=round(score - avg, 2),
            gap_to_best=round(score - best, 2),
            percentile=round(_percentile(score, avg, best), 1),
        )

    # ─── 3. KPI GENERATOR ────────────────────────────────────────────────

    async def generate_kpis(
        self, company_id: UUID, year: int, max_kpis: int = 10
    ) -> KPIResponse:
        """
        Generate actionable KPIs targeting the weakest ESG areas.

        Prioritizes sub-indicators with the lowest scores and generates
        short-term (3mo), mid-term (6mo), and long-term (12mo) targets.
        """
        scores = await self.compute_scores(company_id, year)

        # Collect all sub-indicators with scores, sorted by weakness
        all_subs: list[tuple[str, SubIndicatorScore]] = []
        for pillar in [scores.environmental, scores.social, scores.governance]:
            for si in pillar.sub_indicators:
                all_subs.append((pillar.pillar_code, si))

        # Sort by adjusted_score ascending (weakest first) for priority
        all_subs.sort(key=lambda x: x[1].adjusted_score)

        short_term: list[GeneratedKPI] = []
        mid_term: list[GeneratedKPI] = []
        long_term: list[GeneratedKPI] = []
        total_estimated_improvement = 0.0
        priority_counts: dict[str, int] = {"critical": 0, "high": 0, "medium": 0, "low": 0}

        kpi_count = 0
        for pillar_code, si in all_subs:
            if kpi_count >= max_kpis:
                break

            templates = KPI_TEMPLATES.get(si.code, [])
            if not templates:
                continue

            for tmpl in templates:
                if kpi_count >= max_kpis:
                    break

                # Priority based on score
                if si.adjusted_score < 30:
                    priority = "critical"
                    timeframe = "short-term"
                    timeframe_months = 3
                    improvement_target = 25
                elif si.adjusted_score < 50:
                    priority = "high"
                    timeframe = "short-term"
                    timeframe_months = 3
                    improvement_target = 20
                elif si.adjusted_score < 65:
                    priority = "medium"
                    timeframe = "mid-term"
                    timeframe_months = 6
                    improvement_target = 15
                else:
                    priority = "low"
                    timeframe = "long-term"
                    timeframe_months = 12
                    improvement_target = 10

                current_value = round(si.adjusted_score, 1)
                target_value = round(min(100, current_value * (1 + improvement_target / 100)), 1)
                estimated_impact = tmpl.get("improvement_per_10pct", 3.0) * (improvement_target / 10)

                kpi = GeneratedKPI(
                    id=f"KPI-{si.code}-{kpi_count + 1}",
                    name=tmpl["name"],
                    description=tmpl["description"],
                    pillar=pillar_code,
                    category=si.name,
                    current_value=current_value,
                    current_unit="score (0-100)",
                    target_value=target_value,
                    target_unit=tmpl.get("unit", "score (0-100)"),
                    improvement_percentage=improvement_target,
                    timeframe=timeframe,
                    timeframe_months=timeframe_months,
                    measurement_method=tmpl.get("measurement_method", "Data-driven assessment"),
                    priority=priority,
                    difficulty=tmpl.get("difficulty", "moderate"),
                    estimated_score_impact=round(estimated_impact, 1),
                )

                if timeframe == "short-term":
                    short_term.append(kpi)
                elif timeframe == "mid-term":
                    mid_term.append(kpi)
                else:
                    long_term.append(kpi)

                total_estimated_improvement += estimated_impact
                priority_counts[priority] += 1
                kpi_count += 1

        return KPIResponse(
            company_id=company_id,
            year=year,
            total_kpis=kpi_count,
            short_term=short_term,
            mid_term=mid_term,
            long_term=long_term,
            estimated_total_improvement=round(total_estimated_improvement, 1),
            priority_summary=priority_counts,
        )

    # ─── 4. WHAT-IF SIMULATION ───────────────────────────────────────────

    async def simulate_actions(
        self, company_id: UUID, year: int, actions: list[SimulationAction]
    ) -> SimulationResponse:
        """
        Simulate the impact of specific improvement actions on ESG scores.

        For each action, calculates before/after scores and deltas.
        """
        current_scores = await self.compute_scores(company_id, year)
        current_overall = current_scores.overall_score

        # Build mutable copy of sub-indicator scores
        sub_scores: dict[str, float] = {}
        for pillar in [current_scores.environmental, current_scores.social, current_scores.governance]:
            for si in pillar.sub_indicators:
                sub_scores[si.code] = si.adjusted_score

        results: list[SimulationResult] = []
        cumulative_deltas: dict[str, float] = {"E": 0, "S": 0, "G": 0, "overall": 0}

        for action in actions:
            # Find the sub-indicator
            target_code = action.sub_indicator.upper()
            if target_code not in sub_scores:
                # Try to match by name
                for code, _ in sub_scores.items():
                    if code.startswith(action.pillar.upper()):
                        target_code = code
                        break

            before_sub = sub_scores.get(target_code, 50)
            after_sub = _clamp(before_sub + action.estimated_improvement)
            sub_scores[target_code] = after_sub

            # Recalculate pillar score
            pillar_code = action.pillar.upper()
            pillar_subs = [si for si in SUB_INDICATORS.get(pillar_code, []) if si["code"] == target_code or True]
            before_pillar = self._get_pillar_score(current_scores, pillar_code)

            # Compute new pillar score from updated sub-scores
            new_pillar = 0.0
            for si_def in SUB_INDICATORS.get(pillar_code, []):
                new_pillar += sub_scores.get(si_def["code"], 0) * si_def["weight"]
            new_pillar = _clamp(new_pillar)

            # New overall
            new_overall = 0.0
            for pc, pw in PILLAR_WEIGHTS.items():
                if pc == pillar_code:
                    new_overall += new_pillar * pw
                else:
                    new_overall += self._get_pillar_score(current_scores, pc) * pw
            new_overall = _clamp(new_overall)

            pillar_delta = round(new_pillar - before_pillar, 2)
            overall_delta = round(new_overall - current_overall, 2)

            cumulative_deltas[pillar_code] += pillar_delta
            cumulative_deltas["overall"] += overall_delta

            results.append(SimulationResult(
                action_id=action.action_id,
                action_name=action.name,
                pillar=pillar_code,
                before_pillar_score=round(before_pillar, 2),
                after_pillar_score=round(new_pillar, 2),
                pillar_delta=pillar_delta,
                before_overall=round(current_overall, 2),
                after_overall=round(new_overall, 2),
                overall_delta=overall_delta,
                before_grade=_score_to_grade(current_overall),
                after_grade=_score_to_grade(new_overall),
            ))

            # Update running overall for next action
            current_overall = new_overall

        # Final projected scores after all actions
        final_overall = current_overall
        total_improvement = round(final_overall - current_scores.overall_score, 2)

        return SimulationResponse(
            company_id=company_id,
            year=year,
            current_overall_score=current_scores.overall_score,
            current_grade=current_scores.overall_grade,
            projected_overall_score=round(final_overall, 2),
            projected_grade=_score_to_grade(final_overall),
            total_improvement=total_improvement,
            results=results,
            cumulative_impact={k: round(v, 2) for k, v in cumulative_deltas.items()},
        )

    def _get_pillar_score(self, scores: ESGScoreResponse, pillar_code: str) -> float:
        mapping = {"E": scores.environmental, "S": scores.social, "G": scores.governance}
        return mapping[pillar_code].raw_score

    # ─── 5. MULTI-SCENARIO SIMULATION ────────────────────────────────────

    async def simulate_scenarios(
        self, company_id: UUID, year: int
    ) -> MultiScenarioResponse:
        """
        Simulate 3 improvement scenarios:
          1. Conservative — easy wins, 3-6 months, low investment
          2. Moderate — balanced approach, 6-12 months, medium investment
          3. Aggressive — full ESG transformation, 12-18 months, high investment
        """
        scores = await self.compute_scores(company_id, year)
        current = scores.overall_score

        scenarios: list[ScenarioProjection] = []

        # ── Conservative ──
        conservative_e = _clamp(scores.environmental.raw_score + self._scenario_lift(scores.environmental, 0.3))
        conservative_s = _clamp(scores.social.raw_score + self._scenario_lift(scores.social, 0.3))
        conservative_g = _clamp(scores.governance.raw_score + self._scenario_lift(scores.governance, 0.3))
        conservative_overall = _clamp(
            conservative_e * PILLAR_WEIGHTS["E"]
            + conservative_s * PILLAR_WEIGHTS["S"]
            + conservative_g * PILLAR_WEIGHTS["G"]
        )
        scenarios.append(ScenarioProjection(
            scenario="conservative",
            label="Conservative Improvement",
            description="Focus on quick wins: data completeness, basic policy documentation, and easy compliance gaps. Minimal disruption to operations.",
            projected_overall=round(conservative_overall, 2),
            projected_environmental=round(conservative_e, 2),
            projected_social=round(conservative_s, 2),
            projected_governance=round(conservative_g, 2),
            projected_grade=_score_to_grade(conservative_overall),
            improvement_delta=round(conservative_overall - current, 2),
            timeline_months=6,
            actions_required=3,
            estimated_investment="low",
        ))

        # ── Moderate ──
        moderate_e = _clamp(scores.environmental.raw_score + self._scenario_lift(scores.environmental, 0.6))
        moderate_s = _clamp(scores.social.raw_score + self._scenario_lift(scores.social, 0.6))
        moderate_g = _clamp(scores.governance.raw_score + self._scenario_lift(scores.governance, 0.6))
        moderate_overall = _clamp(
            moderate_e * PILLAR_WEIGHTS["E"]
            + moderate_s * PILLAR_WEIGHTS["S"]
            + moderate_g * PILLAR_WEIGHTS["G"]
        )
        scenarios.append(ScenarioProjection(
            scenario="moderate",
            label="Moderate ESG Strategy",
            description="Balanced approach targeting key weaknesses across all pillars. Includes process improvements, enhanced reporting, and stakeholder engagement programs.",
            projected_overall=round(moderate_overall, 2),
            projected_environmental=round(moderate_e, 2),
            projected_social=round(moderate_s, 2),
            projected_governance=round(moderate_g, 2),
            projected_grade=_score_to_grade(moderate_overall),
            improvement_delta=round(moderate_overall - current, 2),
            timeline_months=12,
            actions_required=7,
            estimated_investment="medium",
        ))

        # ── Aggressive ──
        aggressive_e = _clamp(scores.environmental.raw_score + self._scenario_lift(scores.environmental, 1.0))
        aggressive_s = _clamp(scores.social.raw_score + self._scenario_lift(scores.social, 1.0))
        aggressive_g = _clamp(scores.governance.raw_score + self._scenario_lift(scores.governance, 1.0))
        aggressive_overall = _clamp(
            aggressive_e * PILLAR_WEIGHTS["E"]
            + aggressive_s * PILLAR_WEIGHTS["S"]
            + aggressive_g * PILLAR_WEIGHTS["G"]
        )
        scenarios.append(ScenarioProjection(
            scenario="aggressive",
            label="Aggressive ESG Transformation",
            description="Full-scale ESG transformation with significant investment. Targets industry leadership through comprehensive programs, advanced tracking, third-party verification, and public commitments.",
            projected_overall=round(aggressive_overall, 2),
            projected_environmental=round(aggressive_e, 2),
            projected_social=round(aggressive_s, 2),
            projected_governance=round(aggressive_g, 2),
            projected_grade=_score_to_grade(aggressive_overall),
            improvement_delta=round(aggressive_overall - current, 2),
            timeline_months=18,
            actions_required=12,
            estimated_investment="high",
        ))

        # Recommendation
        if current < 45:
            recommendation = "Your current ESG score is below industry average. We recommend starting with the Moderate strategy to achieve meaningful improvement within 12 months, prioritizing data completeness and governance foundations."
        elif current < 65:
            recommendation = "Your score is near industry average. The Moderate strategy offers the best ROI, closing key gaps in 12 months. Consider the Aggressive path if you aim for ESG leadership positioning."
        elif current < 80:
            recommendation = "You're performing above average. The Conservative strategy can maintain momentum, while the Aggressive strategy would position you among industry leaders within 18 months."
        else:
            recommendation = "Excellent ESG performance. The Conservative strategy is sufficient to maintain your leading position. Focus on continuous improvement and emerging regulatory requirements."

        return MultiScenarioResponse(
            company_id=company_id,
            year=year,
            current_score=current,
            current_grade=scores.overall_grade,
            scenarios=scenarios,
            recommendation=recommendation,
        )

    def _scenario_lift(self, pillar: PillarBreakdown, intensity: float) -> float:
        """
        Calculate score lift for a scenario.
        Stronger lift for weaker sub-indicators (diminishing returns model).
        intensity: 0.0–1.0 (conservative → aggressive)
        """
        total_lift = 0.0
        for si in pillar.sub_indicators:
            gap = 100 - si.adjusted_score
            # Diminishing returns: harder to improve high scores
            lift = gap * intensity * 0.35
            total_lift += lift * si.weight
        return total_lift

    # ─── 6. COMPANY COMPARISON ───────────────────────────────────────────

    async def compare_companies(
        self, company_ids: list[UUID], year: int
    ) -> ComparisonResponse:
        """
        Compare multiple companies side-by-side with rankings.
        """
        summaries: list[CompanyScoreSummary] = []

        for cid in company_ids:
            company = await self.company_repo.get_by_id(cid)
            scores = await self.compute_scores(cid, year)

            summaries.append(CompanyScoreSummary(
                company_id=cid,
                company_name=company.name if company else "Unknown",
                sector=company.sector if company else None,
                overall_score=scores.overall_score,
                environmental_score=scores.environmental.raw_score,
                social_score=scores.social.raw_score,
                governance_score=scores.governance.raw_score,
                grade=scores.overall_grade,
                rank=0,  # filled below
                strengths=scores.environmental.strengths[:2]
                + scores.social.strengths[:2]
                + scores.governance.strengths[:2],
                weaknesses=scores.environmental.weaknesses[:2]
                + scores.social.weaknesses[:2]
                + scores.governance.weaknesses[:2],
            ))

        # Rank by overall score descending
        summaries.sort(key=lambda s: s.overall_score, reverse=True)
        for i, s in enumerate(summaries):
            s.rank = i + 1

        # Rankings list
        ranking = [
            {
                "rank": s.rank,
                "company_id": str(s.company_id),
                "company_name": s.company_name,
                "overall_score": s.overall_score,
                "grade": s.grade,
            }
            for s in summaries
        ]

        # Best per category
        best_e = max(summaries, key=lambda s: s.environmental_score)
        best_s = max(summaries, key=lambda s: s.social_score)
        best_g = max(summaries, key=lambda s: s.governance_score)

        analysis = (
            f"Compared {len(summaries)} companies for year {year}. "
            f"Top performer: {summaries[0].company_name} (score: {summaries[0].overall_score}, grade: {summaries[0].grade}). "
            f"Best Environmental: {best_e.company_name} ({best_e.environmental_score}). "
            f"Best Social: {best_s.company_name} ({best_s.social_score}). "
            f"Best Governance: {best_g.company_name} ({best_g.governance_score})."
        )

        return ComparisonResponse(
            year=year,
            companies=summaries,
            ranking=ranking,
            best_environmental=best_e.company_id,
            best_social=best_s.company_id,
            best_governance=best_g.company_id,
            analysis_summary=analysis,
        )
