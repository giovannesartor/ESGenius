"""Seed default superadmin user on first run."""

import asyncio
import os

from sqlalchemy import select
from app.core.database import engine, AsyncSessionLocal
from app.core.security import get_password_hash
from app.domain.models.user import User

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "giovannesartor@gmail.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Giotop12@")
ADMIN_NAME = os.getenv("ADMIN_NAME", "Giovanne Sartor")


async def seed_admin():
    """Create default superadmin if it doesn't exist."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.email == ADMIN_EMAIL)
        )
        existing = result.scalar_one_or_none()

        if existing:
            # Ensure existing user is superadmin
            if not existing.is_superadmin:
                existing.is_superadmin = True
                await session.commit()
                print(f"[SEED] Updated {ADMIN_EMAIL} to superadmin")
            else:
                print(f"[SEED] Superadmin {ADMIN_EMAIL} already exists — skipping")
        else:
            admin = User(
                email=ADMIN_EMAIL,
                hashed_password=get_password_hash(ADMIN_PASSWORD),
                full_name=ADMIN_NAME,
                is_active=True,
                is_superadmin=True,
                is_email_verified=True,
                auth_provider="local",
            )
            session.add(admin)
            await session.commit()
            print(f"[SEED] Created superadmin: {ADMIN_EMAIL}")


if __name__ == "__main__":
    asyncio.run(seed_admin())
