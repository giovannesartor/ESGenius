"""Celery tasks for document processing."""

import asyncio
import logging
from datetime import datetime, timezone

from app.core.celery_app import celery_app
from app.core.database import AsyncSessionLocal
from app.domain.models.document import DocumentStatus
from app.repositories.document_repository import DocumentRepository
from app.services.document_service import DocumentProcessor
from app.ai.deepseek_engine import DeepSeekEngine

logger = logging.getLogger(__name__)


@celery_app.task(name="app.workers.document_tasks.process_document_task", bind=True, max_retries=3)
def process_document_task(self, document_id: str) -> dict:
    """Process an uploaded document: extract text, tables, and analyze with AI."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(_process_document(document_id))
    finally:
        loop.close()


async def _process_document(document_id: str) -> dict:
    """Async document processing pipeline."""
    async with AsyncSessionLocal() as db:
        repo = DocumentRepository(db)
        doc = await repo.get_by_id(document_id)

        if not doc:
            return {"error": "Document not found"}

        try:
            # Update status
            doc.status = DocumentStatus.PROCESSING.value
            await repo.update(doc)
            await db.commit()

            # Extract text/data
            processor = DocumentProcessor()
            extracted = processor.process_file(doc.file_path, doc.file_type)

            doc.extracted_text = extracted.get("full_text", "")
            doc.extracted_tables = extracted.get("tables") or extracted.get("sheets")
            doc.page_count = extracted.get("page_count")
            doc.status = DocumentStatus.EXTRACTED.value
            await repo.update(doc)
            await db.commit()

            # AI analysis
            doc.status = DocumentStatus.AI_PROCESSING.value
            await repo.update(doc)
            await db.commit()

            ai_engine = DeepSeekEngine()
            text_to_analyze = doc.extracted_text or ""

            if text_to_analyze:
                # Extract ESG data
                extraction = ai_engine.extract_esg_data(text_to_analyze[:15000])  # Limit token usage

                # Classify data
                data_points = extraction.get("data", {}).get("data_points", [])
                if data_points:
                    classification = ai_engine.classify_esg_data(data_points)
                else:
                    classification = {"data": {}}

                doc.ai_analysis = {
                    "extraction": extraction.get("data", {}),
                    "classification": classification.get("data", {}),
                }

            doc.status = DocumentStatus.COMPLETED.value
            doc.processed_at = datetime.now(timezone.utc)

        except Exception as e:
            logger.error(f"Document processing failed for {document_id}: {e}")
            doc.status = DocumentStatus.FAILED.value
            doc.processing_error = str(e)

        await repo.update(doc)
        await db.commit()

        return {"status": doc.status, "document_id": document_id}
