"""Privacy endpoints — GDPR/LGPD self-service export and account deletion."""

import json

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_active_user
from app.core.database import get_db
from app.domain.models.user import User
from app.domain.schemas.platform import MessageResponse, PrivacyExportResponse
from app.services.esg_ai_services import PrivacyService

router = APIRouter(prefix="/privacy", tags=["privacy"])


@router.get("/export", response_model=PrivacyExportResponse)
async def export_my_data(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    svc = PrivacyService(db)
    return await svc.export_user_data(current_user.id)


@router.get("/export/download")
async def export_my_data_download(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    svc = PrivacyService(db)
    data = await svc.export_user_data(current_user.id)
    body = json.dumps(data, indent=2, default=str).encode("utf-8")
    return Response(
        content=body,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=esg360-data-{current_user.id}.json"},
    )


@router.delete("/account", response_model=MessageResponse)
async def delete_my_account(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    svc = PrivacyService(db)
    result = await svc.delete_user_account(current_user.id)
    await db.commit()
    return MessageResponse(message=f"Account deleted: {result.get('user_id')}")
