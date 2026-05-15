"""
Financial Intelligence domain models.

Implements the data tier for the ESG Financial Intelligence Infrastructure:
  * ESGFinancialScore — score 0-100 with bps translation per company/year
  * ClimateScenarioResult — NGFS/IEA scenario outcomes per company
  * FundingReadinessAssessment — readiness cockpit per instrument
  * CreditIntelligenceAssessment — ESG-adjusted PD/LGD per counterparty
  * ValuationImpact — WACC-adjusted DCF deltas
  * AbatementOption — entries on the marginal abatement cost curve
  * Portfolio / PortfolioHolding — buy-side aggregation
  * FrameworkMapping — knowledge graph edges between framework datapoints
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


# ---------------------------------------------------------------------------
# ESG Financial Score
# ---------------------------------------------------------------------------


class ESGFinancialScore(Base):
    __tablename__ = "esg_financial_scores"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    year: Mapped[int] = mapped_column(Integer, nullable=False)

    # Composite score 0-100
    score: Mapped[float] = mapped_column(Float, nullable=False)
    performance_score: Mapped[float] = mapped_column(Float, nullable=False)  # 40% weight
    disclosure_score: Mapped[float] = mapped_column(Float, nullable=False)  # 30% weight
    forward_risk_score: Mapped[float] = mapped_column(Float, nullable=False)  # 30% weight

    # Financial translation
    spread_bps: Mapped[float] = mapped_column(Float, nullable=False)  # negative = discount
    wacc_adjustment_bps: Mapped[float] = mapped_column(Float, nullable=False)
    rating_band: Mapped[str] = mapped_column(String(8), nullable=False)  # AAA..D

    # Peer context
    sector: Mapped[str | None] = mapped_column(String(64), nullable=True)
    sector_percentile: Mapped[float | None] = mapped_column(Float, nullable=True)
    drivers: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)  # {top_positive:[], top_negative:[]}
    explainability: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)  # SHAP-like
    methodology_version: Mapped[str] = mapped_column(String(16), default="v1")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("company_id", "year", "methodology_version", name="uq_score_company_year_v"),)


# ---------------------------------------------------------------------------
# Climate Risk
# ---------------------------------------------------------------------------


class ClimateScenarioResult(Base):
    __tablename__ = "climate_scenario_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    scenario: Mapped[str] = mapped_column(String(32), nullable=False)  # NGFS_NZE2050, NGFS_DELAYED, NGFS_HOTHOUSE, IEA_STEPS
    horizon_years: Mapped[int] = mapped_column(Integer, nullable=False)  # 1, 5, 10

    # Risk decomposition
    physical_var: Mapped[float] = mapped_column(Float, nullable=False)  # USD
    transition_var: Mapped[float] = mapped_column(Float, nullable=False)  # USD
    total_var: Mapped[float] = mapped_column(Float, nullable=False)
    ebitda_at_risk_pct: Mapped[float] = mapped_column(Float, nullable=False)

    carbon_price_assumed: Mapped[float | None] = mapped_column(Float, nullable=True)  # USD/tCO2e
    exposed_assets: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    methodology: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------------------
# Funding Readiness
# ---------------------------------------------------------------------------


class FundingReadinessAssessment(Base):
    __tablename__ = "funding_readiness_assessments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    instrument: Mapped[str] = mapped_column(String(32), nullable=False)  # SLL, GREEN_BOND, IPO_ESG, M&A, PE
    overall_score: Mapped[float] = mapped_column(Float, nullable=False)  # 0-100
    status: Mapped[str] = mapped_column(String(16), nullable=False)  # red, amber, green
    checklist: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    gaps: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    remediation_plan: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    estimated_pricing_benefit_bps: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------------------
# Credit Intelligence (bank-side)
# ---------------------------------------------------------------------------


class CreditIntelligenceAssessment(Base):
    __tablename__ = "credit_intelligence_assessments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # The bank/lender that owns this assessment (company that BUYS the product)
    owner_company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # The counterparty being assessed (may or may not be a Company in our DB)
    counterparty_name: Mapped[str] = mapped_column(String(255), nullable=False)
    counterparty_company_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="SET NULL"), nullable=True
    )

    base_pd: Mapped[float] = mapped_column(Float, nullable=False)  # baseline PD %
    esg_adjustment_bps: Mapped[float] = mapped_column(Float, nullable=False)
    adjusted_pd: Mapped[float] = mapped_column(Float, nullable=False)
    base_lgd: Mapped[float | None] = mapped_column(Float, nullable=True)
    adjusted_lgd: Mapped[float | None] = mapped_column(Float, nullable=True)

    rationale: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    exposure_usd: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------------------
# Valuation impact
# ---------------------------------------------------------------------------


class ValuationImpact(Base):
    __tablename__ = "valuation_impacts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )

    base_wacc: Mapped[float] = mapped_column(Float, nullable=False)
    esg_adjusted_wacc: Mapped[float] = mapped_column(Float, nullable=False)
    base_beta: Mapped[float | None] = mapped_column(Float, nullable=True)
    esg_adjusted_beta: Mapped[float | None] = mapped_column(Float, nullable=True)
    base_terminal_growth: Mapped[float | None] = mapped_column(Float, nullable=True)
    esg_adjusted_terminal_growth: Mapped[float | None] = mapped_column(Float, nullable=True)

    base_enterprise_value_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    esg_adjusted_enterprise_value_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    delta_pct: Mapped[float | None] = mapped_column(Float, nullable=True)

    inputs: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    methodology: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------------------
# MACC (Marginal Abatement Cost Curve)
# ---------------------------------------------------------------------------


class AbatementOption(Base):
    __tablename__ = "abatement_options"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False)  # energy_efficiency, fuel_switch, electrification, ccs, supply_chain
    scope: Mapped[int] = mapped_column(Integer, nullable=False)  # 1, 2 or 3

    abatement_potential_tco2e: Mapped[float] = mapped_column(Float, nullable=False)  # tCO2e/yr
    cost_per_tonne_usd: Mapped[float] = mapped_column(Float, nullable=False)  # negative = saving
    capex_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    opex_delta_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    payback_years: Mapped[float | None] = mapped_column(Float, nullable=True)
    implementation_status: Mapped[str] = mapped_column(String(32), default="proposed")  # proposed, planned, in_progress, done
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------------------
# Portfolio Intelligence (buy-side)
# ---------------------------------------------------------------------------


class Portfolio(Base):
    __tablename__ = "portfolios"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    aum_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    base_currency: Mapped[str] = mapped_column(String(8), default="USD")
    portfolio_type: Mapped[str] = mapped_column(String(32), default="equity")  # equity, debt, mixed, pe

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    holdings: Mapped[list["PortfolioHolding"]] = relationship(
        back_populates="portfolio", cascade="all, delete-orphan"
    )


class PortfolioHolding(Base):
    __tablename__ = "portfolio_holdings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    portfolio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False, index=True
    )
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    company_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="SET NULL"), nullable=True
    )
    ticker: Mapped[str | None] = mapped_column(String(32), nullable=True)
    sector: Mapped[str | None] = mapped_column(String(64), nullable=True)
    country: Mapped[str | None] = mapped_column(String(8), nullable=True)
    weight_pct: Mapped[float] = mapped_column(Float, nullable=False)  # 0-100
    market_value_usd: Mapped[float | None] = mapped_column(Float, nullable=True)

    # cached scores (refreshed by job)
    last_esg_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_climate_var_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_controversy_count: Mapped[int] = mapped_column(Integer, default=0)
    last_refreshed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    portfolio: Mapped[Portfolio] = relationship(back_populates="holdings")


# ---------------------------------------------------------------------------
# Framework knowledge graph
# ---------------------------------------------------------------------------


class FrameworkMapping(Base):
    """
    Edge in the regulatory knowledge graph.
    Maps one datapoint between two frameworks (e.g. CSRD E1-1 -> ISSB IFRS S2).
    """

    __tablename__ = "framework_mappings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_framework: Mapped[str] = mapped_column(String(32), nullable=False, index=True)  # CSRD, ISSB, GRI...
    source_code: Mapped[str] = mapped_column(String(64), nullable=False)  # E1-1, IFRS S2, etc.
    source_label: Mapped[str] = mapped_column(String(512), nullable=False)
    target_framework: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    target_code: Mapped[str] = mapped_column(String(64), nullable=False)
    target_label: Mapped[str] = mapped_column(String(512), nullable=False)
    relationship_type: Mapped[str] = mapped_column(String(16), default="equivalent")  # equivalent, partial, derived
    confidence: Mapped[float] = mapped_column(Float, default=1.0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint(
            "source_framework", "source_code", "target_framework", "target_code",
            name="uq_framework_mapping_edge",
        ),
    )
