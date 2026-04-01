"""Report API endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import NotFoundException, PermissionDeniedException
from app.api.dependencies import get_current_user
from app.domain.models.user import User
from app.domain.schemas.report import ReportCreate, ReportResponse, ReportListResponse
from app.repositories.report_repository import ReportRepository
from app.services.company_service import CompanyService
from app.services.report_service import ReportService

router = APIRouter(prefix="/companies/{company_id}/reports", tags=["Reports"])


@router.post("/", response_model=ReportResponse, status_code=201)
async def create_report(
    company_id: UUID,
    data: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a new ESG report."""
    if not current_user.is_superadmin:
        service = CompanyService(db)
        role = await service.get_user_role(company_id, current_user.id)
        if role not in ("admin", "manager"):
            raise PermissionDeniedException("Only admins/managers can generate reports")

    report_service = ReportService(db)
    report = await report_service.generate_report(
        company_id=company_id,
        title=data.title,
        report_type=data.report_type,
        format=data.format,
        year=data.year,
        period=data.period,
        generated_by=current_user.id,
    )

    # Trigger async processing
    try:
        from app.workers.report_tasks import generate_report_task
        generate_report_task.delay(str(report.id))
    except Exception:
        # If Celery isn't running, process synchronously
        await report_service.process_report(report.id)

    return ReportResponse.model_validate(report)


@router.get("/", response_model=ReportListResponse)
async def list_reports(
    company_id: UUID,
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all reports for a company."""
    if not current_user.is_superadmin:
        service = CompanyService(db)
        role = await service.get_user_role(company_id, current_user.id)
        if not role:
            raise PermissionDeniedException("No access to this company")

    repo = ReportRepository(db)
    reports = await repo.list_by_company(company_id, skip, limit)
    return ReportListResponse(
        reports=[ReportResponse.model_validate(r) for r in reports],
        total=len(reports),
    )


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    company_id: UUID,
    report_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific report."""
    if not current_user.is_superadmin:
        service = CompanyService(db)
        role = await service.get_user_role(company_id, current_user.id)
        if not role:
            raise PermissionDeniedException("No access to this company")

    repo = ReportRepository(db)
    report = await repo.get_by_id(report_id)
    if not report or report.company_id != company_id:
        raise NotFoundException("Report not found")
    return ReportResponse.model_validate(report)
