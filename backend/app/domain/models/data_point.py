"""ESG DataPoint model — stores individual ESG measurements."""

import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DataPointSource(str, PyEnum):
    MANUAL = "manual"
    DOCUMENT = "document"
    INTEGRATION = "integration"
    AI_EXTRACTED = "ai_extracted"


class DataPointStatus(str, PyEnum):
    DRAFT = "draft"
    VALIDATED = "validated"
    FLAGGED = "flagged"
    REJECTED = "rejected"


class DataPoint(Base):
    __tablename__ = "data_points"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    metric_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("metrics.id", ondelete="SET NULL"), nullable=True
    )
    document_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True
    )

    # Data
    value: Mapped[str | None] = mapped_column(Text, nullable=True)
    numeric_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    unit: Mapped[str | None] = mapped_column(String(100), nullable=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    period: Mapped[str | None] = mapped_column(String(20), nullable=True)  # Q1, Q2, Q3, Q4, annual

    # Metadata
    source: Mapped[str] = mapped_column(
        String(20), default=DataPointSource.MANUAL.value, nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), default=DataPointStatus.DRAFT.value, nullable=False
    )
    pillar: Mapped[str | None] = mapped_column(String(20), nullable=True)  # E, S, G
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)  # Original text from document
    ai_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)  # AI extraction confidence
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    source_chunk_ids: Mapped[list | None] = mapped_column(JSON, nullable=True)
    source_page: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Audit
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    validated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="data_points")
    metric: Mapped["Metric"] = relationship("Metric", back_populates="data_points")
    document: Mapped["Document"] = relationship("Document", back_populates="data_points")

    def __repr__(self) -> str:
        return f"<DataPoint {self.id} company={self.company_id}>"
