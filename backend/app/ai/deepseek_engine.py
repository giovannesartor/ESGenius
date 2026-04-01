"""
DeepSeek AI Engine — all AI functions for ESG data processing.

All outputs are strictly structured JSON.
"""

import json
import logging
import time
from typing import Any, Optional
from uuid import UUID

from openai import OpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)


class DeepSeekEngine:
    """Interfaces with DeepSeek API for all ESG AI operations."""

    def __init__(self):
        self.client = OpenAI(
            api_key=settings.DEEPSEEK_API_KEY,
            base_url=settings.DEEPSEEK_BASE_URL,
        )
        self.model = settings.DEEPSEEK_MODEL

    def _call_ai(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.1,
    ) -> dict[str, Any]:
        """Make a structured JSON call to DeepSeek."""
        start_time = time.time()

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            response_format={"type": "json_object"},
        )

        latency_ms = int((time.time() - start_time) * 1000)
        content = response.choices[0].message.content or "{}"

        result = json.loads(content)

        # Build metadata
        meta = {
            "model": self.model,
            "tokens_input": response.usage.prompt_tokens if response.usage else 0,
            "tokens_output": response.usage.completion_tokens if response.usage else 0,
            "latency_ms": latency_ms,
        }

        return {"data": result, "meta": meta}

    def extract_esg_data(self, text: str, context: Optional[str] = None) -> dict[str, Any]:
        """Extract ESG data points from raw text."""
        system_prompt = """You are an ESG data extraction expert. Extract all ESG-related data points from the provided text.

Return a JSON object with this exact structure:
{
  "data_points": [
    {
      "category": "environmental|social|governance",
      "subcategory": "string",
      "metric_name": "string",
      "value": "string or number",
      "unit": "string or null",
      "year": "number or null",
      "period": "string or null",
      "confidence": 0.0-1.0,
      "source_text": "exact text snippet where data was found"
    }
  ],
  "summary": "Brief summary of ESG data found",
  "total_data_points": number
}"""

        user_prompt = f"Extract ESG data from the following text:\n\n{text}"
        if context:
            user_prompt += f"\n\nAdditional context: {context}"

        return self._call_ai(system_prompt, user_prompt)

    def classify_esg_data(self, data_points: list[dict]) -> dict[str, Any]:
        """Classify ESG data points into E, S, G pillars and subcategories."""
        system_prompt = """You are an ESG classification expert. Classify each data point into the correct ESG pillar and subcategory.

Return a JSON object with this structure:
{
  "classified_data": [
    {
      "original_index": number,
      "pillar": "E|S|G",
      "category": "string",
      "subcategory": "string",
      "relevance_score": 0.0-1.0,
      "classification_reason": "string"
    }
  ],
  "distribution": {
    "environmental": number,
    "social": number,
    "governance": number
  }
}"""

        user_prompt = f"Classify these ESG data points:\n\n{json.dumps(data_points, indent=2)}"
        return self._call_ai(system_prompt, user_prompt)

    def map_to_framework(
        self, data_points: list[dict], framework: str, framework_indicators: list[dict]
    ) -> dict[str, Any]:
        """Map data points to a specific ESG framework (GRI, SASB, TCFD)."""
        system_prompt = f"""You are an ESG framework mapping expert specializing in {framework}.

Map each data point to the most relevant {framework} indicators.

Return a JSON object with this structure:
{{
  "mappings": [
    {{
      "data_point_index": number,
      "framework_code": "{framework}",
      "indicator_code": "string",
      "indicator_name": "string",
      "match_confidence": 0.0-1.0,
      "mapping_notes": "string"
    }}
  ],
  "coverage": {{
    "total_indicators": number,
    "mapped_indicators": number,
    "coverage_percentage": number
  }},
  "unmapped_data_points": [number]
}}"""

        user_prompt = f"""Data points:\n{json.dumps(data_points, indent=2)}

Available {framework} indicators:\n{json.dumps(framework_indicators, indent=2)}"""

        return self._call_ai(system_prompt, user_prompt)

    def detect_inconsistencies(self, data_points: list[dict]) -> dict[str, Any]:
        """Detect inconsistencies in ESG data."""
        system_prompt = """You are an ESG audit expert. Analyze the data for inconsistencies, anomalies, and potential errors.

Return a JSON object with this structure:
{
  "inconsistencies": [
    {
      "type": "contradiction|outlier|unit_mismatch|temporal_inconsistency|missing_context",
      "severity": "high|medium|low",
      "data_point_indices": [number],
      "description": "string",
      "recommendation": "string"
    }
  ],
  "overall_quality_score": 0.0-1.0,
  "total_issues": number
}"""

        user_prompt = f"Analyze these ESG data points for inconsistencies:\n\n{json.dumps(data_points, indent=2)}"
        return self._call_ai(system_prompt, user_prompt)

    def detect_missing_data(
        self, data_points: list[dict], framework: str, required_indicators: list[dict]
    ) -> dict[str, Any]:
        """Detect missing data relative to a framework's requirements."""
        system_prompt = f"""You are an ESG completeness analyst. Compare the available data against {framework} requirements and identify gaps.

Return a JSON object with this structure:
{{
  "missing_indicators": [
    {{
      "indicator_code": "string",
      "indicator_name": "string",
      "priority": "critical|important|optional",
      "suggestion": "string"
    }}
  ],
  "completeness_score": 0.0-1.0,
  "total_required": number,
  "total_available": number,
  "gap_analysis": "string"
}}"""

        user_prompt = f"""Available data:\n{json.dumps(data_points, indent=2)}

Required {framework} indicators:\n{json.dumps(required_indicators, indent=2)}"""

        return self._call_ai(system_prompt, user_prompt)

    def generate_report(
        self,
        company_info: dict,
        data_points: list[dict],
        scores: dict,
        framework_mappings: dict,
    ) -> dict[str, Any]:
        """Generate an ESG report narrative and analysis."""
        system_prompt = """You are an ESG report writer. Generate a comprehensive ESG report.

Return a JSON object with this structure:
{
  "executive_summary": "string",
  "environmental_section": {
    "overview": "string",
    "key_metrics": [{"metric": "string", "value": "string", "trend": "string"}],
    "highlights": ["string"],
    "risks": ["string"]
  },
  "social_section": {
    "overview": "string",
    "key_metrics": [{"metric": "string", "value": "string", "trend": "string"}],
    "highlights": ["string"],
    "risks": ["string"]
  },
  "governance_section": {
    "overview": "string",
    "key_metrics": [{"metric": "string", "value": "string", "trend": "string"}],
    "highlights": ["string"],
    "risks": ["string"]
  },
  "recommendations": ["string"],
  "methodology_notes": "string"
}"""

        user_prompt = f"""Company: {json.dumps(company_info)}

ESG Data Points: {json.dumps(data_points, indent=2)}

ESG Scores: {json.dumps(scores)}

Framework Mappings: {json.dumps(framework_mappings)}"""

        return self._call_ai(system_prompt, user_prompt, temperature=0.3)
