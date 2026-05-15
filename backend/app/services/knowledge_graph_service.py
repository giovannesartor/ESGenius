"""
Framework Knowledge Graph service.

Wraps the FrameworkMapping table to give callers:
  * cross-framework lookups (e.g. CSRD E1-1 -> ISSB IFRS S2 disclosure 12)
  * "report once, comply many" coverage analysis
  * framework dependency graph for visualization
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.financial import FrameworkMapping


SUPPORTED_FRAMEWORKS = [
    "CSRD", "ISSB", "GRI", "TCFD", "SASB", "CDP", "CVM_193",
    "B3", "TNFD", "SBTI", "IFRS_S1", "IFRS_S2", "EU_TAXONOMY",
    "SFDR", "PCAF", "ICMA_GBP", "ICMA_SLLP",
]


async def list_mappings(
    db: AsyncSession,
    source_framework: str | None = None,
    target_framework: str | None = None,
    source_code: str | None = None,
) -> list[FrameworkMapping]:
    q = select(FrameworkMapping)
    if source_framework:
        q = q.where(FrameworkMapping.source_framework == source_framework)
    if target_framework:
        q = q.where(FrameworkMapping.target_framework == target_framework)
    if source_code:
        q = q.where(FrameworkMapping.source_code == source_code)
    rows = await db.execute(q.order_by(FrameworkMapping.source_framework, FrameworkMapping.source_code))
    return list(rows.scalars().all())


async def upsert_mapping(db: AsyncSession, payload: dict[str, Any]) -> FrameworkMapping:
    rows = await db.execute(
        select(FrameworkMapping).where(
            FrameworkMapping.source_framework == payload["source_framework"],
            FrameworkMapping.source_code == payload["source_code"],
            FrameworkMapping.target_framework == payload["target_framework"],
            FrameworkMapping.target_code == payload["target_code"],
        )
    )
    existing = rows.scalar_one_or_none()
    if existing:
        for k, v in payload.items():
            setattr(existing, k, v)
        m = existing
    else:
        m = FrameworkMapping(**payload)
        db.add(m)
    await db.commit()
    await db.refresh(m)
    return m


async def coverage_matrix(db: AsyncSession) -> dict[str, Any]:
    """Returns matrix of source -> target coverage counts for visualization."""
    mappings = await list_mappings(db)
    matrix: dict[str, dict[str, int]] = {}
    for m in mappings:
        matrix.setdefault(m.source_framework, {}).setdefault(m.target_framework, 0)
        matrix[m.source_framework][m.target_framework] += 1
    return {
        "frameworks": SUPPORTED_FRAMEWORKS,
        "matrix": matrix,
        "total_edges": len(mappings),
    }


async def equivalent_disclosures(
    db: AsyncSession, source_framework: str, source_code: str
) -> list[dict[str, Any]]:
    rows = await list_mappings(db, source_framework=source_framework, source_code=source_code)
    return [
        {
            "target_framework": m.target_framework,
            "target_code": m.target_code,
            "target_label": m.target_label,
            "relationship_type": m.relationship_type,
            "confidence": m.confidence,
            "notes": m.notes,
        }
        for m in rows
    ]


# Seed data — minimal cross-mappings the platform ships with.
SEED_MAPPINGS: list[dict[str, Any]] = [
    {
        "source_framework": "CSRD", "source_code": "ESRS_E1-1",
        "source_label": "Transition plan for climate change mitigation",
        "target_framework": "IFRS_S2", "target_code": "S2.14",
        "target_label": "Transition plan disclosure",
        "relationship_type": "equivalent", "confidence": 0.95,
    },
    {
        "source_framework": "CSRD", "source_code": "ESRS_E1-6",
        "source_label": "Gross Scopes 1, 2, 3 and total GHG emissions",
        "target_framework": "IFRS_S2", "target_code": "S2.29",
        "target_label": "Absolute gross GHG emissions Scope 1/2/3",
        "relationship_type": "equivalent", "confidence": 1.0,
    },
    {
        "source_framework": "CSRD", "source_code": "ESRS_E1-6",
        "source_label": "GHG emissions",
        "target_framework": "GRI", "target_code": "305",
        "target_label": "GRI 305: Emissions",
        "relationship_type": "equivalent", "confidence": 0.95,
    },
    {
        "source_framework": "CSRD", "source_code": "ESRS_E1-6",
        "source_label": "GHG emissions",
        "target_framework": "TCFD", "target_code": "Metrics_b",
        "target_label": "TCFD Metrics b: Scope 1/2/3",
        "relationship_type": "equivalent", "confidence": 0.95,
    },
    {
        "source_framework": "IFRS_S2", "source_code": "S2.29",
        "source_label": "GHG emissions",
        "target_framework": "CDP", "target_code": "C6",
        "target_label": "CDP Climate C6 emissions data",
        "relationship_type": "equivalent", "confidence": 0.9,
    },
    {
        "source_framework": "ISSB", "source_code": "IFRS_S1",
        "source_label": "General sustainability disclosures",
        "target_framework": "GRI", "target_code": "2",
        "target_label": "GRI 2: General Disclosures",
        "relationship_type": "partial", "confidence": 0.7,
    },
    {
        "source_framework": "CSRD", "source_code": "ESRS_S1",
        "source_label": "Own workforce",
        "target_framework": "GRI", "target_code": "401-405",
        "target_label": "GRI 401-405 employment & diversity",
        "relationship_type": "equivalent", "confidence": 0.85,
    },
    {
        "source_framework": "CSRD", "source_code": "ESRS_G1",
        "source_label": "Business conduct",
        "target_framework": "GRI", "target_code": "205-206",
        "target_label": "GRI 205 anti-corruption / 206 competition",
        "relationship_type": "equivalent", "confidence": 0.8,
    },
    {
        "source_framework": "CVM_193", "source_code": "ITEM_4",
        "source_label": "Riscos climáticos físicos e de transição",
        "target_framework": "TCFD", "target_code": "Risks",
        "target_label": "TCFD strategy + risk management",
        "relationship_type": "equivalent", "confidence": 0.9,
    },
    {
        "source_framework": "CVM_193", "source_code": "ITEM_5",
        "source_label": "Métricas e metas climáticas",
        "target_framework": "IFRS_S2", "target_code": "S2.29-36",
        "target_label": "Cross-industry metrics & targets",
        "relationship_type": "equivalent", "confidence": 0.95,
    },
    {
        "source_framework": "EU_TAXONOMY", "source_code": "DNSH",
        "source_label": "Do No Significant Harm",
        "target_framework": "ICMA_GBP", "target_code": "ELIGIBILITY",
        "target_label": "Green Bond eligibility / DNSH",
        "relationship_type": "derived", "confidence": 0.85,
    },
    {
        "source_framework": "SBTI", "source_code": "TARGET_1.5C",
        "source_label": "1.5°C-aligned target",
        "target_framework": "ICMA_SLLP", "target_code": "SPT",
        "target_label": "Sustainability-linked SPT",
        "relationship_type": "derived", "confidence": 0.9,
    },
]


async def seed_default_mappings(db: AsyncSession) -> int:
    count = 0
    for payload in SEED_MAPPINGS:
        await upsert_mapping(db, payload)
        count += 1
    return count
