"""Framework repository — database operations for frameworks."""

from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.models.framework import Framework, Category, Indicator, Metric


class FrameworkRepository:
    """Handles all database operations for framework-related models."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # --- Framework ---
    async def get_framework_by_id(self, framework_id: UUID) -> Optional[Framework]:
        result = await self.db.execute(
            select(Framework).where(Framework.id == framework_id)
        )
        return result.scalar_one_or_none()

    async def get_framework_by_code(self, code: str) -> Optional[Framework]:
        result = await self.db.execute(
            select(Framework).where(Framework.code == code)
        )
        return result.scalar_one_or_none()

    async def get_framework_full(self, framework_id: UUID) -> Optional[Framework]:
        result = await self.db.execute(
            select(Framework)
            .options(
                selectinload(Framework.categories)
                .selectinload(Category.indicators)
                .selectinload(Indicator.metrics)
            )
            .where(Framework.id == framework_id)
        )
        return result.scalar_one_or_none()

    async def list_frameworks(self, active_only: bool = True) -> list[Framework]:
        query = select(Framework).order_by(Framework.name)
        if active_only:
            query = query.where(Framework.is_active == True)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_framework(self, framework: Framework) -> Framework:
        self.db.add(framework)
        await self.db.flush()
        await self.db.refresh(framework)
        return framework

    async def update_framework(self, framework: Framework) -> Framework:
        await self.db.flush()
        await self.db.refresh(framework)
        return framework

    # --- Category ---
    async def create_category(self, category: Category) -> Category:
        self.db.add(category)
        await self.db.flush()
        await self.db.refresh(category)
        return category

    async def list_categories(self, framework_id: UUID) -> list[Category]:
        result = await self.db.execute(
            select(Category)
            .where(Category.framework_id == framework_id)
            .order_by(Category.sort_order)
        )
        return list(result.scalars().all())

    # --- Indicator ---
    async def create_indicator(self, indicator: Indicator) -> Indicator:
        self.db.add(indicator)
        await self.db.flush()
        await self.db.refresh(indicator)
        return indicator

    async def list_indicators(self, category_id: UUID) -> list[Indicator]:
        result = await self.db.execute(
            select(Indicator)
            .where(Indicator.category_id == category_id)
            .order_by(Indicator.sort_order)
        )
        return list(result.scalars().all())

    # --- Metric ---
    async def create_metric(self, metric: Metric) -> Metric:
        self.db.add(metric)
        await self.db.flush()
        await self.db.refresh(metric)
        return metric

    async def list_metrics(self, indicator_id: UUID) -> list[Metric]:
        result = await self.db.execute(
            select(Metric).where(Metric.indicator_id == indicator_id)
        )
        return list(result.scalars().all())

    async def get_all_metrics_for_framework(self, framework_id: UUID) -> list[Metric]:
        result = await self.db.execute(
            select(Metric)
            .join(Indicator)
            .join(Category)
            .where(Category.framework_id == framework_id)
        )
        return list(result.scalars().all())
