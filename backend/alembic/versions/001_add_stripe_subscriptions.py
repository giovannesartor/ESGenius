"""add subscriptions table and stripe fields to users

Revision ID: 001_add_stripe_subscriptions
Revises:
Create Date: 2026-05-13

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001_add_stripe_subscriptions"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add stripe fields to users
    op.add_column("users", sa.Column("stripe_customer_id", sa.String(255), nullable=True, unique=True))
    op.add_column("users", sa.Column("subscription_plan", sa.String(50), nullable=False, server_default="free"))

    # Create subscriptions table
    op.create_table(
        "subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("plan", sa.String(50), nullable=False, server_default="free"),
        sa.Column("status", sa.String(50), nullable=False, server_default="active"),
        sa.Column("price", sa.Numeric(10, 2), server_default="0"),
        sa.Column("currency", sa.String(3), server_default="USD"),
        sa.Column("interval", sa.String(10), server_default="month"),
        sa.Column("stripe_subscription_id", sa.String(255), nullable=True, index=True),
        sa.Column("cancel_at_period_end", sa.Boolean, server_default="false"),
        sa.Column("current_period_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("subscriptions")
    op.drop_column("users", "stripe_customer_id")
    op.drop_column("users", "subscription_plan")
