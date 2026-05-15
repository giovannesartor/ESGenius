"""Notifications endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_active_user
from app.core.database import get_db
from app.domain.models.user import User
from app.domain.schemas.platform import (
    MessageResponse,
    NotificationPrefsUpdate,
    NotificationResponse,
)
from app.repositories.platform_repos import NotificationRepository
from app.repositories.user_repository import UserRepository

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationResponse])
async def list_notifications(
    unread_only: bool = False,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    repo = NotificationRepository(db)
    items = await repo.list_for_user(current_user.id, unread_only=unread_only, limit=limit)
    return items


@router.get("/unread-count")
async def unread_count(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    repo = NotificationRepository(db)
    return {"count": await repo.count_unread(current_user.id)}


@router.post("/{notification_id}/read", response_model=MessageResponse)
async def mark_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    repo = NotificationRepository(db)
    await repo.mark_read(notification_id, current_user.id)
    await db.commit()
    return MessageResponse(message="ok")


@router.post("/read-all", response_model=MessageResponse)
async def mark_all_read(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    repo = NotificationRepository(db)
    await repo.mark_all_read(current_user.id)
    await db.commit()
    return MessageResponse(message="ok")


@router.put("/preferences", response_model=MessageResponse)
async def update_prefs(
    prefs: NotificationPrefsUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    urepo = UserRepository(db)
    user = await urepo.get_by_id(current_user.id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    user.notification_prefs = prefs.model_dump(exclude_none=True)
    await urepo.update(user)
    await db.commit()
    return MessageResponse(message="updated")
