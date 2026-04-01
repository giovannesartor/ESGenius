"""Celery tasks for report generation."""

import asyncio
import logging

from app.core.celery_app import celery_app
from app.core.database import AsyncSessionLocal
from app.services.report_service import ReportService

logger = logging.getLogger(__name__)


@celery_app.task(name="app.workers.report_tasks.generate_report_task", bind=True, max_retries=2)
def generate_report_task(self, report_id: str) -> dict:
    """Generate an ESG report asynchronously."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(_generate_report(report_id))
    finally:
        loop.close()


async def _generate_report(report_id: str) -> dict:
    """Async report generation."""
    async with AsyncSessionLocal() as db:
        service = ReportService(db)
        await service.process_report(report_id)
        await db.commit()
        return {"status": "completed", "report_id": report_id}
