"""Merge 002_platform_features and 002_add_financial_intelligence into a single head.

Revision ID: 003_merge_002_branches
Revises: 002_add_financial_intelligence, 002_platform_features
Create Date: 2026-05-18
"""
from alembic import op

revision = "003_merge_002_branches"
down_revision = ("002_add_financial_intelligence", "002_platform_features")
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
