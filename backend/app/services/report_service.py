"""Report generation service — creates PDF and DOCX ESG reports."""

import json
import logging
import os
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.domain.models.report import Report, ReportStatus
from app.repositories.report_repository import ReportRepository
from app.repositories.data_point_repository import DataPointRepository
from app.repositories.company_repository import CompanyRepository
from app.services.scoring_service import ScoringService
from app.ai.deepseek_engine import DeepSeekEngine

logger = logging.getLogger(__name__)


class ReportService:
    """Generates ESG reports in PDF/DOCX format."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.report_repo = ReportRepository(db)
        self.dp_repo = DataPointRepository(db)
        self.company_repo = CompanyRepository(db)
        self.scoring = ScoringService(db)
        self.ai_engine = DeepSeekEngine()

    async def generate_report(
        self,
        company_id: UUID,
        title: str,
        report_type: str,
        format: str,
        year: int,
        period: str | None,
        generated_by: UUID,
    ) -> Report:
        """Create a report record and trigger generation."""
        report = Report(
            company_id=company_id,
            generated_by=generated_by,
            title=title,
            report_type=report_type,
            format=format,
            year=year,
            period=period,
            status=ReportStatus.GENERATING.value,
        )
        report = await self.report_repo.create(report)
        return report

    async def process_report(self, report_id: UUID) -> None:
        """Process and generate the actual report content."""
        report = await self.report_repo.get_by_id(report_id)
        if not report:
            return

        try:
            # Gather data
            company = await self.company_repo.get_by_id(report.company_id)
            data_points = await self.dp_repo.list_by_company(
                report.company_id, year=report.year, limit=10000
            )
            scores = await self.scoring.calculate_scores(
                report.company_id, report.year
            )

            # Prepare data for AI
            company_info = {
                "name": company.name if company else "Unknown",
                "sector": company.sector if company else None,
                "country": company.country if company else None,
            }
            dp_dicts = [
                {
                    "pillar": dp.pillar,
                    "category": dp.category,
                    "value": dp.value,
                    "numeric_value": dp.numeric_value,
                    "unit": dp.unit,
                    "status": dp.status,
                }
                for dp in data_points
            ]

            # Generate AI report content
            ai_result = self.ai_engine.generate_report(
                company_info=company_info,
                data_points=dp_dicts,
                scores=scores,
                framework_mappings={},
            )

            report.content_json = ai_result.get("data", {})
            report.esg_scores = scores

            # Generate file
            if report.format == "pdf":
                file_path = await self._generate_pdf(report, ai_result["data"])
            elif report.format == "docx":
                file_path = await self._generate_docx(report, ai_result["data"])
            else:
                file_path = None

            report.file_path = file_path
            report.status = ReportStatus.COMPLETED.value
            report.completed_at = datetime.now(timezone.utc)

        except Exception as e:
            logger.error(f"Report generation failed: {e}")
            report.status = ReportStatus.FAILED.value
            report.error_message = str(e)

        await self.report_repo.update(report)

    async def _generate_pdf(self, report: Report, content: dict) -> str:
        """Generate PDF report using ReportLab."""
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib import colors

        output_dir = os.path.join(settings.UPLOAD_DIR, "reports", str(report.company_id))
        os.makedirs(output_dir, exist_ok=True)
        file_path = os.path.join(output_dir, f"{report.id}.pdf")

        doc = SimpleDocTemplate(file_path, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []

        # Title
        title_style = ParagraphStyle(
            "ReportTitle", parent=styles["Title"], fontSize=24, spaceAfter=30
        )
        story.append(Paragraph(report.title, title_style))
        story.append(Spacer(1, 20))

        # Executive Summary
        if content.get("executive_summary"):
            story.append(Paragraph("Executive Summary", styles["Heading1"]))
            story.append(Paragraph(content["executive_summary"], styles["Normal"]))
            story.append(Spacer(1, 20))

        # ESG Sections
        for section_key in ["environmental_section", "social_section", "governance_section"]:
            section = content.get(section_key, {})
            if section:
                section_title = section_key.replace("_section", "").title()
                story.append(Paragraph(section_title, styles["Heading1"]))
                if section.get("overview"):
                    story.append(Paragraph(section["overview"], styles["Normal"]))
                story.append(Spacer(1, 12))

        # Recommendations
        recs = content.get("recommendations", [])
        if recs:
            story.append(Paragraph("Recommendations", styles["Heading1"]))
            for i, rec in enumerate(recs, 1):
                story.append(Paragraph(f"{i}. {rec}", styles["Normal"]))

        doc.build(story)
        return file_path

    async def _generate_docx(self, report: Report, content: dict) -> str:
        """Generate DOCX report using python-docx."""
        from docx import Document as DocxDocument

        output_dir = os.path.join(settings.UPLOAD_DIR, "reports", str(report.company_id))
        os.makedirs(output_dir, exist_ok=True)
        file_path = os.path.join(output_dir, f"{report.id}.docx")

        doc = DocxDocument()
        doc.add_heading(report.title, 0)

        if content.get("executive_summary"):
            doc.add_heading("Executive Summary", level=1)
            doc.add_paragraph(content["executive_summary"])

        for section_key in ["environmental_section", "social_section", "governance_section"]:
            section = content.get(section_key, {})
            if section:
                section_title = section_key.replace("_section", "").title()
                doc.add_heading(section_title, level=1)
                if section.get("overview"):
                    doc.add_paragraph(section["overview"])

        recs = content.get("recommendations", [])
        if recs:
            doc.add_heading("Recommendations", level=1)
            for rec in recs:
                doc.add_paragraph(rec, style="List Bullet")

        doc.save(file_path)
        return file_path
