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
from app.repositories.user_repository import UserRepository
from app.services.scoring_service import ScoringService
from app.services.email_service import EmailService
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

            # Add company name to content for PDF generation
            content_data = ai_result.get("data", {})
            content_data["_company_name"] = company.name if company else "Company"

            report.content_json = content_data
            report.esg_scores = scores

            # Generate file
            if report.format == "pdf":
                file_path = await self._generate_pdf(report, content_data)
            elif report.format == "docx":
                file_path = await self._generate_docx(report, content_data)
            else:
                file_path = None

            report.file_path = file_path
            report.status = ReportStatus.COMPLETED.value
            report.completed_at = datetime.now(timezone.utc)

            # Send email notification
            try:
                user_repo = UserRepository(self.db)
                user = await user_repo.get_by_id(report.generated_by)
                if user and company:
                    email_service = EmailService()
                    await email_service.send_report_completed_email(
                        email=user.email,
                        name=user.full_name or user.email,
                        report_title=report.title,
                        company_name=company.name,
                    )
            except Exception as email_err:
                logger.warning(f"Failed to send report completion email: {email_err}")

        except Exception as e:
            logger.error(f"Report generation failed: {e}")
            report.status = ReportStatus.FAILED.value
            report.error_message = str(e)

        await self.report_repo.update(report)

    async def _generate_pdf(self, report: Report, content: dict) -> str:
        """Generate a professional PDF report using ReportLab."""
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm, mm
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
            HRFlowable, PageBreak, KeepTogether
        )
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
        from reportlab.graphics.shapes import Drawing, Rect, String
        from reportlab.graphics.charts.barcharts import VerticalBarChart
        from reportlab.graphics import renderPDF

        # ── Colors ──────────────────────────────────────────────────────────
        ESG_GREEN   = colors.HexColor("#16a34a")
        ESG_BLUE    = colors.HexColor("#2563eb")
        ESG_AMBER   = colors.HexColor("#d97706")
        ESG_DARK    = colors.HexColor("#111827")
        ESG_GRAY    = colors.HexColor("#6b7280")
        ESG_LIGHT   = colors.HexColor("#f9fafb")
        ESG_BORDER  = colors.HexColor("#e5e7eb")
        PILLAR_COLORS = {"Environmental": ESG_GREEN, "Social": ESG_BLUE, "Governance": ESG_AMBER}

        output_dir = os.path.join(settings.UPLOAD_DIR, "reports", str(report.company_id))
        os.makedirs(output_dir, exist_ok=True)
        file_path = os.path.join(output_dir, f"{report.id}.pdf")

        # ── Page template with header/footer ────────────────────────────────
        company_name_str = content.get("_company_name", "Company")
        report_year = str(report.year) if report.year else ""
        page_count_holder = [0]

        def on_first_page(canvas, doc):
            canvas.saveState()
            # Green header bar
            canvas.setFillColor(ESG_GREEN)
            canvas.rect(0, A4[1] - 2*cm, A4[0], 2*cm, fill=1, stroke=0)
            # ESG360 branding
            canvas.setFillColor(colors.white)
            canvas.setFont("Helvetica-Bold", 16)
            canvas.drawString(2*cm, A4[1] - 1.35*cm, "ESG360")
            canvas.setFont("Helvetica", 9)
            canvas.drawRightString(A4[0] - 2*cm, A4[1] - 1.35*cm, f"ESG Report · {report_year}")
            canvas.restoreState()

        def on_later_pages(canvas, doc):
            canvas.saveState()
            w, h = A4
            # Thin top bar
            canvas.setFillColor(ESG_GREEN)
            canvas.rect(0, h - 0.7*cm, w, 0.7*cm, fill=1, stroke=0)
            canvas.setFillColor(colors.white)
            canvas.setFont("Helvetica-Bold", 8)
            canvas.drawString(2*cm, h - 0.48*cm, "ESG360")
            # Footer
            canvas.setFillColor(ESG_LIGHT)
            canvas.rect(0, 0, w, 1.2*cm, fill=1, stroke=0)
            canvas.setStrokeColor(ESG_BORDER)
            canvas.setLineWidth(0.5)
            canvas.line(0, 1.2*cm, w, 1.2*cm)
            canvas.setFillColor(ESG_GRAY)
            canvas.setFont("Helvetica", 7.5)
            canvas.drawString(2*cm, 0.45*cm, f"{company_name_str} · ESG Report {report_year} · CONFIDENTIAL")
            canvas.drawRightString(w - 2*cm, 0.45*cm, f"Page {doc.page}")
            canvas.restoreState()

        doc = SimpleDocTemplate(
            file_path, pagesize=A4,
            leftMargin=2*cm, rightMargin=2*cm,
            topMargin=3*cm, bottomMargin=2.5*cm,
            title=report.title,
            author="ESG360",
            subject="ESG Report",
        )

        # ── Styles ───────────────────────────────────────────────────────────
        base = getSampleStyleSheet()

        def S(name, **kw):
            s = ParagraphStyle(name, **kw)
            return s

        sTitle       = S("RTitle",  parent=base["Title"],   fontSize=36, textColor=ESG_DARK,    spaceAfter=8,  leading=44, alignment=TA_CENTER, fontName="Helvetica-Bold")
        sSubtitle    = S("RSub",    parent=base["Normal"],  fontSize=14, textColor=ESG_GRAY,    spaceAfter=4,  leading=20, alignment=TA_CENTER)
        sH1          = S("RH1",     parent=base["Heading1"],fontSize=18, textColor=ESG_DARK,    spaceBefore=18,spaceAfter=8,  fontName="Helvetica-Bold")
        sH2          = S("RH2",     parent=base["Heading2"],fontSize=13, textColor=ESG_DARK,    spaceBefore=12,spaceAfter=6,  fontName="Helvetica-Bold")
        sBody        = S("RBody",   parent=base["Normal"],  fontSize=10, textColor=ESG_DARK,    spaceAfter=6,  leading=15, alignment=TA_JUSTIFY)
        sCaption     = S("RCap",    parent=base["Normal"],  fontSize=8,  textColor=ESG_GRAY,    spaceAfter=4,  leading=12)
        sBullet      = S("RBullet", parent=base["Normal"],  fontSize=10, textColor=ESG_DARK,    spaceAfter=4,  leading=14, leftIndent=14, firstLineIndent=-10)
        sLabel       = S("RLabel",  parent=base["Normal"],  fontSize=8,  textColor=ESG_GRAY,    spaceAfter=2,  fontName="Helvetica-Bold")
        sValue       = S("RValue",  parent=base["Normal"],  fontSize=22, textColor=ESG_GREEN,   spaceAfter=2,  fontName="Helvetica-Bold", alignment=TA_CENTER)
        sMeta        = S("RMeta",   parent=base["Normal"],  fontSize=9,  textColor=ESG_GRAY,    spaceAfter=4,  alignment=TA_CENTER)

        story = []

        # ── COVER PAGE ───────────────────────────────────────────────────────
        story.append(Spacer(1, 3*cm))

        # Big green accent bar
        story.append(HRFlowable(width="100%", thickness=6, color=ESG_GREEN, spaceAfter=28))

        story.append(Paragraph(report.title or "ESG Report", sTitle))
        story.append(Spacer(1, 0.4*cm))
        story.append(Paragraph(company_name_str, sSubtitle))
        story.append(Spacer(1, 0.2*cm))
        story.append(Paragraph(f"Reporting Year: {report_year}  ·  Framework: {report.report_type or 'Multi-Framework'}", sMeta))
        story.append(Spacer(1, 1*cm))

        # ESG Scores summary box
        scores = report.esg_scores or {}
        if scores:
            score_data = [
                [
                    Paragraph("Overall", sLabel),
                    Paragraph("Environmental", sLabel),
                    Paragraph("Social", sLabel),
                    Paragraph("Governance", sLabel),
                ],
                [
                    Paragraph(str(int(scores.get("overall", 0))), sValue),
                    Paragraph(str(int(scores.get("environmental", 0))), S("RVE", parent=sValue, textColor=ESG_GREEN)),
                    Paragraph(str(int(scores.get("social", 0))), S("RVS", parent=sValue, textColor=ESG_BLUE)),
                    Paragraph(str(int(scores.get("governance", 0))), S("RVG", parent=sValue, textColor=ESG_AMBER)),
                ],
            ]
            score_table = Table(score_data, colWidths=["25%","25%","25%","25%"])
            score_table.setStyle(TableStyle([
                ("BACKGROUND", (0,0), (-1,-1), ESG_LIGHT),
                ("BACKGROUND", (0,0), (-1,0), colors.white),
                ("BOX",        (0,0), (-1,-1), 1, ESG_BORDER),
                ("INNERGRID",  (0,0), (-1,-1), 0.5, ESG_BORDER),
                ("TOPPADDING", (0,0), (-1,-1), 10),
                ("BOTTOMPADDING",(0,0),(-1,-1),10),
                ("ALIGN",      (0,0), (-1,-1), "CENTER"),
                ("VALIGN",     (0,0), (-1,-1), "MIDDLE"),
                ("ROUNDEDCORNERS", [6]),
            ]))
            story.append(score_table)
            story.append(Spacer(1, 0.5*cm))

        story.append(HRFlowable(width="100%", thickness=1, color=ESG_BORDER, spaceAfter=12))
        from datetime import date
        story.append(Paragraph(f"Generated by ESG360 AI Platform  ·  {date.today().strftime('%B %d, %Y')}  ·  CONFIDENTIAL", sMeta))
        story.append(PageBreak())

        # ── TABLE OF CONTENTS (static) ───────────────────────────────────────
        story.append(Paragraph("Table of Contents", sH1))
        story.append(HRFlowable(width="100%", thickness=1.5, color=ESG_GREEN, spaceAfter=12))
        toc_items = [
            ("1.", "Executive Summary"),
            ("2.", "Environmental Performance"),
            ("3.", "Social Performance"),
            ("4.", "Governance Performance"),
            ("5.", "Recommendations"),
            ("6.", "Methodology & Sources"),
        ]
        for num, title in toc_items:
            toc_row = Table(
                [[Paragraph(f"<b>{num}</b>", sBody), Paragraph(title, sBody), Paragraph("···", sCaption)]],
                colWidths=[1*cm, 12*cm, None]
            )
            toc_row.setStyle(TableStyle([
                ("ALIGN",  (2,0), (2,0), "RIGHT"),
                ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
                ("TOPPADDING", (0,0), (-1,-1), 4),
                ("BOTTOMPADDING", (0,0), (-1,-1), 4),
            ]))
            story.append(toc_row)
        story.append(PageBreak())

        # ── EXECUTIVE SUMMARY ────────────────────────────────────────────────
        story.append(Paragraph("1. Executive Summary", sH1))
        story.append(HRFlowable(width="100%", thickness=1.5, color=ESG_GREEN, spaceAfter=12))
        if content.get("executive_summary"):
            story.append(Paragraph(content["executive_summary"], sBody))
        story.append(Spacer(1, 0.5*cm))

        # ── ESG PILLAR SECTIONS ──────────────────────────────────────────────
        section_map = [
            ("environmental_section", "2. Environmental Performance", ESG_GREEN, "E"),
            ("social_section",        "3. Social Performance",        ESG_BLUE,  "S"),
            ("governance_section",    "4. Governance Performance",    ESG_AMBER, "G"),
        ]

        for section_key, section_title, section_color, pillar_code in section_map:
            section = content.get(section_key, {})
            if not section:
                continue

            story.append(Paragraph(section_title, sH1))
            story.append(HRFlowable(width="100%", thickness=1.5, color=section_color, spaceAfter=12))

            # Pillar score badge
            pillar_score = 0
            if pillar_code == "E":
                pillar_score = int(scores.get("environmental", 0))
            elif pillar_code == "S":
                pillar_score = int(scores.get("social", 0))
            elif pillar_code == "G":
                pillar_score = int(scores.get("governance", 0))

            if pillar_score:
                badge = Table(
                    [[Paragraph(f"Score: {pillar_score}/100", S("badge", parent=sBody, textColor=colors.white, fontName="Helvetica-Bold"))]],
                    colWidths=[4*cm]
                )
                badge.setStyle(TableStyle([
                    ("BACKGROUND", (0,0), (-1,-1), section_color),
                    ("TOPPADDING", (0,0), (-1,-1), 6),
                    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
                    ("LEFTPADDING", (0,0), (-1,-1), 12),
                    ("ROUNDEDCORNERS", [4]),
                ]))
                story.append(badge)
                story.append(Spacer(1, 0.3*cm))

            if section.get("overview"):
                story.append(Paragraph(section["overview"], sBody))

            # Key metrics table
            metrics = section.get("key_metrics", [])
            if metrics:
                story.append(Spacer(1, 0.3*cm))
                story.append(Paragraph("Key Metrics", sH2))
                header = [
                    Paragraph("<b>Metric</b>", sCaption),
                    Paragraph("<b>Value</b>", sCaption),
                    Paragraph("<b>Trend</b>", sCaption),
                ]
                rows = [header]
                for m in metrics[:8]:
                    rows.append([
                        Paragraph(m.get("metric", ""), sBody),
                        Paragraph(str(m.get("value", "")), sBody),
                        Paragraph(m.get("trend", "—"), sBody),
                    ])
                metrics_table = Table(rows, colWidths=[8*cm, 4*cm, 3*cm])
                metrics_table.setStyle(TableStyle([
                    ("BACKGROUND",    (0,0), (-1,0), ESG_LIGHT),
                    ("BACKGROUND",    (0,1), (-1,-1), colors.white),
                    ("ROWBACKGROUNDS",(0,1), (-1,-1), [colors.white, ESG_LIGHT]),
                    ("BOX",           (0,0), (-1,-1), 0.5, ESG_BORDER),
                    ("INNERGRID",     (0,0), (-1,-1), 0.25, ESG_BORDER),
                    ("TOPPADDING",    (0,0), (-1,-1), 7),
                    ("BOTTOMPADDING", (0,0), (-1,-1), 7),
                    ("LEFTPADDING",   (0,0), (-1,-1), 8),
                    ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
                ]))
                story.append(metrics_table)

            # Highlights
            highlights = section.get("highlights", [])
            if highlights:
                story.append(Spacer(1, 0.3*cm))
                story.append(Paragraph("Highlights", sH2))
                for h in highlights:
                    story.append(Paragraph(f"• {h}", sBullet))

            # Risks
            risks = section.get("risks", [])
            if risks:
                story.append(Spacer(1, 0.3*cm))
                story.append(Paragraph("Risks & Challenges", sH2))
                for r in risks:
                    story.append(Paragraph(f"▸ {r}", sBullet))

            story.append(PageBreak())

        # ── RECOMMENDATIONS ──────────────────────────────────────────────────
        recs = content.get("recommendations", [])
        if recs:
            story.append(Paragraph("5. Recommendations", sH1))
            story.append(HRFlowable(width="100%", thickness=1.5, color=ESG_GREEN, spaceAfter=12))
            for i, rec in enumerate(recs, 1):
                rec_box = Table(
                    [[
                        Paragraph(f"<b>{i:02d}</b>", S("rnum", parent=sValue, fontSize=14, textColor=section_color if 'section_color' in dir() else ESG_GREEN)),
                        Paragraph(rec, sBody),
                    ]],
                    colWidths=[1.2*cm, None]
                )
                rec_box.setStyle(TableStyle([
                    ("BACKGROUND",    (0,0), (-1,-1), ESG_LIGHT),
                    ("TOPPADDING",    (0,0), (-1,-1), 10),
                    ("BOTTOMPADDING", (0,0), (-1,-1), 10),
                    ("LEFTPADDING",   (0,0), (-1,-1), 12),
                    ("RIGHTPADDING",  (0,0), (-1,-1), 12),
                    ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
                    ("BOX",           (0,0), (-1,-1), 0.5, ESG_BORDER),
                    ("LEFTPADDING",   (0,0), (0,0), 8),
                ]))
                story.append(rec_box)
                story.append(Spacer(1, 0.3*cm))
            story.append(PageBreak())

        # ── METHODOLOGY ──────────────────────────────────────────────────────
        story.append(Paragraph("6. Methodology & Sources", sH1))
        story.append(HRFlowable(width="100%", thickness=1.5, color=ESG_GREEN, spaceAfter=12))

        methodology = content.get("methodology_notes") or (
            "This report was generated by the ESG360 AI platform. Data was extracted from company-provided documents "
            "using advanced Natural Language Processing (NLP) and classified according to the GRI Standards, SASB "
            "Frameworks, and TCFD Recommendations. ESG scores are calculated using a weighted methodology across "
            "Environmental (40%), Social (30%), and Governance (30%) pillars, with sub-indicator scoring based on "
            "data availability, validation status, and AI confidence levels. Industry benchmarks are derived from "
            "publicly available ESG disclosure data and representative sector baselines."
        )
        story.append(Paragraph(methodology, sBody))
        story.append(Spacer(1, 0.5*cm))

        # Disclaimer
        disclaimer_box = Table(
            [[Paragraph(
                "<b>Disclaimer:</b> This report is based on data provided by the reporting organization. "
                "ESG360 does not independently verify the accuracy of underlying data. This report is intended "
                "for informational purposes and should not be construed as investment, legal, or regulatory advice.",
                S("disc", parent=sCaption, textColor=ESG_GRAY)
            )]],
            colWidths=["100%"]
        )
        disclaimer_box.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), ESG_LIGHT),
            ("BOX",        (0,0), (-1,-1), 0.5, ESG_BORDER),
            ("TOPPADDING", (0,0), (-1,-1), 12),
            ("BOTTOMPADDING",(0,0),(-1,-1),12),
            ("LEFTPADDING", (0,0), (-1,-1), 14),
            ("RIGHTPADDING",(0,0), (-1,-1), 14),
        ]))
        story.append(disclaimer_box)

        doc.build(story, onFirstPage=on_first_page, onLaterPages=on_later_pages)
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
