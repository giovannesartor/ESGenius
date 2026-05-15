"""Webhook delivery service — signs and POSTs payloads to subscribed URLs."""

import hashlib
import hmac
import json
import logging
import secrets
from typing import Any
from uuid import UUID

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.webhook import WebhookDelivery
from app.repositories.platform_repos import WebhookRepository

logger = logging.getLogger(__name__)


def generate_secret() -> str:
    return f"whsec_{secrets.token_urlsafe(32)}"


def sign(secret: str, body: bytes) -> str:
    digest = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    return f"sha256={digest}"


class WebhookService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = WebhookRepository(db)

    async def dispatch(self, company_id: UUID, event: str, payload: dict[str, Any]) -> int:
        """Send event to all webhooks subscribed for this company+event. Returns # delivered."""
        webhooks = await self.repo.list_for_event(company_id, event)
        delivered = 0
        if not webhooks:
            return 0

        body = json.dumps({"event": event, "data": payload}).encode("utf-8")
        async with httpx.AsyncClient(timeout=10.0) as client:
            for w in webhooks:
                signature = sign(w.secret, body)
                status = None
                resp_body = None
                success = False
                try:
                    r = await client.post(
                        w.url,
                        content=body,
                        headers={
                            "Content-Type": "application/json",
                            "X-ESG360-Event": event,
                            "X-ESG360-Signature": signature,
                        },
                    )
                    status = r.status_code
                    resp_body = r.text[:1000]
                    success = 200 <= r.status_code < 300
                    if success:
                        w.failure_count = 0
                        delivered += 1
                    else:
                        w.failure_count = (w.failure_count or 0) + 1
                except Exception as e:  # noqa: BLE001
                    logger.warning(f"webhook delivery error: {e}")
                    resp_body = str(e)[:1000]
                    w.failure_count = (w.failure_count or 0) + 1

                from datetime import datetime, timezone

                w.last_triggered_at = datetime.now(timezone.utc)
                await self.repo.add_delivery(
                    WebhookDelivery(
                        webhook_id=w.id,
                        event=event,
                        payload=payload,
                        response_status=status,
                        response_body=resp_body,
                        success=success,
                    )
                )
        return delivered
