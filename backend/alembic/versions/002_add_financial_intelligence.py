"""add ESG financial intelligence tables

Revision ID: 002_add_financial_intelligence
Revises: 001_add_stripe_subscriptions
Create Date: 2026-05-20
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "002_add_financial_intelligence"
down_revision = "001_add_stripe_subscriptions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ESG Financial Score
    op.create_table(
        "esg_financial_scores",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("company_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("year", sa.Integer, nullable=False),
        sa.Column("score", sa.Float, nullable=False),
        sa.Column("performance_score", sa.Float, nullable=False),
        sa.Column("disclosure_score", sa.Float, nullable=False),
        sa.Column("forward_risk_score", sa.Float, nullable=False),
        sa.Column("spread_bps", sa.Float, nullable=False),
        sa.Column("wacc_adjustment_bps", sa.Float, nullable=False),
        sa.Column("rating_band", sa.String(8), nullable=False),
        sa.Column("sector", sa.String(64), nullable=True),
        sa.Column("sector_percentile", sa.Float, nullable=True),
        sa.Column("drivers", sa.JSON, server_default="{}"),
        sa.Column("explainability", sa.JSON, server_default="{}"),
        sa.Column("methodology_version", sa.String(16), server_default="v1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("company_id", "year", "methodology_version", name="uq_score_company_year_v"),
    )

    # Climate scenarios
    op.create_table(
        "climate_scenario_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("company_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("scenario", sa.String(32), nullable=False),
        sa.Column("horizon_years", sa.Integer, nullable=False),
        sa.Column("physical_var", sa.Float, nullable=False),
        sa.Column("transition_var", sa.Float, nullable=False),
        sa.Column("total_var", sa.Float, nullable=False),
        sa.Column("ebitda_at_risk_pct", sa.Float, nullable=False),
        sa.Column("carbon_price_assumed", sa.Float, nullable=True),
        sa.Column("exposed_assets", sa.JSON, server_default="{}"),
        sa.Column("methodology", sa.JSON, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Funding readiness
    op.create_table(
        "funding_readiness_assessments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("company_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("instrument", sa.String(32), nullable=False),
        sa.Column("overall_score", sa.Float, nullable=False),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("checklist", sa.JSON, server_default="[]"),
        sa.Column("gaps", sa.JSON, server_default="[]"),
        sa.Column("remediation_plan", sa.JSON, server_default="[]"),
        sa.Column("estimated_pricing_benefit_bps", sa.Float, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Credit intelligence
    op.create_table(
        "credit_intelligence_assessments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("owner_company_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("counterparty_name", sa.String(255), nullable=False),
        sa.Column("counterparty_company_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("companies.id", ondelete="SET NULL"), nullable=True),
        sa.Column("base_pd", sa.Float, nullable=False),
        sa.Column("esg_adjustment_bps", sa.Float, nullable=False),
        sa.Column("adjusted_pd", sa.Float, nullable=False),
        sa.Column("base_lgd", sa.Float, nullable=True),
        sa.Column("adjusted_lgd", sa.Float, nullable=True),
        sa.Column("rationale", sa.JSON, server_default="{}"),
        sa.Column("exposure_usd", sa.Float, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Valuation impact
    op.create_table(
        "valuation_impacts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("company_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("base_wacc", sa.Float, nullable=False),
        sa.Column("esg_adjusted_wacc", sa.Float, nullable=False),
        sa.Column("base_beta", sa.Float, nullable=True),
        sa.Column("esg_adjusted_beta", sa.Float, nullable=True),
        sa.Column("base_terminal_growth", sa.Float, nullable=True),
        sa.Column("esg_adjusted_terminal_growth", sa.Float, nullable=True),
        sa.Column("base_enterprise_value_usd", sa.Float, nullable=True),
        sa.Column("esg_adjusted_enterprise_value_usd", sa.Float, nullable=True),
        sa.Column("delta_pct", sa.Float, nullable=True),
        sa.Column("inputs", sa.JSON, server_default="{}"),
        sa.Column("methodology", sa.JSON, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # MACC
    op.create_table(
        "abatement_options",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("company_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("category", sa.String(64), nullable=False),
        sa.Column("scope", sa.Integer, nullable=False),
        sa.Column("abatement_potential_tco2e", sa.Float, nullable=False),
        sa.Column("cost_per_tonne_usd", sa.Float, nullable=False),
        sa.Column("capex_usd", sa.Float, nullable=True),
        sa.Column("opex_delta_usd", sa.Float, nullable=True),
        sa.Column("payback_years", sa.Float, nullable=True),
        sa.Column("implementation_status", sa.String(32), server_default="proposed"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Portfolios + holdings
    op.create_table(
        "portfolios",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("owner_company_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("aum_usd", sa.Float, nullable=True),
        sa.Column("base_currency", sa.String(8), server_default="USD"),
        sa.Column("portfolio_type", sa.String(32), server_default="equity"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_table(
        "portfolio_holdings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("portfolio_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("company_name", sa.String(255), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("companies.id", ondelete="SET NULL"), nullable=True),
        sa.Column("ticker", sa.String(32), nullable=True),
        sa.Column("sector", sa.String(64), nullable=True),
        sa.Column("country", sa.String(8), nullable=True),
        sa.Column("weight_pct", sa.Float, nullable=False),
        sa.Column("market_value_usd", sa.Float, nullable=True),
        sa.Column("last_esg_score", sa.Float, nullable=True),
        sa.Column("last_climate_var_pct", sa.Float, nullable=True),
        sa.Column("last_controversy_count", sa.Integer, server_default="0"),
        sa.Column("last_refreshed_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Framework knowledge graph
    op.create_table(
        "framework_mappings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("source_framework", sa.String(32), nullable=False, index=True),
        sa.Column("source_code", sa.String(64), nullable=False),
        sa.Column("source_label", sa.String(512), nullable=False),
        sa.Column("target_framework", sa.String(32), nullable=False, index=True),
        sa.Column("target_code", sa.String(64), nullable=False),
        sa.Column("target_label", sa.String(512), nullable=False),
        sa.Column("relationship_type", sa.String(16), server_default="equivalent"),
        sa.Column("confidence", sa.Float, server_default="1.0"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.UniqueConstraint("source_framework", "source_code", "target_framework", "target_code",
                            name="uq_framework_mapping_edge"),
    )


def downgrade() -> None:
    for tbl in [
        "framework_mappings",
        "portfolio_holdings",
        "portfolios",
        "abatement_options",
        "valuation_impacts",
        "credit_intelligence_assessments",
        "funding_readiness_assessments",
        "climate_scenario_results",
        "esg_financial_scores",
    ]:
        op.drop_table(tbl)
