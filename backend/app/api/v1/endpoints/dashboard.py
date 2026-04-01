"""Dashboard API endpoints."""

from datetime import datetime
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


@router.get("/scores")
async def get_esg_scores(
    company_id: UUID,
    year: int = Query(default=datetime.now().year),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get ESG scores for the company dashboard."""
    service = CompanyService(db)
    role = await service.get_user_role(company_id, current_user.id)
    if not role:
        raise PermissionDeniedException("No access to this company")

    scoring = ScoringService(db)
    return await scoring.calculate_scores(company_id, year)


@router.get("/audit")
async def get_audit_results(
    company_id: UUID,
    year: int = Query(default=datetime.now().year),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Run audit and return results for dashboard."""
    service = CompanyService(db)
    role = await service.get_user_role(company_id, current_user.id)
    if not role:
        raise PermissionDeniedException("No access to this company")

    audit = AuditService(db)
    return await audit.run_full_audit(company_id, year)


@router.get("/framework-coverage/{framework_id}")
async def get_framework_coverage(
    company_id: UUID,
    framework_id: UUID,
    year: int = Query(default=datetime.now().year),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get framework coverage stats for dashboard."""
    service = CompanyService(db)
    role = await service.get_user_role(company_id, current_user.id)
    if not role:
        raise PermissionDeniedException("No access to this company")

    scoring = ScoringService(db)
    return await scoring.calculate_framework_coverage(company_id, framework_id, year)
