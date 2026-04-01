"""Company repository — database operations for companies."""

from typing import Optional
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.models.company import Company, CompanyUser


class CompanyRepository:
    """Handles all database operations for Company and CompanyUser models."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # --- Company ---
    async def get_by_id(self, company_id: UUID) -> Optional[Company]:
        result = await self.db.execute(
            select(Company).where(Company.id == company_id)
        )
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Optional[Company]:
        result = await self.db.execute(
            select(Company).where(Company.slug == slug)
        )
        return result.scalar_one_or_none()

    async def create(self, company: Company) -> Company:
        self.db.add(company)
        await self.db.flush()
        await self.db.refresh(company)
        return company

    async def update(self, company: Company) -> Company:
        await self.db.flush()
        await self.db.refresh(company)
        return company

    async def delete(self, company: Company) -> None:
        await self.db.delete(company)
        await self.db.flush()

    async def list_for_user(self, user_id: UUID) -> list[Company]:
        result = await self.db.execute(
            select(Company)
            .join(CompanyUser)
            .where(CompanyUser.user_id == user_id)
            .order_by(Company.created_at.desc())
        )
        return list(result.scalars().all())

    # --- CompanyUser ---
    async def get_membership(
        self, company_id: UUID, user_id: UUID
    ) -> Optional[CompanyUser]:
        result = await self.db.execute(
            select(CompanyUser).where(
                CompanyUser.company_id == company_id,
                CompanyUser.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def add_member(self, membership: CompanyUser) -> CompanyUser:
        self.db.add(membership)
        await self.db.flush()
        await self.db.refresh(membership)
        return membership

    async def remove_member(self, membership: CompanyUser) -> None:
        await self.db.delete(membership)
        await self.db.flush()

    async def list_members(self, company_id: UUID) -> list[CompanyUser]:
        result = await self.db.execute(
            select(CompanyUser)
            .options(selectinload(CompanyUser.user))
            .where(CompanyUser.company_id == company_id)
        )
        return list(result.scalars().all())

    async def count_members(self, company_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count(CompanyUser.id)).where(
                CompanyUser.company_id == company_id
            )
        )
        return result.scalar_one()
