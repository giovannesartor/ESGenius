"""
Funding Readiness Cockpit.

Per-instrument checklist + score. Used by CFOs preparing for an SLL,
Green Bond, IPO, M&A or PE fundraise.

Each instrument has a curated checklist (gold-standard requirements) keyed
to underlying ESG datapoints / disclosures the platform tracks.
"""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.company import Company
from app.domain.models.data_point import DataPoint
from app.domain.models.financial import FundingReadinessAssessment
from app.services.financial_score_service import FinancialScoreService, spread_bps_from_score

logger = logging.getLogger(__name__)


CHECKLISTS: dict[str, list[dict[str, Any]]] = {
    "SLL": [  # Sustainability-Linked Loan
        {"id": "kpi_definition", "label": "Defined SPTs aligned with materiality", "weight": 15},
        {"id": "baseline_audit", "label": "Audited baseline year (Scope 1+2)", "weight": 12},
        {"id": "external_assurance", "label": "Limited assurance from Big-4 / equivalent", "weight": 12},
        {"id": "icma_alignment", "label": "ICMA SLLP alignment statement", "weight": 10},
        {"id": "second_party_opinion", "label": "Second Party Opinion provider lined up", "weight": 8},
        {"id": "annual_reporting", "label": "Annual SPT reporting commitment", "weight": 8},
        {"id": "step_up_clause", "label": "Margin step-up/down clause draft", "weight": 8},
        {"id": "sbti_target", "label": "SBTi-validated decarbonization target", "weight": 12},
        {"id": "csrd_disclosures", "label": "CSRD ESRS E1+E2 disclosure-ready", "weight": 8},
        {"id": "governance_oversight", "label": "Board-level ESG oversight charter", "weight": 7},
    ],
    "GREEN_BOND": [
        {"id": "use_of_proceeds", "label": "Use-of-proceeds taxonomy mapping (EU/CBI)", "weight": 18},
        {"id": "project_eligibility", "label": "Eligible project categories defined", "weight": 12},
        {"id": "icma_gbp", "label": "ICMA Green Bond Principles alignment", "weight": 12},
        {"id": "second_party_opinion", "label": "SPO commissioned (Sustainalytics/ISS/etc.)", "weight": 12},
        {"id": "tracking_system", "label": "Proceeds tracking ledger system", "weight": 10},
        {"id": "impact_reporting", "label": "Annual impact reporting framework", "weight": 10},
        {"id": "external_assurance", "label": "External assurance on allocation report", "weight": 8},
        {"id": "eu_taxonomy_eligibility", "label": "EU Taxonomy DNSH compliance", "weight": 10},
        {"id": "do_no_significant_harm", "label": "DNSH analysis per environmental objective", "weight": 8},
    ],
    "IPO_ESG": [
        {"id": "csrd_baseline", "label": "Two-year CSRD-ready disclosure history", "weight": 15},
        {"id": "issb_alignment", "label": "IFRS S1+S2 reporting", "weight": 15},
        {"id": "tcfd_disclosure", "label": "TCFD-aligned scenario analysis", "weight": 12},
        {"id": "external_assurance", "label": "Limited or reasonable assurance", "weight": 12},
        {"id": "double_materiality", "label": "Documented double materiality assessment", "weight": 10},
        {"id": "board_diversity", "label": "Board diversity ≥30% (gender/ethnic)", "weight": 8},
        {"id": "governance_charter", "label": "Sustainability committee charter", "weight": 8},
        {"id": "controversy_clearance", "label": "Material controversies disclosed/resolved", "weight": 10},
        {"id": "supply_chain_dd", "label": "Supply-chain due diligence (CSDDD-ready)", "weight": 10},
    ],
    "M&A": [
        {"id": "esg_due_diligence", "label": "ESG due diligence pack ready", "weight": 20},
        {"id": "carbon_inventory", "label": "Verified carbon inventory (Scope 1-3)", "weight": 15},
        {"id": "controversy_disclosure", "label": "Full controversy registry", "weight": 12},
        {"id": "litigation_pack", "label": "Environmental litigation summary", "weight": 10},
        {"id": "permits_compliance", "label": "All operating permits current", "weight": 10},
        {"id": "labor_compliance", "label": "Labor & H&S compliance audit", "weight": 10},
        {"id": "land_rights", "label": "Land-rights / FPIC documentation", "weight": 8},
        {"id": "transition_plan", "label": "1.5°C-aligned transition plan", "weight": 8},
        {"id": "data_pack", "label": "Buyer data-room ESG pack assembled", "weight": 7},
    ],
    "PE": [  # Private Equity
        {"id": "value_creation_plan", "label": "100-day ESG value-creation plan", "weight": 18},
        {"id": "kpi_dashboard", "label": "Quarterly ESG KPI dashboard", "weight": 12},
        {"id": "sfdr_classification", "label": "SFDR Article 8 / 9 readiness", "weight": 12},
        {"id": "iso_certifications", "label": "ISO 14001 / 45001 certifications", "weight": 10},
        {"id": "ghg_baseline", "label": "Verified GHG baseline (PCAF-aligned)", "weight": 10},
        {"id": "sbti_pathway", "label": "SBTi pathway commitment", "weight": 12},
        {"id": "board_governance", "label": "Independent ESG board representation", "weight": 8},
        {"id": "exit_readiness", "label": "ESG exit-readiness pack", "weight": 10},
        {"id": "policy_pack", "label": "Code of conduct + grievance mechanism", "weight": 8},
    ],
}


def _heuristic_completion(item_id: str, datapoint_codes: set[str], company: Company) -> float:
    """
    Returns 0..1 completion estimate. MVP heuristic — replaceable by AI agent
    that reads documents and verifies each item.
    """
    cov = len(datapoint_codes) / 100.0
    base = min(1.0, cov)
    # Force key items to need explicit datapoints
    bumps = {
        "csrd_disclosures": 0.8 if any(c.startswith("ESRS") for c in datapoint_codes) else 0.2,
        "csrd_baseline":    0.8 if any(c.startswith("ESRS") for c in datapoint_codes) else 0.1,
        "issb_alignment":   0.8 if any(c.startswith("IFRS") for c in datapoint_codes) else 0.2,
        "tcfd_disclosure":  0.7 if any("TCFD" in c for c in datapoint_codes) else 0.3,
        "sbti_target":      0.0,  # require explicit attribute on company
        "sbti_pathway":     0.0,
        "external_assurance": 0.3,  # default partial
    }
    if item_id in bumps:
        return bumps[item_id]
    return round(base, 2)


def _status(score: float) -> str:
    if score >= 75:
        return "green"
    if score >= 50:
        return "amber"
    return "red"


class FundingReadinessService:
    INSTRUMENTS = list(CHECKLISTS.keys())

    @staticmethod
    async def assess(
        db: AsyncSession, company: Company, instrument: str, *, persist: bool = True
    ) -> FundingReadinessAssessment:
        if instrument not in CHECKLISTS:
            raise ValueError(f"Unsupported instrument {instrument}; choose {list(CHECKLISTS)}")

        rows = await db.execute(
            select(DataPoint.category).where(DataPoint.company_id == company.id)
        )
        datapoint_codes = {c for (c,) in rows.all() if c}

        checklist_out: list[dict[str, Any]] = []
        gaps: list[dict[str, Any]] = []
        weighted = 0.0
        total_w = 0
        for item in CHECKLISTS[instrument]:
            completion = _heuristic_completion(item["id"], datapoint_codes, company)
            score = round(completion * 100, 1)
            checklist_out.append({**item, "completion_pct": score})
            weighted += completion * item["weight"]
            total_w += item["weight"]
            if completion < 0.6:
                gaps.append({
                    "id": item["id"], "label": item["label"], "weight": item["weight"],
                    "completion_pct": score, "severity": "high" if completion < 0.3 else "medium",
                })

        overall = round((weighted / total_w) * 100 if total_w else 0, 1)

        # Estimate pricing benefit using current ESG financial score (if any)
        latest_score = await FinancialScoreService.latest_for_company(db, company.id)
        benefit_bps: float | None = None
        if latest_score:
            # if readiness completes the gaps, projected score uplift ≈ 5-15 points
            projected_uplift = (100 - overall) * 0.15
            projected_score = min(100.0, latest_score.score + projected_uplift)
            benefit_bps = round(spread_bps_from_score(latest_score.score) - spread_bps_from_score(projected_score), 2)

        remediation_plan = [
            {
                "id": g["id"],
                "action": f"Complete: {g['label']}",
                "effort_weeks": 2 if g["weight"] <= 10 else 6,
                "owner_suggested": "ESG/Finance team",
            }
            for g in gaps
        ]

        record = FundingReadinessAssessment(
            company_id=company.id,
            instrument=instrument,
            overall_score=overall,
            status=_status(overall),
            checklist=checklist_out,
            gaps=gaps,
            remediation_plan=remediation_plan,
            estimated_pricing_benefit_bps=benefit_bps,
        )
        if persist:
            db.add(record)
            await db.commit()
            await db.refresh(record)
        return record


def list_instruments() -> list[dict[str, Any]]:
    return [
        {"code": k, "label": k.replace("_", " ").title(), "items": len(v),
         "max_score": sum(i["weight"] for i in v)}
        for k, v in CHECKLISTS.items()
    ]
