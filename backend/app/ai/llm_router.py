"""
Multi-provider LLM router.

Provides a unified async `chat()` interface across Anthropic, OpenAI and DeepSeek
with automatic fallback, latency tracking, citation-friendly JSON mode, and
optional PII redaction before any external call.

Strategic intent (per ESG Financial Intelligence Infrastructure thesis):
  * Vendor independence — no single LLM lock-in.
  * EU/US/BR data residency switch (config-driven).
  * Auditability — every call returns provider/model/latency/tokens metadata
    that the caller can persist into the immutable AI log.
  * Citation-first — JSON object responses are forced when `json_mode=True`.
"""

from __future__ import annotations

import json
import logging
import re
import time
from dataclasses import dataclass
from typing import Any, Optional

from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# PII redactor
# ---------------------------------------------------------------------------

_RE_EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
_RE_CPF = re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b")
_RE_CNPJ = re.compile(r"\b\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}\b")
_RE_PHONE = re.compile(r"\+?\d[\d\s().-]{8,}\d")
_RE_SSN = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")


def redact_pii(text: str) -> str:
    """Best-effort PII redaction. Replaces sensitive patterns with tokens."""
    if not text:
        return text
    text = _RE_EMAIL.sub("[EMAIL]", text)
    text = _RE_CPF.sub("[CPF]", text)
    text = _RE_CNPJ.sub("[CNPJ]", text)
    text = _RE_SSN.sub("[SSN]", text)
    text = _RE_PHONE.sub("[PHONE]", text)
    return text


# ---------------------------------------------------------------------------
# Result type
# ---------------------------------------------------------------------------


@dataclass
class LLMResult:
    content: str  # raw string; if json_mode, this is JSON-serialized
    data: Optional[dict[str, Any]]  # parsed JSON if json_mode and parseable
    provider: str
    model: str
    tokens_input: int
    tokens_output: int
    latency_ms: int
    fallback_chain: list[str]  # providers attempted before success


# ---------------------------------------------------------------------------
# Provider adapters
# ---------------------------------------------------------------------------


class _BaseProvider:
    name: str = "base"

    async def chat(
        self,
        system: str,
        user: str,
        json_mode: bool,
        temperature: float,
        max_tokens: int,
    ) -> tuple[str, str, int, int]:
        """Returns (content, model, tokens_in, tokens_out)."""
        raise NotImplementedError


class _DeepSeekProvider(_BaseProvider):
    name = "deepseek"

    def __init__(self) -> None:
        self.client = AsyncOpenAI(
            api_key=settings.DEEPSEEK_API_KEY or "missing",
            base_url=settings.DEEPSEEK_BASE_URL,
        )
        self.model = settings.DEEPSEEK_MODEL

    async def chat(self, system, user, json_mode, temperature, max_tokens):
        kwargs: dict[str, Any] = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        resp = await self.client.chat.completions.create(**kwargs)
        choice = resp.choices[0].message.content or ""
        usage = resp.usage
        return choice, self.model, usage.prompt_tokens if usage else 0, usage.completion_tokens if usage else 0


class _OpenAIProvider(_BaseProvider):
    name = "openai"

    def __init__(self) -> None:
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY or "missing")
        self.model = settings.OPENAI_MODEL

    async def chat(self, system, user, json_mode, temperature, max_tokens):
        kwargs: dict[str, Any] = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        resp = await self.client.chat.completions.create(**kwargs)
        choice = resp.choices[0].message.content or ""
        usage = resp.usage
        return choice, self.model, usage.prompt_tokens if usage else 0, usage.completion_tokens if usage else 0


class _AnthropicProvider(_BaseProvider):
    name = "anthropic"

    def __init__(self) -> None:
        # Lazy import so Anthropic SDK isn't required when unused.
        try:
            import anthropic  # type: ignore

            self._client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY or "missing")
            self._anthropic_module = anthropic
        except ImportError:  # pragma: no cover
            self._client = None
            self._anthropic_module = None
        self.model = settings.ANTHROPIC_MODEL

    async def chat(self, system, user, json_mode, temperature, max_tokens):
        if self._client is None:
            raise RuntimeError("anthropic SDK not installed")
        prompt_user = user
        if json_mode:
            prompt_user += "\n\nRespond with a single valid JSON object. No prose, no markdown."
        msg = await self._client.messages.create(
            model=self.model,
            system=system,
            max_tokens=max_tokens,
            temperature=temperature,
            messages=[{"role": "user", "content": prompt_user}],
        )
        text = "".join(block.text for block in msg.content if getattr(block, "type", "") == "text")
        return (
            text,
            self.model,
            msg.usage.input_tokens if msg.usage else 0,
            msg.usage.output_tokens if msg.usage else 0,
        )


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------


class LLMRouter:
    """
    Routes calls across configured providers with fallback.

    Selection:
      1. AI_PROVIDER_PRIMARY (config) is tried first when available.
      2. AI_PROVIDER_FALLBACKS is a comma-separated list tried in order.
      3. Any provider missing its API key is skipped silently.

    Use `chat()` for arbitrary completions and `chat_json()` for structured output.
    """

    def __init__(self) -> None:
        self._providers: dict[str, _BaseProvider] = {}
        if settings.DEEPSEEK_API_KEY:
            self._providers["deepseek"] = _DeepSeekProvider()
        if settings.OPENAI_API_KEY:
            self._providers["openai"] = _OpenAIProvider()
        if settings.ANTHROPIC_API_KEY:
            try:
                self._providers["anthropic"] = _AnthropicProvider()
            except RuntimeError:
                logger.warning("Anthropic configured but SDK not installed")

    @property
    def available_providers(self) -> list[str]:
        return list(self._providers.keys())

    def _selection_order(self, override: Optional[str] = None) -> list[str]:
        if override and override in self._providers:
            chain = [override]
        else:
            chain = []
            primary = settings.AI_PROVIDER_PRIMARY.strip().lower()
            if primary in self._providers:
                chain.append(primary)
            for f in settings.AI_PROVIDER_FALLBACKS.split(","):
                f = f.strip().lower()
                if f and f in self._providers and f not in chain:
                    chain.append(f)
        # Append any remaining providers as last-resort fallback
        for name in self._providers.keys():
            if name not in chain:
                chain.append(name)
        return chain

    async def chat(
        self,
        system: str,
        user: str,
        *,
        json_mode: bool = False,
        temperature: float = 0.1,
        max_tokens: int = 2048,
        provider: Optional[str] = None,
        redact: Optional[bool] = None,
    ) -> LLMResult:
        if not self._providers:
            raise RuntimeError(
                "No LLM provider configured. Set ANTHROPIC_API_KEY, OPENAI_API_KEY or DEEPSEEK_API_KEY."
            )
        do_redact = settings.AI_PII_REDACTION if redact is None else redact
        if do_redact:
            system = redact_pii(system)
            user = redact_pii(user)

        chain = self._selection_order(provider)
        attempted: list[str] = []
        last_error: Optional[Exception] = None

        for name in chain:
            attempted.append(name)
            provider_impl = self._providers[name]
            t0 = time.time()
            try:
                content, model, tin, tout = await provider_impl.chat(
                    system=system,
                    user=user,
                    json_mode=json_mode,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                latency = int((time.time() - t0) * 1000)
                data: Optional[dict[str, Any]] = None
                if json_mode:
                    try:
                        data = json.loads(content)
                    except json.JSONDecodeError:
                        # Try to extract JSON from text
                        m = re.search(r"\{.*\}", content, re.DOTALL)
                        if m:
                            try:
                                data = json.loads(m.group(0))
                            except json.JSONDecodeError:
                                data = None
                return LLMResult(
                    content=content,
                    data=data,
                    provider=name,
                    model=model,
                    tokens_input=tin,
                    tokens_output=tout,
                    latency_ms=latency,
                    fallback_chain=attempted,
                )
            except Exception as exc:  # noqa: BLE001
                last_error = exc
                logger.warning("LLM provider %s failed: %s — trying next", name, exc)
                continue

        raise RuntimeError(
            f"All LLM providers failed. Attempted={attempted}. Last error: {last_error}"
        )

    async def chat_json(
        self, system: str, user: str, **kwargs: Any
    ) -> LLMResult:
        kwargs["json_mode"] = True
        return await self.chat(system, user, **kwargs)


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

_router: Optional[LLMRouter] = None


def get_router() -> LLMRouter:
    global _router
    if _router is None:
        _router = LLMRouter()
    return _router
