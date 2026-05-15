"""Framework Knowledge Graph API."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.domain.models.user import User
from app.services.knowledge_graph_service import (
    SUPPORTED_FRAMEWORKS,
    coverage_matrix,
    equivalent_disclosures,
    list_mappings,
    seed_default_mappings,
)

router = APIRouter(prefix="/knowledge-graph", tags=["Knowledge Graph"])


@router.get("/frameworks")
async def frameworks():
    return {"frameworks": SUPPORTED_FRAMEWORKS}


@router.get("/coverage")
async def coverage(db: AsyncSession = Depends(get_db)):
    return await coverage_matrix(db)


@router.get("/mappings")
async def mappings(
    source_framework: str | None = Query(default=None),
    target_framework: str | None = Query(default=None),
    source_code: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    items = await list_mappings(db, source_framework, target_framework, source_code)
    return {
        "items": [
            {
                "id": str(m.id),
                "source_framework": m.source_framework,
                "source_code": m.source_code,
                "source_label": m.source_label,
                "target_framework": m.target_framework,
                "target_code": m.target_code,
                "target_label": m.target_label,
                "relationship_type": m.relationship_type,
                "confidence": m.confidence,
                "notes": m.notes,
            }
            for m in items
        ]
    }


@router.get("/equivalent")
async def equivalent(
    source_framework: str,
    source_code: str,
    db: AsyncSession = Depends(get_db),
):
    return {"items": await equivalent_disclosures(db, source_framework, source_code)}


@router.post("/seed")
async def seed(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.is_superadmin:
        return {"seeded": 0, "message": "superadmin only"}
    n = await seed_default_mappings(db)
    return {"seeded": n}
