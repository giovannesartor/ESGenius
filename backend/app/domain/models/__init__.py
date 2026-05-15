"""Model registry — import all models so SQLAlchemy discovers them."""

from app.domain.models.user import User, AuthProvider  # noqa: F401
from app.domain.models.company import Company, CompanyUser, CompanySize, UserRole  # noqa: F401
from app.domain.models.framework import Framework, Category, Indicator, Metric  # noqa: F401
from app.domain.models.data_point import DataPoint, DataPointSource, DataPointStatus  # noqa: F401
from app.domain.models.document import Document, DocumentStatus, DocumentType  # noqa: F401
from app.domain.models.report import Report, ReportStatus, ReportFormat  # noqa: F401
from app.domain.models.ai_log import AILog  # noqa: F401
from app.domain.models.integration import Integration  # noqa: F401
from app.domain.models.subscription import Subscription  # noqa: F401
from app.domain.models.comment import Comment, Task, EntityType, TaskStatus, TaskPriority  # noqa: F401
from app.domain.models.notification import Notification, NotificationType  # noqa: F401
from app.domain.models.audit_log import AuditLog  # noqa: F401
from app.domain.models.webhook import Webhook, WebhookDelivery, ApiKey  # noqa: F401
from app.domain.models.document_chunk import DocumentChunk  # noqa: F401
from app.domain.models.report_version import ReportVersion, ReportTemplate  # noqa: F401
from app.domain.models.regulatory import (  # noqa: F401
    RegulatoryUpdate, EmissionFactor, SectorBenchmark, CarbonEmission,
)
from app.domain.models.chat import ChatConversation, ChatMessage  # noqa: F401

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
    "Comment",
    "Task",
    "EntityType",
    "TaskStatus",
    "TaskPriority",
    "Notification",
    "NotificationType",
    "AuditLog",
    "Webhook",
    "WebhookDelivery",
    "ApiKey",
    "DocumentChunk",
    "ReportVersion",
    "ReportTemplate",
    "RegulatoryUpdate",
    "EmissionFactor",
    "SectorBenchmark",
    "CarbonEmission",
    "ChatConversation",
    "ChatMessage",
    "DataPointStatus",
    "Document",
    "DocumentStatus",
    "DocumentType",
    "Report",
    "ReportStatus",
    "ReportFormat",
    "AILog",
    "Integration",
    "Subscription",
]
