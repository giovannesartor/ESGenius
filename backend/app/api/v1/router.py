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
