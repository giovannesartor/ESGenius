"""Dashboard API endpoints."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import PermissionDeniedException
from app.api.dependencies import get_current_user
from app.domain.models.user import User
from app.services.company_service import CompanyService
from app.services.scoring_service import ScoringService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/companies/{company_id}/dashboard", tags=["Dashboard"])


async def _check_company_access(
    company_id: UUID, user: User, db: AsyncSession
) -> None:
    """Verify user has access to company. Superadmin bypasses."""
    if user.is_superadmin:
        return
    service = CompanyService(db)
    role = await service.get_user_role(company_id, user.id)
    if not role:
        raise PermissionDeniedException("No access to this company")


@router.get("/scores")
async def get_esg_scores(
    company_id: UUID,
    year: Optional[int] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get ESG scores for the company dashboard."""
    from datetime import datetime, timezone
    if year is None:
        year = datetime.now(timezone.utc).year
    await _check_company_access(company_id, current_user, db)

    scoring = ScoringService(db)
    return await scoring.calculate_scores(company_id, year)


@router.get("/audit")
async def get_audit_results(
    company_id: UUID,
    year: Optional[int] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Run audit and return results for dashboard."""
    from datetime import datetime, timezone
    if year is None:
        year = datetime.now(timezone.utc).year
    await _check_company_access(company_id, current_user, db)

    audit = AuditService(db)
    return await audit.run_full_audit(company_id, year)


@router.get("/framework-coverage/{framework_id}")
async def get_framework_coverage(
    company_id: UUID,
    framework_id: UUID,
    year: Optional[int] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get framework coverage stats for dashboard."""
    from datetime import datetime, timezone
    if year is None:
        year = datetime.now(timezone.utc).year
    await _check_company_access(company_id, current_user, db)

    scoring = ScoringService(db)
    return await scoring.calculate_framework_coverage(company_id, framework_id, year)
