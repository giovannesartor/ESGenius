"""Repositories for new platform features (compact module)."""

from datetime import datetime, timezone
from typing import Optional, Sequence
from uuid import UUID

from sqlalchemy import and_, desc, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.audit_log import AuditLog
from app.domain.models.chat import ChatConversation, ChatMessage
from app.domain.models.comment import Comment, Task
from app.domain.models.document_chunk import DocumentChunk
from app.domain.models.notification import Notification
from app.domain.models.regulatory import (
    CarbonEmission,
    EmissionFactor,
    RegulatoryUpdate,
    SectorBenchmark,
)
from app.domain.models.report_version import ReportTemplate, ReportVersion
from app.domain.models.webhook import ApiKey, Webhook, WebhookDelivery


# ---------------- Comments ----------------
class CommentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, comment: Comment) -> Comment:
        self.db.add(comment)
        await self.db.flush()
        await self.db.refresh(comment)
        return comment

    async def get(self, comment_id: UUID) -> Optional[Comment]:
        return (await self.db.execute(select(Comment).where(Comment.id == comment_id))).scalar_one_or_none()

    async def list_for_entity(self, company_id: UUID, entity_type: str, entity_id: UUID) -> Sequence[Comment]:
        result = await self.db.execute(
            select(Comment)
            .where(
                and_(
                    Comment.company_id == company_id,
                    Comment.entity_type == entity_type,
                    Comment.entity_id == entity_id,
                )
            )
            .order_by(Comment.created_at.asc())
        )
        return result.scalars().all()

    async def update(self, comment: Comment) -> Comment:
        await self.db.flush()
        await self.db.refresh(comment)
        return comment

    async def delete(self, comment: Comment) -> None:
        await self.db.delete(comment)
        await self.db.flush()


# ---------------- Tasks ----------------
class TaskRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, task: Task) -> Task:
        self.db.add(task)
        await self.db.flush()
        await self.db.refresh(task)
        return task

    async def get(self, task_id: UUID) -> Optional[Task]:
        return (await self.db.execute(select(Task).where(Task.id == task_id))).scalar_one_or_none()

    async def list_for_company(
        self,
        company_id: UUID,
        assignee_id: Optional[UUID] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ) -> Sequence[Task]:
        q = select(Task).where(Task.company_id == company_id)
        if assignee_id:
            q = q.where(Task.assignee_id == assignee_id)
        if status:
            q = q.where(Task.status == status)
        q = q.order_by(desc(Task.created_at)).limit(limit)
        return (await self.db.execute(q)).scalars().all()

    async def update(self, task: Task) -> Task:
        await self.db.flush()
        await self.db.refresh(task)
        return task

    async def delete(self, task: Task) -> None:
        await self.db.delete(task)
        await self.db.flush()


# ---------------- Notifications ----------------
class NotificationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, notif: Notification) -> Notification:
        self.db.add(notif)
        await self.db.flush()
        await self.db.refresh(notif)
        return notif

    async def list_for_user(
        self, user_id: UUID, unread_only: bool = False, limit: int = 50
    ) -> Sequence[Notification]:
        q = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            q = q.where(Notification.is_read.is_(False))
        q = q.order_by(desc(Notification.created_at)).limit(limit)
        return (await self.db.execute(q)).scalars().all()

    async def count_unread(self, user_id: UUID) -> int:
        from sqlalchemy import func

        result = await self.db.execute(
            select(func.count(Notification.id)).where(
                and_(Notification.user_id == user_id, Notification.is_read.is_(False))
            )
        )
        return int(result.scalar() or 0)

    async def mark_read(self, notif_id: UUID, user_id: UUID) -> None:
        await self.db.execute(
            update(Notification)
            .where(and_(Notification.id == notif_id, Notification.user_id == user_id))
            .values(is_read=True, read_at=datetime.now(timezone.utc))
        )
        await self.db.flush()

    async def mark_all_read(self, user_id: UUID) -> None:
        await self.db.execute(
            update(Notification)
            .where(and_(Notification.user_id == user_id, Notification.is_read.is_(False)))
            .values(is_read=True, read_at=datetime.now(timezone.utc))
        )
        await self.db.flush()


# ---------------- Audit ----------------
class AuditLogRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, log: AuditLog) -> AuditLog:
        self.db.add(log)
        await self.db.flush()
        return log

    async def list_for_company(
        self,
        company_id: UUID,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        limit: int = 100,
        skip: int = 0,
    ) -> Sequence[AuditLog]:
        q = select(AuditLog).where(AuditLog.company_id == company_id)
        if action:
            q = q.where(AuditLog.action == action)
        if entity_type:
            q = q.where(AuditLog.entity_type == entity_type)
        q = q.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit)
        return (await self.db.execute(q)).scalars().all()


# ---------------- Webhooks / API Keys ----------------
class WebhookRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, w: Webhook) -> Webhook:
        self.db.add(w)
        await self.db.flush()
        await self.db.refresh(w)
        return w

    async def get(self, webhook_id: UUID) -> Optional[Webhook]:
        return (await self.db.execute(select(Webhook).where(Webhook.id == webhook_id))).scalar_one_or_none()

    async def list_for_company(self, company_id: UUID) -> Sequence[Webhook]:
        result = await self.db.execute(
            select(Webhook).where(Webhook.company_id == company_id).order_by(desc(Webhook.created_at))
        )
        return result.scalars().all()

    async def list_for_event(self, company_id: UUID, event: str) -> Sequence[Webhook]:
        result = await self.db.execute(
            select(Webhook).where(and_(Webhook.company_id == company_id, Webhook.is_active.is_(True)))
        )
        return [w for w in result.scalars().all() if event in (w.events or [])]

    async def delete(self, w: Webhook) -> None:
        await self.db.delete(w)
        await self.db.flush()

    async def add_delivery(self, d: WebhookDelivery) -> None:
        self.db.add(d)
        await self.db.flush()


class ApiKeyRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, k: ApiKey) -> ApiKey:
        self.db.add(k)
        await self.db.flush()
        await self.db.refresh(k)
        return k

    async def list_for_company(self, company_id: UUID) -> Sequence[ApiKey]:
        result = await self.db.execute(
            select(ApiKey).where(ApiKey.company_id == company_id).order_by(desc(ApiKey.created_at))
        )
        return result.scalars().all()

    async def get_by_hash(self, key_hash: str) -> Optional[ApiKey]:
        return (
            await self.db.execute(select(ApiKey).where(ApiKey.key_hash == key_hash, ApiKey.is_active.is_(True)))
        ).scalar_one_or_none()

    async def delete(self, k: ApiKey) -> None:
        await self.db.delete(k)
        await self.db.flush()


# ---------------- Chunks ----------------
class DocumentChunkRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def bulk_create(self, chunks: list[DocumentChunk]) -> None:
        self.db.add_all(chunks)
        await self.db.flush()

    async def list_for_company(self, company_id: UUID, limit: int = 1000) -> Sequence[DocumentChunk]:
        result = await self.db.execute(
            select(DocumentChunk).where(DocumentChunk.company_id == company_id).limit(limit)
        )
        return result.scalars().all()

    async def list_for_document(self, document_id: UUID) -> Sequence[DocumentChunk]:
        result = await self.db.execute(
            select(DocumentChunk)
            .where(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.chunk_index.asc())
        )
        return result.scalars().all()


# ---------------- Report versions / templates ----------------
class ReportVersionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, v: ReportVersion) -> ReportVersion:
        self.db.add(v)
        await self.db.flush()
        await self.db.refresh(v)
        return v

    async def list_for_report(self, report_id: UUID) -> Sequence[ReportVersion]:
        result = await self.db.execute(
            select(ReportVersion)
            .where(ReportVersion.report_id == report_id)
            .order_by(desc(ReportVersion.version_number))
        )
        return result.scalars().all()

    async def get(self, version_id: UUID) -> Optional[ReportVersion]:
        return (
            await self.db.execute(select(ReportVersion).where(ReportVersion.id == version_id))
        ).scalar_one_or_none()

    async def get_by_number(self, report_id: UUID, version_number: int) -> Optional[ReportVersion]:
        return (
            await self.db.execute(
                select(ReportVersion).where(
                    and_(ReportVersion.report_id == report_id, ReportVersion.version_number == version_number)
                )
            )
        ).scalar_one_or_none()

    async def next_version_number(self, report_id: UUID) -> int:
        from sqlalchemy import func

        result = await self.db.execute(
            select(func.coalesce(func.max(ReportVersion.version_number), 0)).where(
                ReportVersion.report_id == report_id
            )
        )
        return int(result.scalar() or 0) + 1


class ReportTemplateRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, t: ReportTemplate) -> ReportTemplate:
        self.db.add(t)
        await self.db.flush()
        await self.db.refresh(t)
        return t

    async def list_all(
        self,
        sector: Optional[str] = None,
        region: Optional[str] = None,
        framework: Optional[str] = None,
        language: Optional[str] = None,
    ) -> Sequence[ReportTemplate]:
        q = select(ReportTemplate)
        if sector:
            q = q.where(ReportTemplate.sector == sector)
        if region:
            q = q.where(ReportTemplate.region == region)
        if language:
            q = q.where(ReportTemplate.language == language)
        q = q.order_by(desc(ReportTemplate.rating), desc(ReportTemplate.download_count))
        result = (await self.db.execute(q)).scalars().all()
        if framework:
            result = [t for t in result if framework in (t.framework_codes or [])]
        return result

    async def get(self, template_id: UUID) -> Optional[ReportTemplate]:
        return (
            await self.db.execute(select(ReportTemplate).where(ReportTemplate.id == template_id))
        ).scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Optional[ReportTemplate]:
        return (
            await self.db.execute(select(ReportTemplate).where(ReportTemplate.slug == slug))
        ).scalar_one_or_none()

    async def increment_downloads(self, template_id: UUID) -> None:
        from sqlalchemy import func

        await self.db.execute(
            update(ReportTemplate)
            .where(ReportTemplate.id == template_id)
            .values(download_count=func.coalesce(ReportTemplate.download_count, 0) + 1)
        )
        await self.db.flush()


# ---------------- Regulatory / emissions ----------------
class RegulatoryUpdateRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, r: RegulatoryUpdate) -> RegulatoryUpdate:
        self.db.add(r)
        await self.db.flush()
        return r

    async def list_recent(
        self,
        region: Optional[str] = None,
        sector: Optional[str] = None,
        framework: Optional[str] = None,
        limit: int = 30,
    ) -> Sequence[RegulatoryUpdate]:
        q = select(RegulatoryUpdate)
        if region:
            q = q.where(RegulatoryUpdate.region == region)
        q = q.order_by(desc(RegulatoryUpdate.published_at)).limit(limit * 3)
        result = (await self.db.execute(q)).scalars().all()
        items = list(result)
        if sector:
            items = [r for r in items if not r.sectors or sector in r.sectors]
        if framework:
            items = [r for r in items if framework in (r.framework_codes or [])]
        return items[:limit]


class EmissionFactorRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_all(
        self,
        scope: Optional[int] = None,
        category: Optional[str] = None,
        region: Optional[str] = None,
    ) -> Sequence[EmissionFactor]:
        q = select(EmissionFactor)
        if scope:
            q = q.where(EmissionFactor.scope == scope)
        if category:
            q = q.where(EmissionFactor.category == category)
        if region:
            q = q.where(EmissionFactor.region == region)
        return (await self.db.execute(q)).scalars().all()

    async def find_factor(
        self, scope: int, activity: str, region: Optional[str] = None
    ) -> Optional[EmissionFactor]:
        q = select(EmissionFactor).where(
            and_(EmissionFactor.scope == scope, EmissionFactor.activity == activity)
        )
        if region:
            q = q.where(EmissionFactor.region == region)
        result = (await self.db.execute(q.limit(1))).scalar_one_or_none()
        if result:
            return result
        # fallback without region
        return (
            await self.db.execute(
                select(EmissionFactor)
                .where(and_(EmissionFactor.scope == scope, EmissionFactor.activity == activity))
                .limit(1)
            )
        ).scalar_one_or_none()


class CarbonEmissionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, e: CarbonEmission) -> CarbonEmission:
        self.db.add(e)
        await self.db.flush()
        await self.db.refresh(e)
        return e

    async def list_for_company(self, company_id: UUID, year: Optional[int] = None) -> Sequence[CarbonEmission]:
        q = select(CarbonEmission).where(CarbonEmission.company_id == company_id)
        if year:
            q = q.where(CarbonEmission.year == year)
        q = q.order_by(desc(CarbonEmission.created_at))
        return (await self.db.execute(q)).scalars().all()


class SectorBenchmarkRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(
        self,
        sector: str,
        metric_code: str,
        year: int,
        region: Optional[str] = None,
    ) -> Optional[SectorBenchmark]:
        q = select(SectorBenchmark).where(
            and_(
                SectorBenchmark.sector == sector,
                SectorBenchmark.metric_code == metric_code,
                SectorBenchmark.year == year,
            )
        )
        if region:
            q = q.where(SectorBenchmark.region == region)
        return (await self.db.execute(q.limit(1))).scalar_one_or_none()

    async def list_for_sector(self, sector: str, year: int) -> Sequence[SectorBenchmark]:
        result = await self.db.execute(
            select(SectorBenchmark).where(
                and_(SectorBenchmark.sector == sector, SectorBenchmark.year == year)
            )
        )
        return result.scalars().all()

    async def upsert(self, b: SectorBenchmark) -> SectorBenchmark:
        self.db.add(b)
        await self.db.flush()
        return b


# ---------------- Chat ----------------
class ChatRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_conversation(self, c: ChatConversation) -> ChatConversation:
        self.db.add(c)
        await self.db.flush()
        await self.db.refresh(c)
        return c

    async def get_conversation(self, conv_id: UUID, user_id: UUID) -> Optional[ChatConversation]:
        return (
            await self.db.execute(
                select(ChatConversation).where(
                    and_(ChatConversation.id == conv_id, ChatConversation.user_id == user_id)
                )
            )
        ).scalar_one_or_none()

    async def list_conversations(self, user_id: UUID, company_id: UUID) -> Sequence[ChatConversation]:
        result = await self.db.execute(
            select(ChatConversation)
            .where(and_(ChatConversation.user_id == user_id, ChatConversation.company_id == company_id))
            .order_by(desc(ChatConversation.updated_at))
            .limit(50)
        )
        return result.scalars().all()

    async def list_messages(self, conv_id: UUID) -> Sequence[ChatMessage]:
        result = await self.db.execute(
            select(ChatMessage).where(ChatMessage.conversation_id == conv_id).order_by(ChatMessage.created_at.asc())
        )
        return result.scalars().all()

    async def add_message(self, m: ChatMessage) -> ChatMessage:
        self.db.add(m)
        await self.db.flush()
        await self.db.refresh(m)
        return m
