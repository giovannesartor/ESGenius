"""ESG Scoring Service — calculates completeness, consistency, coverage scores."""

from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.data_point_repository import DataPointRepository
from app.repositories.framework_repository import FrameworkRepository


class ScoringService:
    """Calculates ESG scores based on completeness, consistency, and coverage."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.dp_repo = DataPointRepository(db)
        self.fw_repo = FrameworkRepository(db)

    async def calculate_scores(
        self, company_id: UUID, year: int
    ) -> dict[str, Any]:
        """Calculate overall ESG scores for a company."""
        data_points = await self.dp_repo.list_by_company(
            company_id, year=year, limit=10000
        )

        if not data_points:
            return self._empty_scores()

        # Separate by pillar
        env_dps = [dp for dp in data_points if dp.pillar == "E"]
        soc_dps = [dp for dp in data_points if dp.pillar == "S"]
        gov_dps = [dp for dp in data_points if dp.pillar == "G"]

        # Calculate pillar scores
        env_score = self._calculate_pillar_score(env_dps)
        soc_score = self._calculate_pillar_score(soc_dps)
        gov_score = self._calculate_pillar_score(gov_dps)

        # Weighted overall score
        overall = (env_score * 0.35) + (soc_score * 0.35) + (gov_score * 0.30)

        # Completeness
        total = len(data_points)
        validated = len([dp for dp in data_points if dp.status == "validated"])
        completeness = validated / total if total > 0 else 0

        # Consistency
        flagged = len([dp for dp in data_points if dp.status == "flagged"])
        consistency = 1.0 - (flagged / total) if total > 0 else 1.0

        return {
            "overall": round(overall, 2),
            "environmental": round(env_score, 2),
            "social": round(soc_score, 2),
            "governance": round(gov_score, 2),
            "completeness": round(completeness, 2),
            "consistency": round(consistency, 2),
            "total_data_points": total,
            "validated_data_points": validated,
            "flagged_data_points": flagged,
            "year": year,
        }

    async def calculate_framework_coverage(
        self, company_id: UUID, framework_id: UUID, year: int
    ) -> dict[str, Any]:
        """Calculate coverage for a specific framework."""
        metrics = await self.fw_repo.get_all_metrics_for_framework(framework_id)
        data_points = await self.dp_repo.list_by_company(
            company_id, year=year, limit=10000
        )

        metric_ids = {str(m.id) for m in metrics}
        covered = {
            str(dp.metric_id) for dp in data_points if str(dp.metric_id) in metric_ids
        }

        total_required = len([m for m in metrics if m.is_required])
        covered_required = len(
            covered.intersection({str(m.id) for m in metrics if m.is_required})
        )

        return {
            "framework_id": str(framework_id),
            "total_metrics": len(metrics),
            "covered_metrics": len(covered),
            "coverage_percentage": round(
                len(covered) / len(metrics) * 100 if metrics else 0, 1
            ),
            "required_metrics": total_required,
            "covered_required": covered_required,
            "required_coverage": round(
                covered_required / total_required * 100 if total_required else 0, 1
            ),
        }

    def _calculate_pillar_score(self, data_points: list) -> float:
        """Calculate score for a single ESG pillar."""
        if not data_points:
            return 0.0

        total = len(data_points)
        validated = len([dp for dp in data_points if dp.status == "validated"])
        has_value = len(
            [dp for dp in data_points if dp.value or dp.numeric_value is not None]
        )

        # Score formula: 60% data availability + 40% validation
        availability = has_value / total if total > 0 else 0
        validation = validated / total if total > 0 else 0

        return (availability * 0.6 + validation * 0.4) * 100

    def _empty_scores(self) -> dict[str, Any]:
        return {
            "overall": 0,
            "environmental": 0,
            "social": 0,
            "governance": 0,
            "completeness": 0,
            "consistency": 1.0,
            "total_data_points": 0,
            "validated_data_points": 0,
            "flagged_data_points": 0,
        }
