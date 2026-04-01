"""Document schemas — request/response models for documents."""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: UUID
    company_id: UUID
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    status: str
    page_count: Optional[int] = None
    processing_error: Optional[str] = None
    ai_analysis: Optional[dict[str, Any]] = None
    created_at: datetime
    processed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int
