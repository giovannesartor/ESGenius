"""Partner domain models — partner portal, CRM, commissions, tasks."""

import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PartnerStatus(str, PyEnum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"


class PipelineStage(str, PyEnum):
    LEAD = "lead"
    PROPOSTA = "proposta"
    NEGOCIACAO = "negociacao"
    FECHADO = "fechado"
    ANALISE_FEITA = "analise_feita"
    ENTREGUE = "entregue"


class CommissionStatus(str, PyEnum):
    PENDING = "pending"
    APPROVED = "approved"
    PAID = "paid"


class TaskStatus(str, PyEnum):
    PENDING = "pending"
    DONE = "done"
    CANCELLED = "cancelled"


class FollowUpTrigger(str, PyEnum):
    CLIENT_NO_DATA = "client_no_data"
    REPORT_PENDING = "report_pending"
    PROPOSAL_NO_RESPONSE = "proposal_no_response"
    POST_REPORT = "post_report"
    CLIENT_INACTIVE = "client_inactive"


class CouponType(str, PyEnum):
    PERCENT = "percent"
    FIXED = "fixed"


class ErrorSeverity(str, PyEnum):
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


# ─── Partner ─────────────────────────────────────────────────────────────────

class Partner(Base):
    __tablename__ = "partners"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ref_code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)

    # Financial
    pix_key_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    pix_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    commission_rate: Mapped[float] = mapped_column(Float, default=0.20)

    # Status
    status: Mapped[str] = mapped_column(String(20), default=PartnerStatus.PENDING.value)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)

    # Branding
    logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    brand_color: Mapped[str | None] = mapped_column(String(10), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relations
    clients: Mapped[list["PartnerClient"]] = relationship("PartnerClient", back_populates="partner", cascade="all, delete-orphan")
    commissions: Mapped[list["PartnerCommission"]] = relationship("PartnerCommission", back_populates="partner", cascade="all, delete-orphan")
    tasks: Mapped[list["PartnerTask"]] = relationship("PartnerTask", back_populates="partner", cascade="all, delete-orphan")
    followup_rules: Mapped[list["PartnerFollowUpRule"]] = relationship("PartnerFollowUpRule", back_populates="partner", cascade="all, delete-orphan")


# ─── Partner Client (CRM) ────────────────────────────────────────────────────

class PartnerClient(Base):
    __tablename__ = "partner_clients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    partner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("partners.id", ondelete="CASCADE"), nullable=False, index=True)

    client_name: Mapped[str] = mapped_column(String(255), nullable=False)
    client_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    client_company: Mapped[str | None] = mapped_column(String(255), nullable=True)
    client_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    pipeline_stage: Mapped[str] = mapped_column(String(30), default=PipelineStage.LEAD.value)
    tags: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    partner: Mapped["Partner"] = relationship("Partner", back_populates="clients")
    tasks: Mapped[list["PartnerTask"]] = relationship("PartnerTask", back_populates="client", cascade="all, delete-orphan")
    commissions: Mapped[list["PartnerCommission"]] = relationship("PartnerCommission", back_populates="client")


# ─── Partner Commission ──────────────────────────────────────────────────────

class PartnerCommission(Base):
    __tablename__ = "partner_commissions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    partner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("partners.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("partner_clients.id", ondelete="SET NULL"), nullable=True)

    product_type: Mapped[str] = mapped_column(String(50), default="esg_report")  # esg_report, esg_analysis
    gross_amount: Mapped[float] = mapped_column(Float, nullable=False)
    commission_rate: Mapped[float] = mapped_column(Float, nullable=False)
    commission_amount: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=CommissionStatus.PENDING.value)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    partner: Mapped["Partner"] = relationship("Partner", back_populates="commissions")
    client: Mapped["PartnerClient | None"] = relationship("PartnerClient", back_populates="commissions")


# ─── Partner Task ────────────────────────────────────────────────────────────

class PartnerTask(Base):
    __tablename__ = "partner_tasks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    partner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("partners.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("partner_clients.id", ondelete="SET NULL"), nullable=True)

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=TaskStatus.PENDING.value)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    partner: Mapped["Partner"] = relationship("Partner", back_populates="tasks")
    client: Mapped["PartnerClient | None"] = relationship("PartnerClient", back_populates="tasks")


# ─── Partner Follow-Up Rule ──────────────────────────────────────────────────

class PartnerFollowUpRule(Base):
    __tablename__ = "partner_followup_rules"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    partner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("partners.id", ondelete="CASCADE"), nullable=False, index=True)

    trigger_type: Mapped[str] = mapped_column(String(50), nullable=False)
    days_threshold: Mapped[int] = mapped_column(Integer, default=7)
    message_template: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    partner: Mapped["Partner"] = relationship("Partner", back_populates="followup_rules")


# ─── Coupon ──────────────────────────────────────────────────────────────────

class Coupon(Base):
    __tablename__ = "coupons"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    coupon_type: Mapped[str] = mapped_column(String(20), default=CouponType.PERCENT.value)
    value: Mapped[float] = mapped_column(Float, nullable=False)  # percent 0-100 or fixed amount USD

    max_uses: Mapped[int | None] = mapped_column(Integer, nullable=True)
    current_uses: Mapped[int] = mapped_column(Integer, default=0)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Optional partner association
    partner_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("partners.id", ondelete="SET NULL"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)


# ─── Error Log ───────────────────────────────────────────────────────────────

class ErrorLog(Base):
    __tablename__ = "error_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    severity: Mapped[str] = mapped_column(String(20), default=ErrorSeverity.ERROR.value)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    stack_trace: Mapped[str | None] = mapped_column(Text, nullable=True)
    endpoint: Mapped[str | None] = mapped_column(String(500), nullable=True)
    method: Mapped[str | None] = mapped_column(String(10), nullable=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    extra_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
