"""API v1 router — aggregates all endpoint routers."""

from fastapi import APIRouter

from app.api.v1.endpoints.admin import router as admin_router
from app.api.v1.endpoints.analytics import router as analytics_router
from app.api.v1.endpoints.audit_logs import router as audit_logs_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.collaboration import router as collaboration_router
from app.api.v1.endpoints.companies import router as companies_router
from app.api.v1.endpoints.dashboard import router as dashboard_router
from app.api.v1.endpoints.data_points import router as data_points_router
from app.api.v1.endpoints.documents import router as documents_router
from app.api.v1.endpoints.esg_ai import router as esg_ai_router
from app.api.v1.endpoints.frameworks import router as frameworks_router
from app.api.v1.endpoints.integrations import router as integrations_router
from app.api.v1.endpoints.notifications import router as notifications_router
from app.api.v1.endpoints.privacy import router as privacy_router
from app.api.v1.endpoints.reports import router as reports_router
from app.api.v1.endpoints.stripe import router as stripe_router

# Financial Intelligence layer
from app.api.v1.endpoints.financial_score import router as financial_score_router
from app.api.v1.endpoints.climate_risk import router as climate_risk_router
from app.api.v1.endpoints.funding_readiness import router as funding_readiness_router
from app.api.v1.endpoints.credit_intelligence import router as credit_intelligence_router
from app.api.v1.endpoints.valuation import router as valuation_router
from app.api.v1.endpoints.macc import router as macc_router
from app.api.v1.endpoints.portfolio import router as portfolio_router
from app.api.v1.endpoints.knowledge_graph import router as knowledge_graph_router
from app.api.v1.endpoints.public_api import router as public_api_router
from app.api.v1.endpoints.embedded import router as embedded_router

# Partner module
from app.api.v1.endpoints.partners import router as partners_router
from app.api.v1.endpoints.admin_ext import router as admin_ext_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(companies_router)
api_router.include_router(data_points_router)
api_router.include_router(documents_router)
api_router.include_router(frameworks_router)
api_router.include_router(dashboard_router)
api_router.include_router(reports_router)
api_router.include_router(admin_router)
api_router.include_router(analytics_router)
api_router.include_router(stripe_router)

# New platform features
api_router.include_router(notifications_router)
api_router.include_router(collaboration_router)
api_router.include_router(audit_logs_router)
api_router.include_router(privacy_router)
api_router.include_router(integrations_router)
api_router.include_router(esg_ai_router)

# Financial Intelligence layer (the new wedge)
api_router.include_router(financial_score_router)
api_router.include_router(climate_risk_router)
api_router.include_router(funding_readiness_router)
api_router.include_router(credit_intelligence_router)
api_router.include_router(valuation_router)
api_router.include_router(macc_router)
api_router.include_router(portfolio_router)
api_router.include_router(knowledge_graph_router)
api_router.include_router(public_api_router)
api_router.include_router(embedded_router)
api_router.include_router(partners_router)
api_router.include_router(admin_ext_router)
