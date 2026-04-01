"""Company schemas — request/response models for companies."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class CompanyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    sector: Optional[str] = None
    country: Optional[str] = None
    size: Optional[str] = None
    website: Optional[str] = None


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sector: Optional[str] = None
    country: Optional[str] = None
    size: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None


class CompanyResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str] = None
    sector: Optional[str] = None
    country: Optional[str] = None
    size: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CompanyMemberAdd(BaseModel):
    email: str
    role: str = "viewer"


class CompanyMemberResponse(BaseModel):
    id: UUID
    user_id: UUID
    company_id: UUID
    role: str
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CompanyMemberUpdate(BaseModel):
    role: str
