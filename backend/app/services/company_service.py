"""Company service — handles company management and member roles."""

import re
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    NotFoundException,
    PermissionDeniedException,
)
from app.domain.models.company import Company, CompanyUser, UserRole
from app.domain.schemas.company import (
    CompanyCreate,
    CompanyMemberResponse,
    CompanyResponse,
    CompanyUpdate,
)
from app.repositories.company_repository import CompanyRepository
from app.repositories.user_repository import UserRepository
from app.services.email_service import EmailService


class CompanyService:
    """Handles company CRUD and membership management."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.company_repo = CompanyRepository(db)
        self.user_repo = UserRepository(db)
        self.email_service = EmailService()

    async def create_company(
        self, data: CompanyCreate, user_id: UUID
    ) -> CompanyResponse:
        """Create a new company and add creator as admin."""
        slug = self._generate_slug(data.name)

        existing = await self.company_repo.get_by_slug(slug)
        if existing:
            slug = f"{slug}-{str(user_id)[:8]}"

        company = Company(
            name=data.name,
            slug=slug,
            description=data.description,
            sector=data.sector,
            country=data.country,
            size=data.size,
            website=data.website,
        )
        company = await self.company_repo.create(company)

        # Add creator as admin
        membership = CompanyUser(
            company_id=company.id,
            user_id=user_id,
            role=UserRole.ADMIN.value,
        )
        await self.company_repo.add_member(membership)

        return CompanyResponse.model_validate(company)

    async def get_company(self, company_id: UUID) -> CompanyResponse:
        company = await self.company_repo.get_by_id(company_id)
        if not company:
            raise NotFoundException("Company not found")
        return CompanyResponse.model_validate(company)

    async def update_company(
        self, company_id: UUID, data: CompanyUpdate, user_id: UUID, is_superadmin: bool = False
    ) -> CompanyResponse:
        if not is_superadmin:
            await self._require_role(company_id, user_id, [UserRole.ADMIN.value])

        company = await self.company_repo.get_by_id(company_id)
        if not company:
            raise NotFoundException("Company not found")

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(company, field, value)

        company = await self.company_repo.update(company)
        return CompanyResponse.model_validate(company)

    async def list_user_companies(
        self, user_id: UUID, is_superadmin: bool = False
    ) -> list[CompanyResponse]:
        if is_superadmin:
            companies = await self.company_repo.list_all()
        else:
            companies = await self.company_repo.list_for_user(user_id)
        return [CompanyResponse.model_validate(c) for c in companies]

    async def add_member(
        self,
        company_id: UUID,
        email: str,
        role: str,
        inviter_id: UUID,
        is_superadmin: bool = False,
    ) -> CompanyMemberResponse:
        if not is_superadmin:
            await self._require_role(company_id, inviter_id, [UserRole.ADMIN.value])

        user = await self.user_repo.get_by_email(email)
        if not user:
            raise NotFoundException("User not found. They must register first.")

        existing = await self.company_repo.get_membership(company_id, user.id)
        if existing:
            raise ConflictException("User is already a member")

        membership = CompanyUser(
            company_id=company_id,
            user_id=user.id,
            role=role,
        )
        membership = await self.company_repo.add_member(membership)

        company = await self.company_repo.get_by_id(company_id)
        inviter = await self.user_repo.get_by_id(inviter_id)

        await self.email_service.send_company_invite_email(
            email=email,
            company_name=company.name if company else "Unknown",
            role=role,
            inviter_name=inviter.full_name if inviter else "Unknown",
        )

        return CompanyMemberResponse(
            id=membership.id,
            user_id=membership.user_id,
            company_id=membership.company_id,
            role=membership.role,
            user_email=user.email,
            user_name=user.full_name,
            created_at=membership.created_at,
        )

    async def list_members(
        self, company_id: UUID, user_id: UUID, is_superadmin: bool = False
    ) -> list[CompanyMemberResponse]:
        if not is_superadmin:
            await self._require_role(
                company_id,
                user_id,
                [UserRole.ADMIN.value, UserRole.MANAGER.value, UserRole.VIEWER.value],
            )

        members = await self.company_repo.list_members(company_id)
        return [
            CompanyMemberResponse(
                id=m.id,
                user_id=m.user_id,
                company_id=m.company_id,
                role=m.role,
                user_email=m.user.email if m.user else None,
                user_name=m.user.full_name if m.user else None,
                created_at=m.created_at,
            )
            for m in members
        ]

    async def update_member_role(
        self,
        company_id: UUID,
        member_user_id: UUID,
        new_role: str,
        admin_id: UUID,
        is_superadmin: bool = False,
    ) -> None:
        if not is_superadmin:
            await self._require_role(company_id, admin_id, [UserRole.ADMIN.value])

        membership = await self.company_repo.get_membership(company_id, member_user_id)
        if not membership:
            raise NotFoundException("Member not found")

        membership.role = new_role
        await self.company_repo.add_member(membership)

    async def remove_member(
        self, company_id: UUID, member_user_id: UUID, admin_id: UUID, is_superadmin: bool = False
    ) -> None:
        if not is_superadmin:
            await self._require_role(company_id, admin_id, [UserRole.ADMIN.value])

        membership = await self.company_repo.get_membership(company_id, member_user_id)
        if not membership:
            raise NotFoundException("Member not found")

        await self.company_repo.remove_member(membership)

    async def get_user_role(
        self, company_id: UUID, user_id: UUID
    ) -> Optional[str]:
        membership = await self.company_repo.get_membership(company_id, user_id)
        return membership.role if membership else None

    async def _require_role(
        self, company_id: UUID, user_id: UUID, allowed_roles: list[str]
    ) -> None:
        """Verify user has one of the allowed roles."""
        membership = await self.company_repo.get_membership(company_id, user_id)
        if not membership or membership.role not in allowed_roles:
            raise PermissionDeniedException("Insufficient permissions for this company")

    @staticmethod
    def _generate_slug(name: str) -> str:
        slug = name.lower().strip()
        slug = re.sub(r"[^\w\s-]", "", slug)
        slug = re.sub(r"[\s_]+", "-", slug)
        slug = re.sub(r"-+", "-", slug)
        return slug.strip("-")
