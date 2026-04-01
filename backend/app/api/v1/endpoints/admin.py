"""Admin API endpoints — superadmin-only management operations."""

from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import get_current_superadmin
from app.domain.models.user import User
from app.domain.models.company import Company
from app.domain.models.framework import Framework, Indicator, Metric
from app.domain.models.document import Document
from app.domain.models.report import Report

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Schemas ────────────────────────────────────────────────────────

class AdminStatsResponse(BaseModel):
    total_users: int
    total_companies: int
    total_documents: int
    total_reports: int
    total_frameworks: int
    active_users_30d: int


class UserListItem(BaseModel):
    id: str
    email: str
    full_name: str
    is_active: bool
    is_superadmin: bool
    is_email_verified: bool
    created_at: str
    last_login_at: Optional[str] = None

    class Config:
        from_attributes = True


class UserUpdateAdmin(BaseModel):
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_superadmin: Optional[bool] = None


class FrameworkCreate(BaseModel):
    name: str
    code: str
    version: str
    description: Optional[str] = None


class FrameworkUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    version: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


# ── Stats / Overview ──────────────────────────────────────────────

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    _current_user: User = Depends(get_current_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """Get platform-wide statistics."""
    from datetime import datetime, timedelta, timezone

    users_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
    companies_count = (await db.execute(select(func.count(Company.id)))).scalar() or 0
    documents_count = (await db.execute(select(func.count(Document.id)))).scalar() or 0
    reports_count = (await db.execute(select(func.count(Report.id)))).scalar() or 0
    frameworks_count = (await db.execute(select(func.count(Framework.id)))).scalar() or 0

    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    active_users = (
        await db.execute(
            select(func.count(User.id)).where(User.last_login_at >= thirty_days_ago)
        )
    ).scalar() or 0

    return AdminStatsResponse(
        total_users=users_count,
        total_companies=companies_count,
        total_documents=documents_count,
        total_reports=reports_count,
        total_frameworks=frameworks_count,
        active_users_30d=active_users,
    )


# ── User Management ──────────────────────────────────────────────

@router.get("/users")
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    _current_user: User = Depends(get_current_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """List all users with pagination and search."""
    query = select(User).order_by(User.created_at.desc())

    if search:
        query = query.where(
            User.email.ilike(f"%{search}%") | User.full_name.ilike(f"%{search}%")
        )

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()

    total = (await db.execute(select(func.count(User.id)))).scalar() or 0

    return {
        "items": [
            {
                "id": str(u.id),
                "email": u.email,
                "full_name": u.full_name,
                "is_active": u.is_active,
                "is_superadmin": u.is_superadmin,
                "is_email_verified": u.is_email_verified,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
            }
            for u in users
        ],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.patch("/users/{user_id}")
async def update_user(
    user_id: UUID,
    data: UserUpdateAdmin,
    _current_user: User = Depends(get_current_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """Update user properties (activate, deactivate, promote to admin)."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        await db.execute(
            update(User).where(User.id == user_id).values(**update_data)
        )
        await db.commit()

    await db.refresh(user)
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "is_superadmin": user.is_superadmin,
    }


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: UUID,
    _current_user: User = Depends(get_current_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """Delete a user permanently."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_superadmin:
        raise HTTPException(status_code=400, detail="Cannot delete a superadmin")

    await db.execute(delete(User).where(User.id == user_id))
    await db.commit()
    return {"detail": "User deleted"}


# ── Company Management (Admin) ───────────────────────────────────

@router.get("/companies")
async def list_all_companies(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    _current_user: User = Depends(get_current_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """List all companies across the platform."""
    query = select(Company).order_by(Company.created_at.desc())

    if search:
        query = query.where(Company.name.ilike(f"%{search}%"))

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    companies = result.scalars().all()

    total = (await db.execute(select(func.count(Company.id)))).scalar() or 0

    return {
        "items": [
            {
                "id": str(c.id),
                "name": c.name,
                "sector": getattr(c, "sector", None),
                "country": getattr(c, "country", None),
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in companies
        ],
        "total": total,
    }


@router.delete("/companies/{company_id}")
async def delete_company(
    company_id: UUID,
    _current_user: User = Depends(get_current_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """Delete a company and all its data."""
    company = await db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    await db.execute(delete(Company).where(Company.id == company_id))
    await db.commit()
    return {"detail": "Company deleted"}


# ── Framework Management ─────────────────────────────────────────

@router.get("/frameworks")
async def list_frameworks_admin(
    _current_user: User = Depends(get_current_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """List all frameworks with indicator counts."""
    result = await db.execute(select(Framework).order_by(Framework.name))
    frameworks = result.scalars().all()

    items = []
    for fw in frameworks:
        indicator_count = (
            await db.execute(
                select(func.count(Indicator.id)).where(Indicator.framework_id == fw.id)
            )
        ).scalar() or 0

        items.append({
            "id": str(fw.id),
            "name": fw.name,
            "code": fw.code,
            "version": getattr(fw, "version", ""),
            "description": getattr(fw, "description", ""),
            "is_active": getattr(fw, "is_active", True),
            "indicator_count": indicator_count,
            "created_at": fw.created_at.isoformat() if fw.created_at else None,
        })

    return {"items": items, "total": len(items)}


@router.post("/frameworks")
async def create_framework(
    data: FrameworkCreate,
    _current_user: User = Depends(get_current_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new ESG framework."""
    existing = await db.execute(
        select(Framework).where(Framework.code == data.code)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Framework with code '{data.code}' already exists")

    framework = Framework(
        name=data.name,
        code=data.code,
        version=data.version,
        description=data.description or "",
    )
    db.add(framework)
    await db.commit()
    await db.refresh(framework)

    return {
        "id": str(framework.id),
        "name": framework.name,
        "code": framework.code,
        "version": getattr(framework, "version", ""),
    }


@router.patch("/frameworks/{framework_id}")
async def update_framework(
    framework_id: UUID,
    data: FrameworkUpdate,
    _current_user: User = Depends(get_current_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """Update a framework."""
    framework = await db.get(Framework, framework_id)
    if not framework:
        raise HTTPException(status_code=404, detail="Framework not found")

    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        await db.execute(
            update(Framework).where(Framework.id == framework_id).values(**update_data)
        )
        await db.commit()
        await db.refresh(framework)

    return {
        "id": str(framework.id),
        "name": framework.name,
        "code": framework.code,
    }


@router.delete("/frameworks/{framework_id}")
async def delete_framework(
    framework_id: UUID,
    _current_user: User = Depends(get_current_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """Delete a framework and all its indicators."""
    framework = await db.get(Framework, framework_id)
    if not framework:
        raise HTTPException(status_code=404, detail="Framework not found")

    await db.execute(delete(Indicator).where(Indicator.framework_id == framework_id))
    await db.execute(delete(Framework).where(Framework.id == framework_id))
    await db.commit()
    return {"detail": "Framework deleted"}
