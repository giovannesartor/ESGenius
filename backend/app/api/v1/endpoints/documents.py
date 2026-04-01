"""Document upload & processing API endpoints."""

import os
import uuid as uuid_mod
from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import BadRequestException, NotFoundException, PermissionDeniedException
from app.api.dependencies import get_current_user
from app.domain.models.user import User
from app.domain.models.document import Document, DocumentStatus, DocumentType
from app.domain.schemas.document import DocumentResponse, DocumentListResponse
from app.domain.schemas.auth import MessageResponse
from app.repositories.document_repository import DocumentRepository
from app.services.company_service import CompanyService

router = APIRouter(prefix="/companies/{company_id}/documents", tags=["Documents"])

ALLOWED_EXTENSIONS = {".pdf", ".csv", ".xlsx", ".xls", ".docx"}
MAX_SIZE = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


def _get_file_type(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    mapping = {
        ".pdf": DocumentType.PDF.value,
        ".csv": DocumentType.CSV.value,
        ".xlsx": DocumentType.XLSX.value,
        ".xls": DocumentType.XLSX.value,
        ".docx": DocumentType.DOCX.value,
    }
    return mapping.get(ext, DocumentType.OTHER.value)


@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    company_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a document for ESG data extraction."""
    service = CompanyService(db)
    role = await service.get_user_role(company_id, current_user.id)
    if not role:
        raise PermissionDeniedException("No access to this company")

    # Validate file extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise BadRequestException(
            f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read and validate size
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise BadRequestException(
            f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE_MB}MB"
        )

    # Save to disk
    unique_filename = f"{uuid_mod.uuid4().hex}{ext}"
    upload_dir = os.path.join(settings.UPLOAD_DIR, str(company_id))
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, unique_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    # Create document record
    repo = DocumentRepository(db)
    doc = Document(
        company_id=company_id,
        uploaded_by=current_user.id,
        filename=unique_filename,
        original_filename=file.filename or "unknown",
        file_type=_get_file_type(file.filename or ""),
        file_size=len(content),
        file_path=file_path,
        mime_type=file.content_type,
        status=DocumentStatus.UPLOADED.value,
    )
    doc = await repo.create(doc)

    # Trigger async processing (Celery task)
    try:
        from app.workers.document_tasks import process_document_task

        process_document_task.delay(str(doc.id))
    except Exception:
        pass  # If Celery isn't running, document stays in UPLOADED status

    return DocumentResponse.model_validate(doc)


@router.get("/", response_model=DocumentListResponse)
async def list_documents(
    company_id: UUID,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all documents for a company."""
    service = CompanyService(db)
    role = await service.get_user_role(company_id, current_user.id)
    if not role:
        raise PermissionDeniedException("No access to this company")

    repo = DocumentRepository(db)
    docs = await repo.list_by_company(company_id, skip, limit)
    total = await repo.count_by_company(company_id)

    return DocumentListResponse(
        documents=[DocumentResponse.model_validate(d) for d in docs],
        total=total,
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    company_id: UUID,
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get document details."""
    service = CompanyService(db)
    role = await service.get_user_role(company_id, current_user.id)
    if not role:
        raise PermissionDeniedException("No access to this company")

    repo = DocumentRepository(db)
    doc = await repo.get_by_id(document_id)
    if not doc or doc.company_id != company_id:
        raise NotFoundException("Document not found")
    return DocumentResponse.model_validate(doc)


@router.delete("/{document_id}", response_model=MessageResponse)
async def delete_document(
    company_id: UUID,
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a document."""
    service = CompanyService(db)
    role = await service.get_user_role(company_id, current_user.id)
    if role not in ("admin", "manager"):
        raise PermissionDeniedException("Only admins and managers can delete documents")

    repo = DocumentRepository(db)
    doc = await repo.get_by_id(document_id)
    if not doc or doc.company_id != company_id:
        raise NotFoundException("Document not found")

    # Delete file from disk
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    await repo.delete(doc)
    return MessageResponse(message="Document deleted")
