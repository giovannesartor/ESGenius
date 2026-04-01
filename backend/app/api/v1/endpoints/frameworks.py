"""Framework API endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.api.dependencies import get_current_user, get_current_superadmin
from app.domain.models.user import User
from app.domain.models.framework import Framework, Category, Indicator, Metric
from app.domain.schemas.framework import (
    FrameworkCreate,
    FrameworkUpdate,
    FrameworkResponse,
    FrameworkFullResponse,
    CategoryCreate,
    CategoryResponse,
    IndicatorCreate,
    IndicatorResponse,
    MetricCreate,
    MetricResponse,
)
from app.repositories.framework_repository import FrameworkRepository

router = APIRouter(prefix="/frameworks", tags=["Frameworks"])


# --- Frameworks ---
@router.get("/", response_model=list[FrameworkResponse])
async def list_frameworks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all active ESG frameworks."""
    repo = FrameworkRepository(db)
    return [FrameworkResponse.model_validate(f) for f in await repo.list_frameworks()]


@router.get("/{framework_id}", response_model=FrameworkFullResponse)
async def get_framework(
    framework_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get full framework with categories, indicators, and metrics."""
    repo = FrameworkRepository(db)
    fw = await repo.get_framework_full(framework_id)
    if not fw:
        raise NotFoundException("Framework not found")
    return FrameworkFullResponse.model_validate(fw)


@router.post("/", response_model=FrameworkResponse, status_code=201)
async def create_framework(
    data: FrameworkCreate,
    current_user: User = Depends(get_current_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new ESG framework. Superadmin only."""
    repo = FrameworkRepository(db)
    fw = Framework(
        name=data.name,
        code=data.code,
        description=data.description,
        version=data.version,
    )
    fw = await repo.create_framework(fw)
    return FrameworkResponse.model_validate(fw)


@router.patch("/{framework_id}", response_model=FrameworkResponse)
async def update_framework(
    framework_id: UUID,
    data: FrameworkUpdate,
    current_user: User = Depends(get_current_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """Update an ESG framework. Superadmin only."""
    repo = FrameworkRepository(db)
    fw = await repo.get_framework_by_id(framework_id)
    if not fw:
        raise NotFoundException("Framework not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(fw, field, value)
    fw = await repo.update_framework(fw)
    return FrameworkResponse.model_validate(fw)


# --- Categories ---
@router.post("/{framework_id}/categories", response_model=CategoryResponse, status_code=201)
async def create_category(
    framework_id: UUID,
    data: CategoryCreate,
    current_user: User = Depends(get_current_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """Add a category to a framework. Superadmin only."""
    repo = FrameworkRepository(db)
    cat = Category(framework_id=framework_id, **data.model_dump())
    cat = await repo.create_category(cat)
    return CategoryResponse.model_validate(cat)


@router.get("/{framework_id}/categories", response_model=list[CategoryResponse])
async def list_categories(
    framework_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all categories in a framework."""
    repo = FrameworkRepository(db)
    return [CategoryResponse.model_validate(c) for c in await repo.list_categories(framework_id)]


# --- Indicators ---
@router.post("/categories/{category_id}/indicators", response_model=IndicatorResponse, status_code=201)
async def create_indicator(
    category_id: UUID,
    data: IndicatorCreate,
    current_user: User = Depends(get_current_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """Add an indicator to a category. Superadmin only."""
    repo = FrameworkRepository(db)
    ind = Indicator(category_id=category_id, **data.model_dump())
    ind = await repo.create_indicator(ind)
    return IndicatorResponse.model_validate(ind)


# --- Metrics ---
@router.post("/indicators/{indicator_id}/metrics", response_model=MetricResponse, status_code=201)
async def create_metric(
    indicator_id: UUID,
    data: MetricCreate,
    current_user: User = Depends(get_current_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """Add a metric to an indicator. Superadmin only."""
    repo = FrameworkRepository(db)
    metric = Metric(indicator_id=indicator_id, **data.model_dump())
    metric = await repo.create_metric(metric)
    return MetricResponse.model_validate(metric)
