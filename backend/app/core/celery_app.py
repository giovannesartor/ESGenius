"""Celery application configuration for background tasks."""

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "esg360",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={
        "app.workers.document_tasks.*": {"queue": "documents"},
        "app.workers.ai_tasks.*": {"queue": "ai"},
        "app.workers.report_tasks.*": {"queue": "reports"},
    },
)

celery_app.autodiscover_tasks([
    "app.workers",
])
