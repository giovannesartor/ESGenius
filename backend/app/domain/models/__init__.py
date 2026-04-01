"""Model registry — import all models so SQLAlchemy discovers them."""

from app.domain.models.user import User, AuthProvider  # noqa: F401
from app.domain.models.company import Company, CompanyUser, CompanySize, UserRole  # noqa: F401
from app.domain.models.framework import Framework, Category, Indicator, Metric  # noqa: F401
from app.domain.models.data_point import DataPoint, DataPointSource, DataPointStatus  # noqa: F401
from app.domain.models.document import Document, DocumentStatus, DocumentType  # noqa: F401
from app.domain.models.report import Report, ReportStatus, ReportFormat  # noqa: F401
from app.domain.models.ai_log import AILog  # noqa: F401
from app.domain.models.integration import Integration  # noqa: F401

__all__ = [
    "User",
    "AuthProvider",
    "Company",
    "CompanyUser",
    "CompanySize",
    "UserRole",
    "Framework",
    "Category",
    "Indicator",
    "Metric",
    "DataPoint",
    "DataPointSource",
    "DataPointStatus",
    "Document",
    "DocumentStatus",
    "DocumentType",
    "Report",
    "ReportStatus",
    "ReportFormat",
    "AILog",
    "Integration",
]
