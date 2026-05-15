"""Webhooks + API keys management."""

import hashlib
import secrets
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_active_user
from app.core.database import get_db
from app.domain.models.user import User
from app.domain.models.webhook import ApiKey, Webhook
from app.domain.schemas.platform import (
    ApiKeyCreate,
    ApiKeyCreatedResponse,
    ApiKeyResponse,
    MessageResponse,
    WebhookCreate,
    WebhookResponse,
)
from app.repositories.platform_repos import ApiKeyRepository, WebhookRepository
from app.services.webhook_service import generate_secret

router = APIRouter(tags=["integrations"])


# ---------- Webhooks ----------
@router.get("/webhooks", response_model=list[WebhookResponse])
async def list_webhooks(
    company_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    repo = WebhookRepository(db)
    return await repo.list_for_company(company_id)


@router.post("/webhooks", response_model=WebhookResponse, status_code=201)
async def create_webhook(
    payload: WebhookCreate,
    company_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    repo = WebhookRepository(db)
    w = Webhook(
        company_id=company_id,
        name=payload.name,
        url=payload.url,
        events=payload.events,
        secret=generate_secret(),
        is_active=True,
    )
    saved = await repo.create(w)
    await db.commit()
    return saved


@router.delete("/webhooks/{webhook_id}", status_code=204)
async def delete_webhook(
    webhook_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    repo = WebhookRepository(db)
    w = await repo.get(webhook_id)
    if not w:
        raise HTTPException(status_code=404)
    await repo.delete(w)
    await db.commit()


# ---------- API Keys ----------
def _hash_key(plaintext: str) -> str:
    return hashlib.sha256(plaintext.encode("utf-8")).hexdigest()


@router.get("/api-keys", response_model=list[ApiKeyResponse])
async def list_api_keys(
    company_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ApiKeyRepository(db)
    return await repo.list_for_company(company_id)


@router.post("/api-keys", response_model=ApiKeyCreatedResponse, status_code=201)
async def create_api_key(
    payload: ApiKeyCreate,
    company_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    plaintext = f"esg_{secrets.token_urlsafe(32)}"
    prefix = plaintext[:12]
    repo = ApiKeyRepository(db)
    k = ApiKey(
        company_id=company_id,
        user_id=current_user.id,
        name=payload.name,
        key_prefix=prefix,
        key_hash=_hash_key(plaintext),
        scopes=payload.scopes or ["read"],
        is_active=True,
        expires_at=payload.expires_at,
    )
    saved = await repo.create(k)
    await db.commit()
    return ApiKeyCreatedResponse(
        id=saved.id,
        name=saved.name,
        key_prefix=saved.key_prefix,
        scopes=saved.scopes,
        is_active=saved.is_active,
        last_used_at=saved.last_used_at,
        expires_at=saved.expires_at,
        created_at=saved.created_at,
        plaintext_key=plaintext,
    )


@router.delete("/api-keys/{key_id}", status_code=204)
async def delete_api_key(
    key_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    repo = ApiKeyRepository(db)
    k = (await db.execute(select(ApiKey).where(ApiKey.id == key_id))).scalar_one_or_none()
    if not k:
        raise HTTPException(status_code=404)
    await repo.delete(k)
    await db.commit()
