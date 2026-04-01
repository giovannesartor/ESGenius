"""Report repository — database operations for reports."""

from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.report import Report


class ReportRepository:
    """Handles all database operations for the Report model."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, report_id: UUID) -> Optional[Report]:
        result = await self.db.execute(
            select(Report).where(Report.id == report_id)
        )
        return result.scalar_one_or_none()

    async def create(self, report: Report) -> Report:
        self.db.add(report)
        await self.db.flush()
        await self.db.refresh(report)
        return report

    async def update(self, report: Report) -> Report:
        await self.db.flush()
        await self.db.refresh(report)
        return report

    async def list_by_company(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Report]:
        result = await self.db.execute(
            select(Report)
            .where(Report.company_id == company_id)
            .offset(skip)
            .limit(limit)
            .order_by(Report.created_at.desc())
        )
        return list(result.scalars().all())
