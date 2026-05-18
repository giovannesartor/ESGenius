"""Admin extended endpoints — coupons, error logs, payments overview."""

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_superadmin
from app.core.database import get_db
from app.domain.models.partner import Coupon, ErrorLog
from app.domain.models.user import User

router = APIRouter(prefix="/admin/ext", tags=["admin-extended"])


# ─── Schemas ─────────────────────────────────────────────────────────────────

class CouponCreate(BaseModel):
    code: str
    coupon_type: str = "percent"
    value: float
    max_uses: int | None = None
    description: str | None = None
    expires_at: datetime | None = None
    partner_id: str | None = None


class CouponUpdate(BaseModel):
    code: str | None = None
    coupon_type: str | None = None
    value: float | None = None
    is_active: bool | None = None
    max_uses: int | None = None
    description: str | None = None
    expires_at: datetime | None = None
    partner_id: str | None = None


class ErrorLogCreate(BaseModel):
    severity: str = "error"
    message: str
    endpoint: str | None = None
    method: str | None = None
    stack_trace: str | None = None


# ─── Coupons ─────────────────────────────────────────────────────────────────

@router.get("/coupons")
async def list_coupons(
    is_active: bool | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin: User = Depends(get_current_superadmin),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    stmt = select(Coupon)
    if is_active is not None:
        stmt = stmt.where(Coupon.is_active == is_active)

    count_res = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = count_res.scalar() or 0

    stmt = stmt.offset((page - 1) * per_page).limit(per_page).order_by(Coupon.created_at.desc())
    rows = await db.execute(stmt)
    coupons = rows.scalars().all()

    return {
        "items": [_serialize_coupon(c) for c in coupons],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.post("/coupons", status_code=status.HTTP_201_CREATED)
async def create_coupon(data: CouponCreate, admin: User = Depends(get_current_superadmin), db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    # Check unique code
    existing = await db.execute(select(Coupon).where(Coupon.code == data.code.upper()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Coupon code already exists")

    coupon = Coupon(
        code=data.code.upper(),
        coupon_type=data.coupon_type,
        value=data.value,
        max_uses=data.max_uses,
        description=data.description,
        expires_at=data.expires_at,
        partner_id=uuid.UUID(data.partner_id) if data.partner_id else None,
        created_by=admin.id,
    )
    db.add(coupon)
    await db.commit()
    await db.refresh(coupon)
    return _serialize_coupon(coupon)


@router.patch("/coupons/{coupon_id}")
async def update_coupon(coupon_id: str, data: CouponUpdate, admin: User = Depends(get_current_superadmin), db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    result = await db.execute(select(Coupon).where(Coupon.id == uuid.UUID(coupon_id)))
    coupon = result.scalar_one_or_none()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    update_data = data.model_dump(exclude_none=True)
    for key, val in update_data.items():
        setattr(coupon, key, val)
    await db.commit()
    await db.refresh(coupon)
    return _serialize_coupon(coupon)


@router.delete("/coupons/{coupon_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_coupon(coupon_id: str, admin: User = Depends(get_current_superadmin), db: AsyncSession = Depends(get_db)) -> None:
    result = await db.execute(select(Coupon).where(Coupon.id == uuid.UUID(coupon_id)))
    coupon = result.scalar_one_or_none()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    await db.delete(coupon)
    await db.commit()


def _serialize_coupon(c: Coupon) -> dict[str, Any]:
    return {
        "id": str(c.id),
        "code": c.code,
        "coupon_type": c.coupon_type,
        "value": c.value,
        "max_uses": c.max_uses,
        "current_uses": c.current_uses,
        "description": c.description,
        "is_active": c.is_active,
        "expires_at": c.expires_at.isoformat() if c.expires_at else None,
        "partner_id": str(c.partner_id) if c.partner_id else None,
        "created_at": c.created_at.isoformat(),
    }


# ─── Error Logs ───────────────────────────────────────────────────────────────

@router.get("/error-logs")
async def list_error_logs(
    resolved: bool | None = Query(None),
    severity: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin: User = Depends(get_current_superadmin),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    stmt = select(ErrorLog)
    if resolved is not None:
        stmt = stmt.where(ErrorLog.resolved == resolved)
    if severity:
        stmt = stmt.where(ErrorLog.severity == severity)

    count_res = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = count_res.scalar() or 0

    stmt = stmt.offset((page - 1) * per_page).limit(per_page).order_by(ErrorLog.created_at.desc())
    rows = await db.execute(stmt)
    logs = rows.scalars().all()

    return {
        "items": [_serialize_error_log(e) for e in logs],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.post("/error-logs", status_code=status.HTTP_201_CREATED)
async def create_error_log(
    data: ErrorLogCreate,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Internal endpoint to log application errors (called by middleware)."""
    log = ErrorLog(
        severity=data.severity,
        message=data.message,
        endpoint=data.endpoint,
        method=data.method,
        stack_trace=data.stack_trace,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return _serialize_error_log(log)


@router.patch("/error-logs/{log_id}/resolve")
async def resolve_error_log(
    log_id: str,
    admin: User = Depends(get_current_superadmin),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    result = await db.execute(select(ErrorLog).where(ErrorLog.id == uuid.UUID(log_id)))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Error log not found")

    log.resolved = True
    log.resolved_at = datetime.now(timezone.utc)
    log.resolved_by = admin.id
    await db.commit()
    return {"message": "Error log resolved", "log_id": log_id}


@router.delete("/error-logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_error_log(log_id: str, admin: User = Depends(get_current_superadmin), db: AsyncSession = Depends(get_db)) -> None:
    result = await db.execute(select(ErrorLog).where(ErrorLog.id == uuid.UUID(log_id)))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Error log not found")
    await db.delete(log)
    await db.commit()


def _serialize_error_log(e: ErrorLog) -> dict[str, Any]:
    return {
        "id": str(e.id),
        "severity": e.severity,
        "message": e.message,
        "stack_trace": e.stack_trace,
        "endpoint": e.endpoint,
        "method": e.method,
        "user_id": str(e.user_id) if e.user_id else None,
        "resolved": e.resolved,
        "resolved_at": e.resolved_at.isoformat() if e.resolved_at else None,
        "created_at": e.created_at.isoformat(),
    }


# ─── Payments Overview ────────────────────────────────────────────────────────

@router.get("/payments/overview")
async def payments_overview(
    admin: User = Depends(get_current_superadmin),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Returns high-level revenue stats pulled from subscriptions table."""
    from app.domain.models.subscription import Subscription  # lazy import to avoid circular

    total_res = await db.execute(select(func.count()).select_from(Subscription))
    total_subs = total_res.scalar() or 0

    active_res = await db.execute(
        select(func.count()).select_from(Subscription)
        .where(Subscription.status == "active")
    )
    active_subs = active_res.scalar() or 0

    return {
        "total_subscriptions": total_subs,
        "active_subscriptions": active_subs,
        "note": "Full payment history is available in Stripe Dashboard.",
    }
