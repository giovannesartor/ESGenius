"""ESG AI extras: chat, recommendations, regulatory, autofill, greenwashing,
materiality, csv mapping, emissions, benchmarks, templates, report versions."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_active_user
from app.core.database import get_db
from app.domain.models.user import User
from app.domain.schemas.esg_extra import (
    AutoFillRequest,
    AutoFillResponse,
    AutoFilledValue,
    BenchmarkResult,
    CarbonSummary,
    ChatMessageRequest,
    ChatMessageResponse,
    ConversationResponse,
    CSVMappingRequest,
    CSVMappingResponse,
    EmissionCalculateRequest,
    EmissionCalculateResponse,
    GreenwashingScanResponse,
    MaterialityMatrixResponse,
    Recommendation,
    RecommendationsResponse,
    RegulatoryUpdateResponse,
    ReportTemplateResponse,
    ReportVersionResponse,
)
from app.repositories.company_repository import CompanyRepository
from app.repositories.platform_repos import (
    ChatRepository,
    CarbonEmissionRepository,
    RegulatoryUpdateRepository,
    ReportTemplateRepository,
    ReportVersionRepository,
    SectorBenchmarkRepository,
)
from app.services.emissions_service import EmissionsService
from app.services.esg_ai_services import (
    AutoFillService,
    ChatService,
    CSVMappingService,
    GreenwashingService,
    MaterialityService,
    RecommendationsService,
    RegulatoryService,
)
from app.services.sector_config import recommend_frameworks

router = APIRouter(tags=["esg-ai"])


# -------- Chat --------
@router.get("/chat/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    company_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ChatRepository(db)
    return await repo.list_conversations(current_user.id, company_id)


@router.get("/chat/conversations/{conv_id}/messages")
async def get_messages(
    conv_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ChatRepository(db)
    conv = await repo.get_conversation(conv_id, current_user.id)
    if not conv:
        raise HTTPException(status_code=404)
    msgs = await repo.list_messages(conv_id)
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "citations": m.citations,
            "created_at": m.created_at,
        }
        for m in msgs
    ]


@router.post("/chat/messages", response_model=ChatMessageResponse)
async def send_chat_message(
    payload: ChatMessageRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    svc = ChatService(db)
    result = await svc.send_message(
        conversation_id=payload.conversation_id,
        company_id=payload.company_id,
        user_id=current_user.id,
        message=payload.message,
        language=payload.language or "en",
    )
    await db.commit()
    return result


# -------- Recommendations --------
@router.get("/recommendations", response_model=RecommendationsResponse)
async def get_recommendations(
    company_id: UUID,
    language: str = "en",
    limit: int = 5,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    svc = RecommendationsService(db)
    items = await svc.generate(company_id, language=language, limit=limit)
    return RecommendationsResponse(
        recommendations=[Recommendation(**r) for r in items],
        generated_at=datetime.now(timezone.utc),
    )


# -------- Regulatory updates --------
@router.get("/regulatory/updates", response_model=list[RegulatoryUpdateResponse])
async def list_regulatory(
    company_id: UUID | None = None,
    region: str | None = None,
    sector: str | None = None,
    framework: str | None = None,
    limit: int = 30,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if company_id:
        crepo = CompanyRepository(db)
        c = await crepo.get_by_id(company_id)
        svc = RegulatoryService(db)
        return await svc.list_for_company(c, limit=limit)
    repo = RegulatoryUpdateRepository(db)
    return list(await repo.list_recent(region=region, sector=sector, framework=framework, limit=limit))


# -------- Auto-fill --------
@router.post("/autofill", response_model=AutoFillResponse)
async def autofill(
    payload: AutoFillRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    svc = AutoFillService(db)
    crepo = CompanyRepository(db)
    company = await crepo.get_by_id(payload.company_id)
    sector = company.industry if company else None
    items = await svc.suggest(
        payload.company_id, sector, payload.year, payload.framework_codes
    )
    return AutoFillResponse(
        suggestions=[AutoFilledValue(**i) for i in items],
        company_id=payload.company_id,
        year=payload.year,
    )


# -------- Greenwashing --------
@router.post("/greenwashing/scan", response_model=GreenwashingScanResponse)
async def greenwashing_scan(
    text: str,
    language: str = "en",
    current_user: User = Depends(get_current_active_user),
):
    svc = GreenwashingService()
    return await svc.scan_text(text, language=language)


# -------- Materiality matrix --------
@router.get("/materiality", response_model=MaterialityMatrixResponse)
async def materiality(
    company_id: UUID,
    language: str = "en",
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    crepo = CompanyRepository(db)
    company = await crepo.get_by_id(company_id)
    if not company:
        raise HTTPException(status_code=404)
    svc = MaterialityService()
    return await svc.build_matrix(
        company.name, company.industry, company.country, language=language
    )


# -------- CSV mapping --------
@router.post("/csv/map", response_model=CSVMappingResponse)
async def csv_map(
    payload: CSVMappingRequest,
    current_user: User = Depends(get_current_active_user),
):
    svc = CSVMappingService()
    return await svc.suggest_mapping(payload.csv_text, language=payload.language or "en")


@router.post("/csv/upload-map")
async def csv_upload_map(
    file: UploadFile = File(...),
    language: str = "en",
    current_user: User = Depends(get_current_active_user),
):
    raw = await file.read()
    text = raw.decode("utf-8", errors="ignore")
    svc = CSVMappingService()
    return await svc.suggest_mapping(text, language=language)


# -------- Emissions --------
@router.post("/emissions/calculate", response_model=EmissionCalculateResponse)
async def calculate_emission(
    payload: EmissionCalculateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    svc = EmissionsService(db)
    try:
        result = await svc.calculate(
            scope=payload.scope,
            category=payload.category,
            activity=payload.activity,
            quantity=payload.quantity,
            unit=payload.unit,
            region=payload.region,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return result


@router.post("/emissions/record")
async def record_emission(
    payload: EmissionCalculateRequest,
    company_id: UUID,
    year: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    svc = EmissionsService(db)
    try:
        emission = await svc.record(
            company_id=company_id,
            scope=payload.scope,
            category=payload.category,
            activity=payload.activity,
            quantity=payload.quantity,
            unit=payload.unit,
            year=year,
            region=payload.region,
            created_by=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    await db.commit()
    return {"id": emission.id, "co2e_kg": emission.co2e_kg, "year": emission.year}


@router.get("/emissions/summary", response_model=CarbonSummary)
async def emissions_summary(
    company_id: UUID,
    year: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    svc = EmissionsService(db)
    return await svc.summary(company_id, year)


@router.get("/emissions")
async def list_emissions(
    company_id: UUID,
    year: int | None = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    repo = CarbonEmissionRepository(db)
    items = await repo.list_for_company(company_id, year=year)
    return [
        {
            "id": e.id,
            "year": e.year,
            "scope": e.scope,
            "category": e.category,
            "activity": e.activity,
            "quantity": e.quantity,
            "unit": e.unit,
            "co2e_kg": e.co2e_kg,
            "created_at": e.created_at,
        }
        for e in items
    ]


# -------- Benchmarks --------
@router.get("/benchmarks", response_model=list[BenchmarkResult])
async def list_benchmarks(
    sector: str,
    year: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    repo = SectorBenchmarkRepository(db)
    items = await repo.list_for_sector(sector, year)
    return [
        BenchmarkResult(
            metric_code=b.metric_code,
            sector=b.sector,
            year=b.year,
            avg_value=b.avg_value,
            median_value=b.median_value,
            p25=b.p25,
            p75=b.p75,
            unit=b.unit,
            sample_size=b.sample_size,
        )
        for b in items
    ]


# -------- Report templates --------
@router.get("/report-templates", response_model=list[ReportTemplateResponse])
async def list_templates(
    sector: str | None = None,
    region: str | None = None,
    framework: str | None = None,
    language: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    repo = ReportTemplateRepository(db)
    return list(await repo.list_all(sector=sector, region=region, framework=framework, language=language))


@router.get("/report-templates/{template_id}", response_model=ReportTemplateResponse)
async def get_template(
    template_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    repo = ReportTemplateRepository(db)
    t = await repo.get(template_id)
    if not t:
        raise HTTPException(status_code=404)
    await repo.increment_downloads(template_id)
    await db.commit()
    return t


# -------- Report versions --------
@router.get("/reports/{report_id}/versions", response_model=list[ReportVersionResponse])
async def list_report_versions(
    report_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ReportVersionRepository(db)
    return list(await repo.list_for_report(report_id))


@router.get("/reports/{report_id}/versions/{version_number}", response_model=ReportVersionResponse)
async def get_report_version(
    report_id: UUID,
    version_number: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ReportVersionRepository(db)
    v = await repo.get_by_number(report_id, version_number)
    if not v:
        raise HTTPException(status_code=404)
    return v


@router.get("/reports/{report_id}/diff/{v1}/{v2}")
async def diff_report_versions(
    report_id: UUID,
    v1: int,
    v2: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ReportVersionRepository(db)
    a = await repo.get_by_number(report_id, v1)
    b = await repo.get_by_number(report_id, v2)
    if not a or not b:
        raise HTTPException(status_code=404)

    # Simple top-level diff
    diff = {"added": {}, "removed": {}, "changed": {}}
    a_data = a.content_json or {}
    b_data = b.content_json or {}
    for k in set(b_data.keys()) - set(a_data.keys()):
        diff["added"][k] = b_data[k]
    for k in set(a_data.keys()) - set(b_data.keys()):
        diff["removed"][k] = a_data[k]
    for k in set(a_data.keys()) & set(b_data.keys()):
        if a_data[k] != b_data[k]:
            diff["changed"][k] = {"before": a_data[k], "after": b_data[k]}

    return {"v1": v1, "v2": v2, "diff": diff, "score_diff": {
        "before": a.esg_scores or {},
        "after": b.esg_scores or {},
    }}


# -------- Framework recommendations (used by onboarding wizard) --------
@router.get("/onboarding/recommend-frameworks")
async def recommend_frameworks_endpoint(
    sector: str | None = None,
    country: str | None = None,
    size: str | None = None,
    current_user: User = Depends(get_current_active_user),
):
    return {"frameworks": recommend_frameworks(sector, country, size)}
