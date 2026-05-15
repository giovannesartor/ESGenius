"""Comments + Tasks endpoints (collaboration)."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_active_user
from app.core.database import get_db
from app.domain.models.comment import Comment, Task
from app.domain.models.user import User
from app.domain.schemas.collaboration import (
    CommentCreate,
    CommentResponse,
    CommentUpdate,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)
from app.repositories.platform_repos import CommentRepository, TaskRepository

router = APIRouter(tags=["collaboration"])


def _ensure_company_access(user: User, company_id: UUID) -> None:
    # Lightweight check; deeper checks live in company_service
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


# -------- Comments --------
@router.get("/comments", response_model=list[CommentResponse])
async def list_comments(
    company_id: UUID,
    entity_type: str = Query(..., regex="^(data_point|document|report)$"),
    entity_id: UUID = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _ensure_company_access(current_user, company_id)
    repo = CommentRepository(db)
    return await repo.list_for_entity(company_id, entity_type, entity_id)


@router.post("/comments", response_model=CommentResponse, status_code=201)
async def create_comment(
    payload: CommentCreate,
    company_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    _ensure_company_access(current_user, company_id)
    repo = CommentRepository(db)
    c = Comment(
        company_id=company_id,
        author_id=current_user.id,
        entity_type=payload.entity_type,
        entity_id=payload.entity_id,
        body=payload.body,
        parent_id=payload.parent_id,
    )
    saved = await repo.create(c)
    await db.commit()
    return saved


@router.put("/comments/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: UUID,
    payload: CommentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    repo = CommentRepository(db)
    c = await repo.get(comment_id)
    if not c or c.author_id != current_user.id:
        raise HTTPException(status_code=404, detail="Comment not found")
    if payload.body is not None:
        c.body = payload.body
    if payload.is_resolved is not None:
        c.is_resolved = payload.is_resolved
    saved = await repo.update(c)
    await db.commit()
    return saved


@router.delete("/comments/{comment_id}", status_code=204)
async def delete_comment(
    comment_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    repo = CommentRepository(db)
    c = await repo.get(comment_id)
    if not c or c.author_id != current_user.id:
        raise HTTPException(status_code=404)
    await repo.delete(c)
    await db.commit()


# -------- Tasks --------
@router.get("/tasks", response_model=list[TaskResponse])
async def list_tasks(
    company_id: UUID,
    assignee_id: UUID | None = None,
    status_filter: str | None = Query(None, alias="status"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    return await repo.list_for_company(company_id, assignee_id=assignee_id, status=status_filter)


@router.post("/tasks", response_model=TaskResponse, status_code=201)
async def create_task(
    payload: TaskCreate,
    company_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    t = Task(
        company_id=company_id,
        created_by=current_user.id,
        assignee_id=payload.assignee_id,
        title=payload.title,
        description=payload.description,
        priority=payload.priority or "medium",
        due_date=payload.due_date,
        entity_type=payload.entity_type,
        entity_id=payload.entity_id,
    )
    saved = await repo.create(t)
    await db.commit()
    return saved


@router.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    payload: TaskUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    t = await repo.get(task_id)
    if not t:
        raise HTTPException(status_code=404)
    for field in ("title", "description", "status", "priority", "due_date", "assignee_id"):
        v = getattr(payload, field, None)
        if v is not None:
            setattr(t, field, v)
    saved = await repo.update(t)
    await db.commit()
    return saved


@router.delete("/tasks/{task_id}", status_code=204)
async def delete_task(
    task_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    t = await repo.get(task_id)
    if not t:
        raise HTTPException(status_code=404)
    await repo.delete(t)
    await db.commit()
