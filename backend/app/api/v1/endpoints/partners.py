"""Partner endpoints — registration, auth, dashboard, CRM, commissions, tasks, follow-up."""

import secrets
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_superadmin, get_current_user
from app.core.database import get_db
from app.core.security import create_access_token, decode_token
from app.domain.models.partner import (
    Partner,
    PartnerClient,
    PartnerCommission,
    PartnerFollowUpRule,
    PartnerTask,
)
from app.domain.models.user import User

router = APIRouter(prefix="/partners", tags=["partners"])
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _hash(password: str) -> str:
    return pwd_ctx.hash(password)


def _verify(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)


def _gen_ref_code() -> str:
    return secrets.token_urlsafe(8).upper()


# ─── Partner JWT dependency ───────────────────────────────────────────────────

from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

partner_bearer = HTTPBearer()


async def get_current_partner(
    credentials: HTTPAuthorizationCredentials = Depends(partner_bearer),
    db: AsyncSession = Depends(get_db),
) -> Partner:
    from app.core.exceptions import CredentialsException

    token = credentials.credentials
    payload = decode_token(token)
    if not payload or payload.get("type") != "access" or payload.get("role") != "partner":
        raise CredentialsException()

    partner_id = payload.get("sub")
    if not partner_id:
        raise CredentialsException()

    result = await db.execute(select(Partner).where(Partner.id == uuid.UUID(partner_id)))
    partner = result.scalar_one_or_none()

    if not partner or not partner.is_active:
        raise CredentialsException("Partner not found or inactive")
    return partner


# ─── Schemas ──────────────────────────────────────────────────────────────────

class PartnerRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    company_name: str | None = None
    phone: str | None = None


class PartnerLoginRequest(BaseModel):
    email: EmailStr
    password: str


class PartnerClientCreate(BaseModel):
    client_name: str
    client_email: str | None = None
    client_company: str | None = None
    client_phone: str | None = None
    notes: str | None = None
    pipeline_stage: str = "lead"


class PartnerClientUpdate(BaseModel):
    client_name: str | None = None
    client_email: str | None = None
    client_company: str | None = None
    client_phone: str | None = None
    notes: str | None = None
    pipeline_stage: str | None = None


class PartnerTaskCreate(BaseModel):
    title: str
    description: str | None = None
    due_date: datetime | None = None
    client_id: str | None = None


class PartnerTaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    due_date: datetime | None = None
    status: str | None = None
    client_id: str | None = None


class PartnerPixUpdate(BaseModel):
    pix_key_type: str
    pix_key: str


class FollowUpRuleCreate(BaseModel):
    trigger_type: str
    days_threshold: int = 7
    message_template: str | None = None
    is_active: bool = True


# ─── Auth ─────────────────────────────────────────────────────────────────────

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def partner_register(data: PartnerRegisterRequest, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    # Check duplicate email
    existing = await db.execute(select(Partner).where(Partner.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    ref_code = _gen_ref_code()
    # Ensure ref_code uniqueness
    while True:
        check = await db.execute(select(Partner).where(Partner.ref_code == ref_code))
        if not check.scalar_one_or_none():
            break
        ref_code = _gen_ref_code()

    partner = Partner(
        email=data.email,
        hashed_password=_hash(data.password),
        full_name=data.full_name,
        company_name=data.company_name,
        phone=data.phone,
        ref_code=ref_code,
        status="pending",
        is_active=False,
    )
    db.add(partner)
    await db.commit()
    await db.refresh(partner)
    return {
        "id": str(partner.id),
        "email": partner.email,
        "ref_code": partner.ref_code,
        "status": partner.status,
        "message": "Registration successful. Await admin approval.",
    }


@router.post("/login")
async def partner_login(data: PartnerLoginRequest, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    result = await db.execute(select(Partner).where(Partner.email == data.email))
    partner = result.scalar_one_or_none()

    if not partner or not _verify(data.password, partner.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not partner.is_active:
        raise HTTPException(status_code=403, detail="Account pending approval or suspended")

    token = create_access_token(subject=str(partner.id), extra_claims={"role": "partner"})
    return {"access_token": token, "token_type": "bearer", "partner_id": str(partner.id)}


# ─── Profile ──────────────────────────────────────────────────────────────────

@router.get("/me")
async def partner_me(partner: Partner = Depends(get_current_partner)) -> dict[str, Any]:
    return {
        "id": str(partner.id),
        "email": partner.email,
        "full_name": partner.full_name,
        "company_name": partner.company_name,
        "ref_code": partner.ref_code,
        "commission_rate": partner.commission_rate,
        "pix_key_type": partner.pix_key_type,
        "pix_key": partner.pix_key,
        "status": partner.status,
        "brand_color": partner.brand_color,
        "logo_url": partner.logo_url,
    }


@router.patch("/pix")
async def update_pix(data: PartnerPixUpdate, partner: Partner = Depends(get_current_partner), db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    partner.pix_key_type = data.pix_key_type
    partner.pix_key = data.pix_key
    await db.commit()
    return {"message": "PIX key updated successfully"}


# ─── Dashboard ────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def partner_dashboard(partner: Partner = Depends(get_current_partner), db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    # Total clients
    total_clients_res = await db.execute(
        select(func.count()).select_from(PartnerClient).where(PartnerClient.partner_id == partner.id)
    )
    total_clients = total_clients_res.scalar() or 0

    # Pipeline breakdown
    pipeline_res = await db.execute(
        select(PartnerClient.pipeline_stage, func.count()).select_from(PartnerClient)
        .where(PartnerClient.partner_id == partner.id)
        .group_by(PartnerClient.pipeline_stage)
    )
    pipeline_counts = {row[0]: row[1] for row in pipeline_res.fetchall()}

    # Commissions
    commission_res = await db.execute(
        select(func.sum(PartnerCommission.commission_amount), func.count())
        .select_from(PartnerCommission)
        .where(PartnerCommission.partner_id == partner.id)
    )
    comm_row = commission_res.fetchone()
    total_commissions = float(comm_row[0] or 0)
    total_deals = int(comm_row[1] or 0)

    pending_res = await db.execute(
        select(func.sum(PartnerCommission.commission_amount))
        .select_from(PartnerCommission)
        .where(PartnerCommission.partner_id == partner.id, PartnerCommission.status == "pending")
    )
    pending_commissions = float(pending_res.scalar() or 0)

    # Tasks due
    tasks_due_res = await db.execute(
        select(func.count()).select_from(PartnerTask)
        .where(PartnerTask.partner_id == partner.id, PartnerTask.status == "pending")
    )
    tasks_pending = tasks_due_res.scalar() or 0

    return {
        "total_clients": total_clients,
        "total_deals": total_deals,
        "total_commissions": total_commissions,
        "pending_commissions": pending_commissions,
        "tasks_pending": tasks_pending,
        "pipeline": {
            "lead": pipeline_counts.get("lead", 0),
            "proposta": pipeline_counts.get("proposta", 0),
            "negociacao": pipeline_counts.get("negociacao", 0),
            "fechado": pipeline_counts.get("fechado", 0),
            "analise_feita": pipeline_counts.get("analise_feita", 0),
            "entregue": pipeline_counts.get("entregue", 0),
        },
        "ref_code": partner.ref_code,
    }


# ─── Clients ──────────────────────────────────────────────────────────────────

@router.get("/clients")
async def list_clients(
    stage: str | None = Query(None),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    partner: Partner = Depends(get_current_partner),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    stmt = select(PartnerClient).where(PartnerClient.partner_id == partner.id)
    if stage:
        stmt = stmt.where(PartnerClient.pipeline_stage == stage)
    if search:
        stmt = stmt.where(
            PartnerClient.client_name.ilike(f"%{search}%") |
            PartnerClient.client_email.ilike(f"%{search}%") |
            PartnerClient.client_company.ilike(f"%{search}%")
        )

    count_res = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = count_res.scalar() or 0

    stmt = stmt.offset((page - 1) * per_page).limit(per_page).order_by(PartnerClient.created_at.desc())
    rows = await db.execute(stmt)
    clients = rows.scalars().all()

    return {
        "items": [_serialize_client(c) for c in clients],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.post("/clients", status_code=status.HTTP_201_CREATED)
async def create_client(data: PartnerClientCreate, partner: Partner = Depends(get_current_partner), db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    client = PartnerClient(
        partner_id=partner.id,
        client_name=data.client_name,
        client_email=data.client_email,
        client_company=data.client_company,
        client_phone=data.client_phone,
        notes=data.notes,
        pipeline_stage=data.pipeline_stage,
    )
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return _serialize_client(client)


@router.patch("/clients/{client_id}")
async def update_client(client_id: str, data: PartnerClientUpdate, partner: Partner = Depends(get_current_partner), db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    result = await db.execute(
        select(PartnerClient).where(PartnerClient.id == uuid.UUID(client_id), PartnerClient.partner_id == partner.id)
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    update_data = data.model_dump(exclude_none=True)
    for key, val in update_data.items():
        setattr(client, key, val)
    client.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(client)
    return _serialize_client(client)


@router.delete("/clients/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(client_id: str, partner: Partner = Depends(get_current_partner), db: AsyncSession = Depends(get_db)) -> None:
    result = await db.execute(
        select(PartnerClient).where(PartnerClient.id == uuid.UUID(client_id), PartnerClient.partner_id == partner.id)
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    await db.delete(client)
    await db.commit()


def _serialize_client(c: PartnerClient) -> dict[str, Any]:
    return {
        "id": str(c.id),
        "client_name": c.client_name,
        "client_email": c.client_email,
        "client_company": c.client_company,
        "client_phone": c.client_phone,
        "pipeline_stage": c.pipeline_stage,
        "notes": c.notes,
        "created_at": c.created_at.isoformat(),
    }


# ─── Commissions ──────────────────────────────────────────────────────────────

@router.get("/commissions")
async def list_commissions(
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    partner: Partner = Depends(get_current_partner),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    stmt = select(PartnerCommission).where(PartnerCommission.partner_id == partner.id)
    if status_filter:
        stmt = stmt.where(PartnerCommission.status == status_filter)

    count_res = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = count_res.scalar() or 0

    stmt = stmt.offset((page - 1) * per_page).limit(per_page).order_by(PartnerCommission.created_at.desc())
    rows = await db.execute(stmt)
    commissions = rows.scalars().all()

    return {
        "items": [
            {
                "id": str(c.id),
                "client_id": str(c.client_id) if c.client_id else None,
                "product_type": c.product_type,
                "gross_amount": c.gross_amount,
                "commission_rate": c.commission_rate,
                "commission_amount": c.commission_amount,
                "status": c.status,
                "notes": c.notes,
                "paid_at": c.paid_at.isoformat() if c.paid_at else None,
                "created_at": c.created_at.isoformat(),
            }
            for c in commissions
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


# ─── Tasks ────────────────────────────────────────────────────────────────────

@router.get("/tasks")
async def list_tasks(partner: Partner = Depends(get_current_partner), db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    result = await db.execute(
        select(PartnerTask).where(PartnerTask.partner_id == partner.id).order_by(PartnerTask.due_date.asc().nullslast())
    )
    tasks = result.scalars().all()
    return [_serialize_task(t) for t in tasks]


@router.post("/tasks", status_code=status.HTTP_201_CREATED)
async def create_task(data: PartnerTaskCreate, partner: Partner = Depends(get_current_partner), db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    task = PartnerTask(
        partner_id=partner.id,
        client_id=uuid.UUID(data.client_id) if data.client_id else None,
        title=data.title,
        description=data.description,
        due_date=data.due_date,
        status="pending",
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return _serialize_task(task)


@router.patch("/tasks/{task_id}")
async def update_task(task_id: str, data: PartnerTaskUpdate, partner: Partner = Depends(get_current_partner), db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    result = await db.execute(
        select(PartnerTask).where(PartnerTask.id == uuid.UUID(task_id), PartnerTask.partner_id == partner.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = data.model_dump(exclude_none=True)
    if "client_id" in update_data and update_data["client_id"]:
        update_data["client_id"] = uuid.UUID(update_data["client_id"])
    for key, val in update_data.items():
        setattr(task, key, val)
    task.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(task)
    return _serialize_task(task)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: str, partner: Partner = Depends(get_current_partner), db: AsyncSession = Depends(get_db)) -> None:
    result = await db.execute(
        select(PartnerTask).where(PartnerTask.id == uuid.UUID(task_id), PartnerTask.partner_id == partner.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.delete(task)
    await db.commit()


def _serialize_task(t: PartnerTask) -> dict[str, Any]:
    return {
        "id": str(t.id),
        "client_id": str(t.client_id) if t.client_id else None,
        "title": t.title,
        "description": t.description,
        "due_date": t.due_date.isoformat() if t.due_date else None,
        "status": t.status,
        "created_at": t.created_at.isoformat(),
    }


# ─── Follow-Up Rules ──────────────────────────────────────────────────────────

@router.get("/followup/rules")
async def list_followup_rules(partner: Partner = Depends(get_current_partner), db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    result = await db.execute(
        select(PartnerFollowUpRule).where(PartnerFollowUpRule.partner_id == partner.id)
    )
    rules = result.scalars().all()
    return [
        {
            "id": str(r.id),
            "trigger_type": r.trigger_type,
            "days_threshold": r.days_threshold,
            "message_template": r.message_template,
            "is_active": r.is_active,
        }
        for r in rules
    ]


@router.post("/followup/rules", status_code=status.HTTP_201_CREATED)
async def create_followup_rule(data: FollowUpRuleCreate, partner: Partner = Depends(get_current_partner), db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    rule = PartnerFollowUpRule(
        partner_id=partner.id,
        trigger_type=data.trigger_type,
        days_threshold=data.days_threshold,
        message_template=data.message_template,
        is_active=data.is_active,
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return {"id": str(rule.id), "trigger_type": rule.trigger_type, "days_threshold": rule.days_threshold, "message_template": rule.message_template, "is_active": rule.is_active}


# ─── Admin: Partner Management ────────────────────────────────────────────────

@router.get("/admin/list")
async def admin_list_partners(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    admin: User = Depends(get_current_superadmin),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    stmt = select(Partner)
    if status_filter:
        stmt = stmt.where(Partner.status == status_filter)

    count_res = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = count_res.scalar() or 0

    stmt = stmt.offset((page - 1) * per_page).limit(per_page).order_by(Partner.created_at.desc())
    rows = await db.execute(stmt)
    partners = rows.scalars().all()

    return {
        "items": [
            {
                "id": str(p.id),
                "email": p.email,
                "full_name": p.full_name,
                "company_name": p.company_name,
                "ref_code": p.ref_code,
                "commission_rate": p.commission_rate,
                "status": p.status,
                "is_active": p.is_active,
                "created_at": p.created_at.isoformat(),
            }
            for p in partners
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.patch("/admin/{partner_id}/approve")
async def approve_partner(
    partner_id: str,
    admin: User = Depends(get_current_superadmin),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    result = await db.execute(select(Partner).where(Partner.id == uuid.UUID(partner_id)))
    partner = result.scalar_one_or_none()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    partner.status = "active"
    partner.is_active = True
    await db.commit()
    return {"message": "Partner approved", "partner_id": partner_id}


@router.patch("/admin/{partner_id}/suspend")
async def suspend_partner(
    partner_id: str,
    admin: User = Depends(get_current_superadmin),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    result = await db.execute(select(Partner).where(Partner.id == uuid.UUID(partner_id)))
    partner = result.scalar_one_or_none()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    partner.status = "suspended"
    partner.is_active = False
    await db.commit()
    return {"message": "Partner suspended", "partner_id": partner_id}
