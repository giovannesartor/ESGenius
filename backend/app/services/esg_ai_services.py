"""Combined ESG-AI services: chat, recommendations, regulatory, autofill, privacy,
greenwashing scan, materiality matrix, multi-model validation, CSV mapping.

Each is a small, focused class. Grouped here to keep file count manageable.
"""

from __future__ import annotations

import csv
import io
import json
import logging
from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.deepseek_engine import get_engine
from app.domain.models.chat import ChatConversation, ChatMessage
from app.domain.models.regulatory import RegulatoryUpdate
from app.repositories.platform_repos import (
    ChatRepository,
    RegulatoryUpdateRepository,
    SectorBenchmarkRepository,
)
from app.repositories.user_repository import UserRepository
from app.services.rag_service import RAGService

logger = logging.getLogger(__name__)


# =================== ChatService ===================
class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ChatRepository(db)
        self.rag = RAGService(db)

    async def get_or_create_conversation(
        self, conv_id: Optional[UUID], company_id: UUID, user_id: UUID, title: Optional[str] = None
    ) -> ChatConversation:
        if conv_id:
            conv = await self.repo.get_conversation(conv_id, user_id)
            if conv:
                return conv
        return await self.repo.create_conversation(
            ChatConversation(
                company_id=company_id, user_id=user_id, title=title or "New conversation"
            )
        )

    async def send_message(
        self,
        conversation_id: Optional[UUID],
        company_id: UUID,
        user_id: UUID,
        message: str,
        language: str = "en",
    ) -> dict:
        conv = await self.get_or_create_conversation(
            conversation_id, company_id, user_id, title=message[:60]
        )

        chunks = await self.rag.retrieve(company_id, message, top_k=5)
        context_parts = []
        citations = []
        for c in chunks:
            context_parts.append(
                f"[doc:{c.document_id} page:{c.page_number or '?'}]\n{c.content[:1500]}"
            )
            citations.append(
                {
                    "document_id": str(c.document_id),
                    "page_number": c.page_number,
                    "snippet": (c.content[:200] + "...") if len(c.content) > 200 else c.content,
                }
            )

        context = "\n\n---\n\n".join(context_parts) if context_parts else "(no documents indexed)"

        history_msgs = await self.repo.list_messages(conv.id)
        history_payload = [
            {"role": m.role, "content": m.content} for m in history_msgs[-10:]
        ]

        system = (
            f"You are an ESG expert assistant. Respond in {language}. "
            "When you use information from the provided context, cite as [doc:<id> page:<n>]. "
            "If the answer is not in the context, say so honestly. Be concise and accurate."
        )
        prompt = f"## Context from company documents:\n{context}\n\n## User question:\n{message}"

        messages = [{"role": "system", "content": system}] + history_payload + [
            {"role": "user", "content": prompt}
        ]

        try:
            answer = await get_engine().chat(messages, json_mode=False)
        except Exception as e:  # noqa: BLE001
            logger.error(f"chat AI failed: {e}")
            answer = "I'm sorry, I couldn't process your request right now. Please try again."

        await self.repo.add_message(
            ChatMessage(conversation_id=conv.id, role="user", content=message)
        )
        assistant_msg = await self.repo.add_message(
            ChatMessage(
                conversation_id=conv.id,
                role="assistant",
                content=answer,
                citations=citations,
            )
        )
        conv.updated_at = datetime.now(timezone.utc)
        await self.db.flush()

        return {
            "conversation_id": conv.id,
            "message_id": assistant_msg.id,
            "answer": answer,
            "citations": citations,
        }


# =================== RecommendationsService ===================
class RecommendationsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate(self, company_id: UUID, language: str = "en", limit: int = 5, year: Optional[int] = None) -> list[dict]:
        from app.repositories.company_repository import CompanyRepository
        from app.repositories.data_point_repository import DataPointRepository
        from app.services.scoring_service import ScoringService

        crepo = CompanyRepository(self.db)
        drepo = DataPointRepository(self.db)
        company = await crepo.get_by_id(company_id)
        if not company:
            return []

        data_points = await drepo.list_by_company(company_id, limit=500)
        target_year = year or (datetime.now(timezone.utc).year)
        scoring = ScoringService(self.db)
        try:
            scores = await scoring.calculate_scores(company_id, target_year)
        except Exception:  # noqa: BLE001
            scores = {"environmental": 0, "social": 0, "governance": 0, "overall": 0}

        prompt = f"""You are an ESG advisor. Generate the top {limit} prioritized actions for this company.
Reply in {language}. Output JSON with key "recommendations" as a list of objects with keys:
title, description, category (environmental|social|governance), priority (high|medium|low),
estimated_impact (1-10), effort (low|medium|high), framework_codes (list of strings).

Company: {company.name}
Sector: {company.industry or 'general'}
Country: {company.country or 'unknown'}
Current ESG scores: E={scores.get('environmental',0):.0f}, S={scores.get('social',0):.0f}, G={scores.get('governance',0):.0f}
Number of data points reported: {len(data_points)}
"""
        try:
            resp = await get_engine().chat(
                [{"role": "user", "content": prompt}], json_mode=True
            )
            data = json.loads(resp)
            return data.get("recommendations", [])[:limit]
        except Exception as e:  # noqa: BLE001
            logger.error(f"recommendations failed: {e}")
            return []


# =================== RegulatoryService ===================
class RegulatoryService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = RegulatoryUpdateRepository(db)

    async def list_for_company(self, company, limit: int = 20) -> list[RegulatoryUpdate]:
        region = company.country if company else None
        sector = company.industry if company else None
        return list(await self.repo.list_recent(region=region, sector=sector, limit=limit))


# =================== AutoFillService ===================
class AutoFillService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.bench = SectorBenchmarkRepository(db)

    async def suggest(
        self,
        company_id: UUID,
        sector: Optional[str],
        year: int,
        framework_codes: list[str],
    ) -> list[dict]:
        """Suggest values for missing data points using benchmarks + previous year."""
        from app.repositories.data_point_repository import DataPointRepository

        drepo = DataPointRepository(self.db)
        existing = await drepo.list_by_company(company_id, limit=500)
        existing_metric_ids = {dp.metric_id for dp in existing if dp.metric_id}

        suggestions: list[dict] = []
        if sector:
            benchmarks = await self.bench.list_for_sector(sector, year)
            for b in benchmarks:
                suggestions.append(
                    {
                        "metric_code": b.metric_code,
                        "suggested_value": b.median_value or b.avg_value,
                        "unit": b.unit,
                        "source": f"sector benchmark ({b.sector}, year {b.year})",
                        "confidence": 0.5,
                        "framework_codes": framework_codes,
                    }
                )

        prev_year = year - 1
        prev_dps = [dp for dp in existing if getattr(dp, "year", None) == prev_year]
        for dp in prev_dps:
            if dp.metric_id in existing_metric_ids:
                continue
            suggestions.append(
                {
                    "metric_code": str(dp.metric_id) if dp.metric_id else None,
                    "suggested_value": dp.numeric_value,
                    "unit": dp.unit,
                    "source": f"previous year ({prev_year}) value",
                    "confidence": 0.7,
                    "framework_codes": framework_codes,
                }
            )

        return suggestions[:50]


# =================== PrivacyService ===================
class PrivacyService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def export_user_data(self, user_id: UUID) -> dict:
        from app.domain.models.audit_log import AuditLog
        from app.domain.models.notification import Notification
        from sqlalchemy import select

        urepo = UserRepository(self.db)
        user = await urepo.get_by_id(user_id)
        if not user:
            return {}

        notifications = (
            await self.db.execute(select(Notification).where(Notification.user_id == user_id))
        ).scalars().all()
        audit = (
            await self.db.execute(select(AuditLog).where(AuditLog.user_id == user_id))
        ).scalars().all()

        return {
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "user": {
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "language": getattr(user, "language", None),
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "notification_prefs": user.notification_prefs,
            },
            "notifications": [
                {
                    "id": str(n.id),
                    "type": n.type,
                    "title": n.title,
                    "body": n.body,
                    "is_read": n.is_read,
                    "created_at": n.created_at.isoformat() if n.created_at else None,
                }
                for n in notifications
            ],
            "audit_logs": [
                {
                    "id": str(a.id),
                    "action": a.action,
                    "entity_type": a.entity_type,
                    "entity_id": str(a.entity_id) if a.entity_id else None,
                    "created_at": a.created_at.isoformat() if a.created_at else None,
                }
                for a in audit
            ],
        }

    async def delete_user_account(self, user_id: UUID) -> dict:
        from app.domain.models.notification import Notification
        from app.domain.models.user import User

        await self.db.execute(delete(Notification).where(Notification.user_id == user_id))
        # Anonymize audit logs (keep for compliance) — set user_id to NULL
        from app.domain.models.audit_log import AuditLog
        from sqlalchemy import update as sqlupdate

        await self.db.execute(
            sqlupdate(AuditLog).where(AuditLog.user_id == user_id).values(user_id=None)
        )
        await self.db.execute(delete(User).where(User.id == user_id))
        await self.db.flush()
        return {"deleted": True, "user_id": str(user_id)}


# =================== GreenwashingService ===================
class GreenwashingService:
    async def scan_text(self, text: str, language: str = "en") -> dict:
        prompt = f"""Analyze the following ESG/sustainability text for greenwashing risks.
Reply in {language}. Identify vague claims, unsupported superlatives, missing baselines,
selective disclosure, and offsetting overstatements.

Output JSON with keys:
- overall_risk: low|medium|high
- score: 0-100 (higher = more risky)
- flags: list of objects with keys: phrase, issue, severity (low|medium|high), suggestion

TEXT:
{text[:6000]}
"""
        try:
            resp = await get_engine().chat(
                [{"role": "user", "content": prompt}], json_mode=True
            )
            return json.loads(resp)
        except Exception as e:  # noqa: BLE001
            logger.error(f"greenwashing scan failed: {e}")
            return {"overall_risk": "low", "score": 0, "flags": []}


# =================== MaterialityService ===================
class MaterialityService:
    async def build_matrix(
        self, company_name: str, sector: Optional[str], country: Optional[str], language: str = "en"
    ) -> dict:
        prompt = f"""Build a double-materiality matrix for this company.
Reply in {language}. Output JSON with key "topics" as a list of objects with:
name, category (environmental|social|governance), impact_score (1-10),
financial_score (1-10), description.

Company: {company_name}
Sector: {sector or 'general'}
Country: {country or 'unknown'}

Return 12-15 most relevant topics.
"""
        try:
            resp = await get_engine().chat(
                [{"role": "user", "content": prompt}], json_mode=True
            )
            return json.loads(resp)
        except Exception as e:  # noqa: BLE001
            logger.error(f"materiality matrix failed: {e}")
            return {"topics": []}


# =================== MultiModelValidator ===================
class MultiModelValidator:
    """Re-prompt the LLM with a critic role for self-consistency."""

    async def validate_extraction(self, original_text: str, extracted: dict, language: str = "en") -> dict:
        prompt = f"""You are a critical ESG auditor. The following data was extracted from a document.
Reply in {language}. Verify each value's plausibility, units, and check for hallucinations.

Output JSON with keys:
- is_valid: bool
- confidence: 0-1
- issues: list of objects with keys: field, issue, severity, suggestion

ORIGINAL TEXT (excerpt):
{original_text[:3000]}

EXTRACTED DATA:
{json.dumps(extracted, indent=2)[:3000]}
"""
        try:
            resp = await get_engine().chat(
                [{"role": "user", "content": prompt}], json_mode=True
            )
            return json.loads(resp)
        except Exception as e:  # noqa: BLE001
            logger.error(f"validator failed: {e}")
            return {"is_valid": True, "confidence": 0.5, "issues": []}


# =================== CSVMappingService ===================
class CSVMappingService:
    """Helps users map arbitrary CSV columns to known ESG metrics."""

    async def suggest_mapping(self, csv_text: str, language: str = "en") -> dict:
        # Parse just the header + first 5 rows
        try:
            reader = csv.reader(io.StringIO(csv_text))
            rows = []
            for i, row in enumerate(reader):
                rows.append(row)
                if i >= 5:
                    break
            if not rows:
                return {"columns": [], "rows": []}
            header = rows[0]
            sample = rows[1:]
        except Exception as e:  # noqa: BLE001
            return {"error": f"could not parse CSV: {e}"}

        prompt = f"""Map these CSV columns to ESG metric codes. Reply in {language}.
Output JSON with key "mappings" — list of objects with:
column_name, suggested_metric_code, confidence (0-1),
suggested_unit, suggested_category (environmental|social|governance), notes.

HEADERS: {header}
SAMPLE ROWS: {sample}

Use canonical metric codes like: scope1_emissions_tco2e, scope2_emissions_tco2e,
scope3_emissions_tco2e, energy_consumption_mwh, water_withdrawal_m3,
waste_generated_kg, employee_count, women_in_workforce_pct, ltifr,
board_independence_pct, board_diversity_pct, etc.
"""
        try:
            resp = await get_engine().chat(
                [{"role": "user", "content": prompt}], json_mode=True
            )
            data = json.loads(resp)
            data["headers"] = header
            data["sample"] = sample
            return data
        except Exception as e:  # noqa: BLE001
            logger.error(f"csv mapping failed: {e}")
            return {"mappings": [], "headers": header, "sample": sample}

    def apply_mapping(
        self, csv_text: str, mapping: list[dict[str, str]]
    ) -> list[dict[str, Any]]:
        """Apply column->metric_code mapping; return list of data point dicts."""
        reader = csv.DictReader(io.StringIO(csv_text))
        results: list[dict[str, Any]] = []
        col_to_metric = {m["column_name"]: m for m in mapping}
        for row in reader:
            for col, value in row.items():
                if col not in col_to_metric:
                    continue
                m = col_to_metric[col]
                try:
                    numeric = float(str(value).replace(",", "."))
                except (TypeError, ValueError):
                    continue
                results.append(
                    {
                        "metric_code": m.get("suggested_metric_code") or m.get("metric_code"),
                        "value": numeric,
                        "unit": m.get("suggested_unit") or m.get("unit"),
                        "category": m.get("suggested_category") or m.get("category"),
                    }
                )
        return results
