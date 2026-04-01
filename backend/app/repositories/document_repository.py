"""Document repository — database operations for documents."""

from typing import Optional
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.document import Document


class DocumentRepository:
    """Handles all database operations for the Document model."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, document_id: UUID) -> Optional[Document]:
        result = await self.db.execute(
            select(Document).where(Document.id == document_id)
        )
        return result.scalar_one_or_none()

    async def create(self, document: Document) -> Document:
        self.db.add(document)
        await self.db.flush()
        await self.db.refresh(document)
        return document

    async def update(self, document: Document) -> Document:
        await self.db.flush()
        await self.db.refresh(document)
        return document

    async def delete(self, document: Document) -> None:
        await self.db.delete(document)
        await self.db.flush()

    async def list_by_company(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 50,
        status: Optional[str] = None,
    ) -> list[Document]:
        query = select(Document).where(Document.company_id == company_id)
        if status:
            query = query.where(Document.status == status)
        query = query.offset(skip).limit(limit).order_by(Document.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count_by_company(self, company_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count(Document.id)).where(
                Document.company_id == company_id
            )
        )
        return result.scalar_one()
