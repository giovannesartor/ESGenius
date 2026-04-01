"""Company API endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.domain.models.user import User
from app.domain.schemas.company import (
    CompanyCreate,
    CompanyMemberAdd,
    CompanyMemberResponse,
    CompanyMemberUpdate,
    CompanyResponse,
    CompanyUpdate,
)
from app.domain.schemas.auth import MessageResponse
from app.services.company_service import CompanyService

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.post("/", response_model=CompanyResponse, status_code=201)
async def create_company(
    data: CompanyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new company. Creator becomes admin."""
    service = CompanyService(db)
    return await service.create_company(data, current_user.id)


@router.get("/", response_model=list[CompanyResponse])
async def list_companies(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all companies the current user belongs to. Superadmin sees all."""
    service = CompanyService(db)
    return await service.list_user_companies(
        current_user.id, is_superadmin=current_user.is_superadmin
    )


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get company details."""
    service = CompanyService(db)
    return await service.get_company(company_id)


@router.patch("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: UUID,
    data: CompanyUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update company details. Admin or superadmin."""
    service = CompanyService(db)
    return await service.update_company(
        company_id, data, current_user.id, is_superadmin=current_user.is_superadmin
    )


# --- Members ---
@router.post("/{company_id}/members", response_model=CompanyMemberResponse)
async def add_member(
    company_id: UUID,
    data: CompanyMemberAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a member to the company. Admin or superadmin."""
    service = CompanyService(db)
    return await service.add_member(
        company_id=company_id,
        email=data.email,
        role=data.role,
        inviter_id=current_user.id,
        is_superadmin=current_user.is_superadmin,
    )


@router.get("/{company_id}/members", response_model=list[CompanyMemberResponse])
async def list_members(
    company_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all members of a company."""
    service = CompanyService(db)
    return await service.list_members(
        company_id, current_user.id, is_superadmin=current_user.is_superadmin
    )


@router.patch("/{company_id}/members/{user_id}", response_model=MessageResponse)
async def update_member_role(
    company_id: UUID,
    user_id: UUID,
    data: CompanyMemberUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a member's role. Admin or superadmin."""
    service = CompanyService(db)
    await service.update_member_role(
        company_id=company_id,
        member_user_id=user_id,
        new_role=data.role,
        admin_id=current_user.id,
        is_superadmin=current_user.is_superadmin,
    )
    return MessageResponse(message="Role updated successfully")


@router.delete("/{company_id}/members/{user_id}", response_model=MessageResponse)
async def remove_member(
    company_id: UUID,
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a member from the company. Admin or superadmin."""
    service = CompanyService(db)
    await service.remove_member(
        company_id=company_id,
        member_user_id=user_id,
        admin_id=current_user.id,
        is_superadmin=current_user.is_superadmin,
    )
    return MessageResponse(message="Member removed successfully")
