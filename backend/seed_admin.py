"""Seed default superadmin users on first run."""

import asyncio
import os

from sqlalchemy import select
from app.core.database import engine, AsyncSessionLocal
from app.core.security import get_password_hash
from app.domain.models.user import User


ADMINS = [
    {
        "email": os.getenv("ADMIN_EMAIL", "giovannesartor@gmail.com"),
        "password": os.getenv("ADMIN_PASSWORD", "Giotop12@"),
        "name": os.getenv("ADMIN_NAME", "Giovanne Sartor"),
    },
]

# Support additional admins via ADMIN2_*, ADMIN3_*, etc.
for i in range(2, 10):
    email = os.getenv(f"ADMIN{i}_EMAIL")
    if email:
        ADMINS.append({
            "email": email,
            "password": os.getenv(f"ADMIN{i}_PASSWORD", "ChangeMe123!"),
            "name": os.getenv(f"ADMIN{i}_NAME", "Admin"),
        })


async def _seed_one(session, email: str, password: str, name: str):
    """Create or promote a single admin."""
    result = await session.execute(
        select(User).where(User.email == email)
    )
    existing = result.scalar_one_or_none()

    if existing:
        changed = False
        if not existing.is_superadmin:
            existing.is_superadmin = True
            changed = True
        if os.getenv("RESET_ADMIN_PASSWORD", "false").lower() in ("1", "true", "yes"):
            existing.hashed_password = get_password_hash(password)
            existing.is_active = True
            existing.is_email_verified = True
            existing.auth_provider = "local"
            changed = True
            print(f"[SEED] Password reset for {email}")
        if changed:
            await session.commit()
            print(f"[SEED] Updated {email}")
        else:
            print(f"[SEED] Superadmin {email} already exists — skipping")
    else:
        admin = User(
            email=email,
            hashed_password=get_password_hash(password),
            full_name=name,
            is_active=True,
            is_superadmin=True,
            is_email_verified=True,
            auth_provider="local",
        )
        session.add(admin)
        await session.commit()
        print(f"[SEED] Created superadmin: {email}")


async def seed_admin():
    """Create default superadmins if they don't exist."""
    async with AsyncSessionLocal() as session:
        for adm in ADMINS:
            await _seed_one(session, adm["email"], adm["password"], adm["name"])


if __name__ == "__main__":
    asyncio.run(seed_admin())
