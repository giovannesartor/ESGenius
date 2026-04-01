"""Audit engine — detects inconsistencies, missing metrics, abnormal values."""

from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.data_point_repository import DataPointRepository
from app.repositories.framework_repository import FrameworkRepository
from app.ai.deepseek_engine import DeepSeekEngine


class AuditService:
    """Audits ESG data for quality, completeness, and consistency."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.dp_repo = DataPointRepository(db)
        self.fw_repo = FrameworkRepository(db)
        self.ai_engine = DeepSeekEngine()

    async def run_full_audit(
        self, company_id: UUID, year: int
    ) -> dict[str, Any]:
        """Run a comprehensive audit on company ESG data."""
        data_points = await self.dp_repo.list_by_company(
            company_id, year=year, limit=10000
        )

        if not data_points:
            return {
                "status": "no_data",
                "message": "No data points found for audit",
                "inconsistencies": [],
                "missing_data": [],
                "abnormal_values": [],
            }

        dp_dicts = [
            {
                "id": str(dp.id),
                "pillar": dp.pillar,
                "category": dp.category,
                "value": dp.value,
                "numeric_value": dp.numeric_value,
                "unit": dp.unit,
                "source": dp.source,
                "status": dp.status,
            }
            for dp in data_points
        ]

        # AI-powered inconsistency detection
        inconsistencies = self.ai_engine.detect_inconsistencies(dp_dicts)

        # Rule-based checks
        abnormal = self._detect_abnormal_values(data_points)
        duplicate = self._detect_duplicates(data_points)

        return {
            "status": "completed",
            "total_data_points": len(data_points),
            "ai_analysis": inconsistencies.get("data", {}),
            "abnormal_values": abnormal,
            "duplicates": duplicate,
            "summary": {
                "total_issues": (
                    len(inconsistencies.get("data", {}).get("inconsistencies", []))
                    + len(abnormal)
                    + len(duplicate)
                ),
                "quality_score": inconsistencies.get("data", {}).get(
                    "overall_quality_score", 0
                ),
            },
        }

    async def check_framework_gaps(
        self, company_id: UUID, framework_id: UUID, year: int
    ) -> dict[str, Any]:
        """Check data gaps against a specific framework."""
        data_points = await self.dp_repo.list_by_company(
            company_id, year=year, limit=10000
        )
        metrics = await self.fw_repo.get_all_metrics_for_framework(framework_id)

        dp_dicts = [
            {"pillar": dp.pillar, "category": dp.category, "value": dp.value}
            for dp in data_points
        ]
        indicator_dicts = [
            {"code": m.code, "name": m.name, "required": m.is_required}
            for m in metrics
        ]

        framework = await self.fw_repo.get_framework_by_id(framework_id)
        framework_code = framework.code if framework else "Unknown"

        result = self.ai_engine.detect_missing_data(
            dp_dicts, framework_code, indicator_dicts
        )

        return result.get("data", {})

    def _detect_abnormal_values(self, data_points: list) -> list[dict[str, Any]]:
        """Detect statistically abnormal numeric values."""
        abnormal = []
        numeric_by_category: dict[str, list] = {}

        for dp in data_points:
            if dp.numeric_value is not None and dp.category:
                numeric_by_category.setdefault(dp.category, []).append(dp)

        for category, dps in numeric_by_category.items():
            values = [dp.numeric_value for dp in dps if dp.numeric_value is not None]
            if len(values) < 3:
                continue

            mean = sum(values) / len(values)
            std = (sum((v - mean) ** 2 for v in values) / len(values)) ** 0.5

            if std == 0:
                continue

            for dp in dps:
                if dp.numeric_value is not None:
                    z_score = abs((dp.numeric_value - mean) / std)
                    if z_score > 2.5:
                        abnormal.append({
                            "data_point_id": str(dp.id),
                            "category": category,
                            "value": dp.numeric_value,
                            "z_score": round(z_score, 2),
                            "severity": "high" if z_score > 3 else "medium",
                        })

        return abnormal

    def _detect_duplicates(self, data_points: list) -> list[dict[str, Any]]:
        """Detect potential duplicate data points."""
        seen = {}
        duplicates = []

        for dp in data_points:
            key = (dp.category, dp.pillar, str(dp.numeric_value), dp.unit, dp.year)
            if key in seen:
                duplicates.append({
                    "original_id": str(seen[key].id),
                    "duplicate_id": str(dp.id),
                    "category": dp.category,
                    "value": dp.numeric_value,
                })
            else:
                seen[key] = dp

        return duplicates
