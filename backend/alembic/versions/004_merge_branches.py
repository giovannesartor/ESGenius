"""Merge migration branches: 002_add_financial_intelligence + 002_platform_features.

Both 002_ migrations branched from 001_ creating a split head.
This migration merges them into a single linear chain so future
alembic upgrade head works correctly.

Revision ID: 004_merge_branches
Revises: 003_add_partner_admin_modules, 002_platform_features
Create Date: 2026-05-18
"""
from alembic import op

revision = "004_merge_branches"
down_revision = ("003_add_partner_admin_modules", "002_platform_features")
branch_labels = None
depends_on = None


def upgrade() -> None:
    # No-op merge point — all schema changes live in their respective migrations.
    # The idempotent ALTER TABLE patches in start.sh guarantee missing columns
    # are added even if 002_platform_features ran before this migration was added.
    pass


def downgrade() -> None:
    pass
