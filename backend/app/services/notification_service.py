"""Notification service — creates in-app notifications + sends optional email."""

import logging
from typing import Any, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.notification import Notification, NotificationType
from app.repositories.platform_repos import NotificationRepository
from app.repositories.user_repository import UserRepository
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = NotificationRepository(db)
        self.user_repo = UserRepository(db)
        self.email = EmailService()

    async def notify(
        self,
        user_id: UUID,
        ntype: str,
        title: str,
        body: Optional[str] = None,
        link_url: Optional[str] = None,
        company_id: Optional[UUID] = None,
        payload: Optional[dict[str, Any]] = None,
        send_email: bool = False,
    ) -> Notification:
        n = Notification(
            user_id=user_id,
            company_id=company_id,
            type=ntype,
            title=title,
            body=body,
            link_url=link_url,
            payload=payload,
        )
        n = await self.repo.create(n)

        if send_email:
            try:
                user = await self.user_repo.get_by_id(user_id)
                prefs = (user.notification_prefs or {}) if user else {}
                if user and user.email and prefs.get("email_enabled", True):
                    types_filter = prefs.get("types") or []
                    if not types_filter or ntype in types_filter:
                        subject = f"[ESG360] {title}"
                        html = f"""
                        <h2>{title}</h2>
                        <p>{body or ''}</p>
                        {f'<p><a href="{link_url}">View in app</a></p>' if link_url else ''}
                        """
                        await self.email._send_email(to=user.email, subject=subject, html=html)
                        n.email_sent = True
                        await self.db.flush()
            except Exception as e:  # noqa: BLE001
                logger.warning(f"notification email failed: {e}")

        return n

    async def notify_company_admins(
        self,
        company_id: UUID,
        ntype: str,
        title: str,
        body: Optional[str] = None,
        link_url: Optional[str] = None,
        send_email: bool = False,
    ) -> int:
        from app.repositories.company_repository import CompanyRepository

        crepo = CompanyRepository(self.db)
        members = await crepo.list_members(company_id)
        count = 0
        for m in members:
            if m.role in ("admin", "manager"):
                await self.notify(
                    user_id=m.user_id,
                    ntype=ntype,
                    title=title,
                    body=body,
                    link_url=link_url,
                    company_id=company_id,
                    send_email=send_email,
                )
                count += 1
        return count
