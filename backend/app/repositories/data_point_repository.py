"""Data point repository — database operations for ESG data points."""

from typing import Optional
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.data_point import DataPoint


class DataPointRepository:
    """Handles all database operations for the DataPoint model."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, data_point_id: UUID) -> Optional[DataPoint]:
        result = await self.db.execute(
            select(DataPoint).where(DataPoint.id == data_point_id)
        )
        return result.scalar_one_or_none()

    async def create(self, data_point: DataPoint) -> DataPoint:
        self.db.add(data_point)
        await self.db.flush()
        await self.db.refresh(data_point)
        return data_point

    async def create_bulk(self, data_points: list[DataPoint]) -> list[DataPoint]:
        self.db.add_all(data_points)
        await self.db.flush()
        for dp in data_points:
            await self.db.refresh(dp)
        return data_points

    async def update(self, data_point: DataPoint) -> DataPoint:
        await self.db.flush()
        await self.db.refresh(data_point)
        return data_point

    async def delete(self, data_point: DataPoint) -> None:
        await self.db.delete(data_point)
        await self.db.flush()

    async def list_by_company(
        self,
        company_id: UUID,
        year: Optional[int] = None,
        pillar: Optional[str] = None,
        category: Optional[str] = None,
        source: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[DataPoint]:
        query = select(DataPoint).where(DataPoint.company_id == company_id)

        if year:
            query = query.where(DataPoint.year == year)
        if pillar:
            query = query.where(DataPoint.pillar == pillar)
        if category:
            query = query.where(DataPoint.category == category)
        if source:
            query = query.where(DataPoint.source == source)
        if status:
            query = query.where(DataPoint.status == status)

        query = query.offset(skip).limit(limit).order_by(DataPoint.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count_by_company(self, company_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count(DataPoint.id)).where(
                DataPoint.company_id == company_id
            )
        )
        return result.scalar_one()

    async def count_by_status(self, company_id: UUID) -> dict[str, int]:
        result = await self.db.execute(
            select(DataPoint.status, func.count(DataPoint.id))
            .where(DataPoint.company_id == company_id)
            .group_by(DataPoint.status)
        )
        return dict(result.all())

    async def get_by_metric_and_year(
        self, company_id: UUID, metric_id: UUID, year: int
    ) -> Optional[DataPoint]:
        result = await self.db.execute(
            select(DataPoint).where(
                DataPoint.company_id == company_id,
                DataPoint.metric_id == metric_id,
                DataPoint.year == year,
            )
        )
        return result.scalar_one_or_none()
