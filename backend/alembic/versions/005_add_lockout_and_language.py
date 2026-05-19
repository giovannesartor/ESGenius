"""Add account lockout fields and preferred_language to users table.

Revision ID: 005_add_lockout_and_language
Revises: 004_merge_branches
Create Date: 2026-05-19
"""
from alembic import op
import sqlalchemy as sa

revision = "005_add_lockout_and_language"
down_revision = "004_merge_branches"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("failed_login_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "users",
        sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column(
            "preferred_language",
            sa.String(length=5),
            nullable=False,
            server_default="en",
        ),
    )
    # Argon2id hashes can be up to ~500 chars — widen the column
    op.alter_column(
        "users",
        "hashed_password",
        existing_type=sa.String(length=255),
        type_=sa.String(length=500),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.drop_column("users", "failed_login_count")
    op.drop_column("users", "locked_until")
    op.drop_column("users", "preferred_language")
    op.alter_column(
        "users",
        "hashed_password",
        existing_type=sa.String(length=500),
        type_=sa.String(length=255),
        existing_nullable=True,
    )
