"""Audit logs endpoints (read-only for company admins)."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_active_user
from app.core.database import get_db
from app.domain.models.user import User
from app.domain.schemas.platform import AuditLogResponse
from app.repositories.platform_repos import AuditLogRepository

router = APIRouter(prefix="/audit-logs", tags=["audit"])


@router.get("", response_model=list[AuditLogResponse])
async def list_audit_logs(
    company_id: UUID,
    action: str | None = None,
    entity_type: str | None = None,
    skip: int = 0,
    limit: int = Query(100, le=500),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    repo = AuditLogRepository(db)
    return await repo.list_for_company(
        company_id, action=action, entity_type=entity_type, skip=skip, limit=limit
    )
