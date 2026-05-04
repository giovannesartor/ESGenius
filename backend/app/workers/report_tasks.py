"""Celery tasks for report generation."""

import logging
from asgiref.sync import async_to_sync

from app.core.celery_app import celery_app
from app.core.database import AsyncSessionLocal
from app.services.report_service import ReportService

logger = logging.getLogger(__name__)


@celery_app.task(name="app.workers.report_tasks.generate_report_task", bind=True, max_retries=2)
def generate_report_task(self, report_id: str) -> dict:
    """Generate an ESG report asynchronously using asgiref."""
    try:
        return async_to_sync(_generate_report)(report_id)
    except Exception as exc:
        logger.error(f"Report task failed for {report_id}: {exc}")
        raise self.retry(exc=exc, countdown=30)


async def _generate_report(report_id: str) -> dict:
    """Async report generation — runs inside async_to_sync wrapper."""
    async with AsyncSessionLocal() as db:
        try:
            service = ReportService(db)
            await service.process_report(report_id)
            await db.commit()
            return {"status": "completed", "report_id": report_id}
        except Exception as exc:
            await db.rollback()
            logger.error(f"Failed to generate report {report_id}: {exc}")
            raise
