"""ESG Data Points API endpoints."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import NotFoundException, PermissionDeniedException
from app.api.dependencies import get_current_user
from app.domain.models.user import User
from app.domain.models.data_point import DataPoint, DataPointSource, DataPointStatus
from app.domain.schemas.data_point import (
    DataPointCreate,
    DataPointUpdate,
    DataPointResponse,
    DataPointBulkCreate,
)
from app.domain.schemas.auth import MessageResponse
from app.repositories.data_point_repository import DataPointRepository
from app.services.company_service import CompanyService

router = APIRouter(prefix="/companies/{company_id}/data-points", tags=["ESG Data"])


async def _check_company_access(
    company_id: UUID, user_id: UUID, db: AsyncSession, is_superadmin: bool = False
) -> None:
    if is_superadmin:
        return
    service = CompanyService(db)
    role = await service.get_user_role(company_id, user_id)
    if not role:
        raise PermissionDeniedException("No access to this company")


@router.post("/", response_model=DataPointResponse, status_code=201)
async def create_data_point(
    company_id: UUID,
    data: DataPointCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new ESG data point."""
    await _check_company_access(company_id, current_user.id, db, current_user.is_superadmin)

    repo = DataPointRepository(db)
    dp = DataPoint(
        company_id=company_id,
        metric_id=data.metric_id,
        value=data.value,
        numeric_value=data.numeric_value,
        unit=data.unit,
        year=data.year,
        period=data.period,
        pillar=data.pillar,
        category=data.category,
        source=data.source,
        status=DataPointStatus.DRAFT.value,
        created_by=current_user.id,
    )
    dp = await repo.create(dp)
    return DataPointResponse.model_validate(dp)


@router.post("/bulk", response_model=list[DataPointResponse], status_code=201)
async def create_data_points_bulk(
    company_id: UUID,
    data: DataPointBulkCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple ESG data points at once."""
    await _check_company_access(company_id, current_user.id, db, current_user.is_superadmin)

    repo = DataPointRepository(db)
    dps = [
        DataPoint(
            company_id=company_id,
            metric_id=d.metric_id,
            value=d.value,
            numeric_value=d.numeric_value,
            unit=d.unit,
            year=d.year,
            period=d.period,
            pillar=d.pillar,
            category=d.category,
            source=d.source,
            status=DataPointStatus.DRAFT.value,
            created_by=current_user.id,
        )
        for d in data.data_points
    ]
    dps = await repo.create_bulk(dps)
    return [DataPointResponse.model_validate(dp) for dp in dps]


@router.get("/", response_model=list[DataPointResponse])
async def list_data_points(
    company_id: UUID,
    year: Optional[int] = Query(None),
    pillar: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List ESG data points with filters."""
    await _check_company_access(company_id, current_user.id, db, current_user.is_superadmin)

    repo = DataPointRepository(db)
    return [
        DataPointResponse.model_validate(dp)
        for dp in await repo.list_by_company(
            company_id, year, pillar, category, source, status, skip, limit
        )
    ]


@router.get("/{data_point_id}", response_model=DataPointResponse)
async def get_data_point(
    company_id: UUID,
    data_point_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single data point."""
    await _check_company_access(company_id, current_user.id, db, current_user.is_superadmin)

    repo = DataPointRepository(db)
    dp = await repo.get_by_id(data_point_id)
    if not dp or dp.company_id != company_id:
        raise NotFoundException("Data point not found")
    return DataPointResponse.model_validate(dp)


@router.patch("/{data_point_id}", response_model=DataPointResponse)
async def update_data_point(
    company_id: UUID,
    data_point_id: UUID,
    data: DataPointUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a data point."""
    await _check_company_access(company_id, current_user.id, db, current_user.is_superadmin)

    repo = DataPointRepository(db)
    dp = await repo.get_by_id(data_point_id)
    if not dp or dp.company_id != company_id:
        raise NotFoundException("Data point not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(dp, field, value)

    dp = await repo.update(dp)
    return DataPointResponse.model_validate(dp)


@router.delete("/{data_point_id}", response_model=MessageResponse)
async def delete_data_point(
    company_id: UUID,
    data_point_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a data point."""
    await _check_company_access(company_id, current_user.id, db, current_user.is_superadmin)

    repo = DataPointRepository(db)
    dp = await repo.get_by_id(data_point_id)
    if not dp or dp.company_id != company_id:
        raise NotFoundException("Data point not found")

    await repo.delete(dp)
    return MessageResponse(message="Data point deleted")
