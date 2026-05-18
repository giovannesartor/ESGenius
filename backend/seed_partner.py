"""Seed a test partner account on first run."""

import asyncio
import os
import secrets

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash, verify_password
from app.domain.models.partner import Partner


TEST_PARTNER = {
    "email": os.getenv("TEST_PARTNER_EMAIL", "parceiro@esg360.digital"),
    "password": os.getenv("TEST_PARTNER_PASSWORD", "Parceiro123@"),
    "full_name": os.getenv("TEST_PARTNER_NAME", "Parceiro Teste"),
    "company_name": "ESGenius Demo",
}


def _gen_ref_code() -> str:
    return secrets.token_urlsafe(6).upper()


async def _seed_partner():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Partner).where(Partner.email == TEST_PARTNER["email"])
        )
        existing = result.scalar_one_or_none()

        force_reset = os.getenv("RESET_PARTNER_PASSWORD", "false").lower() in ("1", "true", "yes")

        if existing:
            changed = False
            # Always keep active + approved for test account
            if existing.status != "active":
                existing.status = "active"
                existing.is_active = True
                changed = True
            password_ok = bool(existing.hashed_password) and verify_password(
                TEST_PARTNER["password"], existing.hashed_password
            )
            if force_reset or not password_ok:
                existing.hashed_password = get_password_hash(TEST_PARTNER["password"])
                changed = True
                print(f"[SEED] Partner password (re)synced for {TEST_PARTNER['email']}")
            if changed:
                await session.commit()
                print(f"[SEED] Updated test partner {TEST_PARTNER['email']}")
            else:
                print(f"[SEED] Test partner {TEST_PARTNER['email']} already in sync — skipping")
        else:
            # Generate a unique ref_code
            ref_code = _gen_ref_code()
            for _ in range(10):
                check = await session.execute(select(Partner).where(Partner.ref_code == ref_code))
                if not check.scalar_one_or_none():
                    break
                ref_code = _gen_ref_code()

            partner = Partner(
                email=TEST_PARTNER["email"],
                hashed_password=get_password_hash(TEST_PARTNER["password"]),
                full_name=TEST_PARTNER["full_name"],
                company_name=TEST_PARTNER["company_name"],
                ref_code=ref_code,
                commission_rate=0.20,
                status="active",
                is_active=True,
            )
            session.add(partner)
            await session.commit()
            print(f"[SEED] Created test partner {TEST_PARTNER['email']} (ref: {ref_code})")


if __name__ == "__main__":
    asyncio.run(_seed_partner())
