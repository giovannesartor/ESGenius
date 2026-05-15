"""add collaboration, audit, webhooks, rag, reports v2, regulatory, chat

Revision ID: 002_platform_features
Revises: 001_add_stripe_subscriptions
Create Date: 2026-05-15
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "002_platform_features"
down_revision = "001_add_stripe_subscriptions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # comments
    op.create_table(
        "comments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("author_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("entity_type", sa.String(20), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column("parent_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("comments.id", ondelete="CASCADE"), nullable=True),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("is_resolved", sa.Boolean, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # tasks
    op.create_table(
        "tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("entity_type", sa.String(20), nullable=True),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=True, index=True),
        sa.Column("assignee_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("status", sa.String(20), server_default="open", nullable=False),
        sa.Column("priority", sa.String(20), server_default="medium", nullable=False),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # notifications
    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=True),
        sa.Column("type", sa.String(40), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("body", sa.Text, nullable=True),
        sa.Column("link_url", sa.String(500), nullable=True),
        sa.Column("payload", postgresql.JSON, nullable=True),
        sa.Column("is_read", sa.Boolean, server_default="false", index=True),
        sa.Column("email_sent", sa.Boolean, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), index=True),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
    )

    # audit_logs
    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=True, index=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("action", sa.String(100), nullable=False, index=True),
        sa.Column("entity_type", sa.String(50), nullable=True, index=True),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=True, index=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("before_state", postgresql.JSON, nullable=True),
        sa.Column("after_state", postgresql.JSON, nullable=True),
        sa.Column("ip_address", sa.String(50), nullable=True),
        sa.Column("user_agent", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), index=True),
    )

    # webhooks
    op.create_table(
        "webhooks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("url", sa.String(1000), nullable=False),
        sa.Column("secret", sa.String(255), nullable=False),
        sa.Column("events", postgresql.JSON, nullable=False, server_default="[]"),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("last_triggered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failure_count", sa.Integer, server_default="0"),
    )
    op.create_table(
        "webhook_deliveries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("webhook_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("webhooks.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("event", sa.String(100), nullable=False),
        sa.Column("payload", postgresql.JSON, nullable=False),
        sa.Column("response_status", sa.Integer, nullable=True),
        sa.Column("response_body", sa.Text, nullable=True),
        sa.Column("success", sa.Boolean, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # api_keys
    op.create_table(
        "api_keys",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("key_prefix", sa.String(20), nullable=False, index=True),
        sa.Column("key_hash", sa.String(255), nullable=False, index=True),
        sa.Column("scopes", postgresql.JSON, server_default="[]"),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # document_chunks
    op.create_table(
        "document_chunks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("document_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("chunk_index", sa.Integer, nullable=False),
        sa.Column("page_number", sa.Integer, nullable=True),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("token_count", sa.Integer, nullable=True),
        sa.Column("embedding", postgresql.JSON, nullable=True),
        sa.Column("embedding_model", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # report_versions
    op.create_table(
        "report_versions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("report_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("version_number", sa.Integer, nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("content_json", postgresql.JSON, nullable=True),
        sa.Column("esg_scores", postgresql.JSON, nullable=True),
        sa.Column("file_path", sa.Text, nullable=True),
        sa.Column("change_summary", sa.Text, nullable=True),
        sa.Column("language", sa.String(10), server_default="en"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # report_templates
    op.create_table(
        "report_templates",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(255), unique=True, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("sector", sa.String(100), nullable=True, index=True),
        sa.Column("region", sa.String(100), nullable=True, index=True),
        sa.Column("framework_codes", postgresql.JSON, server_default="[]"),
        sa.Column("language", sa.String(10), server_default="en"),
        sa.Column("structure", postgresql.JSON, nullable=False),
        sa.Column("is_premium", sa.Boolean, server_default="false"),
        sa.Column("is_official", sa.Boolean, server_default="true"),
        sa.Column("download_count", sa.Integer, server_default="0"),
        sa.Column("rating", sa.Float, server_default="0"),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # regulatory_updates
    op.create_table(
        "regulatory_updates",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("summary", sa.Text, nullable=False),
        sa.Column("body", sa.Text, nullable=True),
        sa.Column("source", sa.String(100), nullable=False),
        sa.Column("region", sa.String(100), nullable=True, index=True),
        sa.Column("sectors", postgresql.JSON, server_default="[]"),
        sa.Column("framework_codes", postgresql.JSON, server_default="[]"),
        sa.Column("severity", sa.String(20), server_default="info"),
        sa.Column("effective_date", sa.Date, nullable=True),
        sa.Column("deadline_date", sa.Date, nullable=True, index=True),
        sa.Column("url", sa.String(1000), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), server_default=sa.func.now(), index=True),
    )

    # emission_factors
    op.create_table(
        "emission_factors",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("scope", sa.Integer, nullable=False, index=True),
        sa.Column("category", sa.String(100), nullable=False, index=True),
        sa.Column("subcategory", sa.String(100), nullable=True),
        sa.Column("activity", sa.String(255), nullable=False),
        sa.Column("region", sa.String(100), nullable=True, index=True),
        sa.Column("factor", sa.Float, nullable=False),
        sa.Column("unit", sa.String(50), nullable=False),
        sa.Column("source", sa.String(100), nullable=False),
        sa.Column("year", sa.Integer, nullable=False, server_default="2024"),
    )

    # sector_benchmarks
    op.create_table(
        "sector_benchmarks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("sector", sa.String(100), nullable=False, index=True),
        sa.Column("region", sa.String(100), nullable=True, index=True),
        sa.Column("year", sa.Integer, nullable=False, index=True),
        sa.Column("metric_code", sa.String(100), nullable=False, index=True),
        sa.Column("avg_value", sa.Float, nullable=False),
        sa.Column("median_value", sa.Float, nullable=True),
        sa.Column("p25", sa.Float, nullable=True),
        sa.Column("p75", sa.Float, nullable=True),
        sa.Column("sample_size", sa.Integer, server_default="0"),
        sa.Column("unit", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # carbon_emissions
    op.create_table(
        "carbon_emissions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("year", sa.Integer, nullable=False, index=True),
        sa.Column("scope", sa.Integer, nullable=False, index=True),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("activity", sa.String(255), nullable=False),
        sa.Column("quantity", sa.Float, nullable=False),
        sa.Column("unit", sa.String(50), nullable=False),
        sa.Column("factor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("emission_factors.id", ondelete="SET NULL"), nullable=True),
        sa.Column("co2e_kg", sa.Float, nullable=False),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # chat
    op.create_table(
        "chat_conversations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("title", sa.String(500), server_default="New conversation"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "chat_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("chat_conversations.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("citations", postgresql.JSON, nullable=True),
        sa.Column("tokens", sa.Integer, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), index=True),
    )

    # Add demo_mode flag to companies
    op.add_column("companies", sa.Column("is_demo", sa.Boolean, server_default="false", nullable=False))
    # Add page_references / source_chunk_ids to data_points
    op.add_column("data_points", sa.Column("source_chunk_ids", postgresql.JSON, nullable=True))
    op.add_column("data_points", sa.Column("source_page", sa.Integer, nullable=True))
    # Notification preferences on user
    op.add_column("users", sa.Column("notification_prefs", postgresql.JSON, nullable=True))


def downgrade() -> None:
    op.drop_column("users", "notification_prefs")
    op.drop_column("data_points", "source_page")
    op.drop_column("data_points", "source_chunk_ids")
    op.drop_column("companies", "is_demo")
    op.drop_table("chat_messages")
    op.drop_table("chat_conversations")
    op.drop_table("carbon_emissions")
    op.drop_table("sector_benchmarks")
    op.drop_table("emission_factors")
    op.drop_table("regulatory_updates")
    op.drop_table("report_templates")
    op.drop_table("report_versions")
    op.drop_table("document_chunks")
    op.drop_table("api_keys")
    op.drop_table("webhook_deliveries")
    op.drop_table("webhooks")
    op.drop_table("audit_logs")
    op.drop_table("notifications")
    op.drop_table("tasks")
    op.drop_table("comments")
