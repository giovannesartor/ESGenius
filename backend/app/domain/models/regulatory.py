"""Regulatory updates, emission factors, sector benchmarks."""

import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class RegulatoryUpdate(Base):
    __tablename__ = "regulatory_updates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(100), nullable=False)  # CVM, SEC, EFRAG, ISSB, B3
    region: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    sectors: Mapped[list] = mapped_column(JSON, default=list)
    framework_codes: Mapped[list] = mapped_column(JSON, default=list)
    severity: Mapped[str] = mapped_column(String(20), default="info")  # info|warning|critical
    effective_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    deadline_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    published_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )


class EmissionFactor(Base):
    """GHG Protocol & IPCC emission factors for Scope 1/2/3 calculations."""

    __tablename__ = "emission_factors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scope: Mapped[int] = mapped_column(Integer, nullable=False, index=True)  # 1, 2, 3
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)  # stationary_combustion, electricity, business_travel
    subcategory: Mapped[str | None] = mapped_column(String(100), nullable=True)
    activity: Mapped[str] = mapped_column(String(255), nullable=False)  # natural_gas, diesel, grid_electricity
    region: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    factor: Mapped[float] = mapped_column(Float, nullable=False)  # kgCO2e per unit
    unit: Mapped[str] = mapped_column(String(50), nullable=False)  # m3, L, kWh, km, kg
    source: Mapped[str] = mapped_column(String(100), nullable=False)  # IPCC AR6, GHG Protocol, EPA
    year: Mapped[int] = mapped_column(Integer, nullable=False, default=2024)


class SectorBenchmark(Base):
    """Anonymized sector benchmarks for ESG scores."""

    __tablename__ = "sector_benchmarks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sector: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    region: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    metric_code: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    avg_value: Mapped[float] = mapped_column(Float, nullable=False)
    median_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    p25: Mapped[float | None] = mapped_column(Float, nullable=True)
    p75: Mapped[float | None] = mapped_column(Float, nullable=True)
    sample_size: Mapped[int] = mapped_column(Integer, default=0)
    unit: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class CarbonEmission(Base):
    """Calculated carbon emissions per company per scope."""

    __tablename__ = "carbon_emissions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    scope: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    activity: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)
    factor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("emission_factors.id", ondelete="SET NULL"), nullable=True
    )
    co2e_kg: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
