"""AI Log repository — database operations for AI logs."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.ai_log import AILog


class AILogRepository:
    """Handles all database operations for the AILog model."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, ai_log: AILog) -> AILog:
        self.db.add(ai_log)
        await self.db.flush()
        await self.db.refresh(ai_log)
        return ai_log

    async def list_by_company(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 50,
    ) -> list[AILog]:
        result = await self.db.execute(
            select(AILog)
            .where(AILog.company_id == company_id)
            .offset(skip)
            .limit(limit)
            .order_by(AILog.created_at.desc())
        )
        return list(result.scalars().all())

    async def list_by_document(self, document_id: UUID) -> list[AILog]:
        result = await self.db.execute(
            select(AILog)
            .where(AILog.document_id == document_id)
            .order_by(AILog.created_at.desc())
        )
        return list(result.scalars().all())
