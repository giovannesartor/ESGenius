# AI Governance

ESG360 uses generative and predictive AI as a productivity layer on top of an explainable, deterministic core. This document describes our governance approach.

## Core principles

1. **Transparent by construction.** Every score we ship has an open formula and explainable inputs. AI is used for extraction, drafting and translation — not for opaque scoring.
2. **No vendor lock-in.** A provider router lets us swap or fall back across Anthropic, OpenAI and DeepSeek per request, per tenant, per jurisdiction.
3. **PII protection by default.** Personally identifiable information is regex-redacted before any prompt leaves our infrastructure.
4. **Auditability.** Every AI call is logged with model, provider, input/output hashes, latency and redaction status.
5. **Customer choice.** Customers can pin their preferred provider and data residency; Enterprise plans support BYO API keys.

## Architecture

The router lives at `backend/app/ai/llm_router.py`:

```
LLMRouter
  ├── _AnthropicProvider (claude-3-5-sonnet by default)
  ├── _OpenAIProvider    (gpt-4o-mini by default)
  └── _DeepSeekProvider  (deepseek-chat by default)
```

Configuration (env vars):

| Variable | Default | Purpose |
|----------|---------|---------|
| `AI_PROVIDER_PRIMARY` | `deepseek` | Preferred provider |
| `AI_PROVIDER_FALLBACKS` | `openai,anthropic` | Ordered fallback chain |
| `AI_DATA_RESIDENCY` | `global` | `eu`, `us`, `br`, or `global` |
| `AI_PII_REDACTION` | `True` | Enable PII redaction before send |
| `ANTHROPIC_API_KEY` | — | Anthropic API key |
| `OPENAI_API_KEY` | — | OpenAI API key |
| `DEEPSEEK_API_KEY` | — | DeepSeek API key |

## PII redaction

Before any prompt leaves our infrastructure, we strip:

- Email addresses
- Brazilian CPF (`xxx.xxx.xxx-xx`)
- Brazilian CNPJ (`xx.xxx.xxx/xxxx-xx`)
- US SSN (`xxx-xx-xxxx`)
- Phone numbers (international format)

Redaction is applied to both the user-facing input and any contextual data (extracted from documents) before it reaches the provider.

## Model cards

| Use case | Default model | Why |
|----------|---------------|-----|
| Document extraction | `gpt-4o-mini` | Fast, structured output, low cost |
| Disclosure drafting | `claude-3-5-sonnet-20241022` | Best long-form quality |
| Q&A assistant | Configurable per tenant | Cost vs quality trade-off |
| Materiality suggestions | `claude-3-5-sonnet-20241022` | Reasoning quality |

## Where AI is **not** used

- Composite **ESG Financial Score** — fully deterministic, open formula
- **Climate VaR** — closed-form NGFS/IEA scenario calculations
- **Funding readiness** — checklist-based with explicit weights
- **Credit PD/LGD adjustments** — closed-form transformation of basis points
- **Valuation** — two-stage DCF with explicit inputs
- **MACC** — sorted bars from explicit cost/abatement inputs

This is intentional: the audit-grade outputs that drive capital decisions must be defendable to a regulator without invoking probabilistic generation.

## EU AI Act self-assessment

| Article | Classification | Notes |
|---------|---------------|-------|
| Art. 6 (high risk) | Not high-risk | We do not perform creditworthiness scoring on natural persons; we score companies |
| Art. 50 (transparency) | Compliant | All AI outputs are clearly labeled as AI-generated |
| Art. 52 (general-purpose AI) | Provider responsibility | We use third-party GPAI under their terms |

## Audit log schema

Every AI call writes a row to `ai_logs`:

```
- id, company_id, user_id
- provider, model, action
- input_hash (sha256), output_hash (sha256)
- input_tokens, output_tokens, cost_usd
- pii_redacted (bool), latency_ms, status
- created_at
```

This log is append-only and queryable from the audit dashboard.

## Incident response

If we detect a model malfunction, hallucination causing material harm, or data leak via a provider, we:

1. Disable the affected provider via the router (within minutes)
2. Notify affected customers within 24h
3. Re-run affected outputs on a fallback provider
4. Publish a post-mortem within 7 days

## Roadmap

- Self-hosted open-weights model (Llama 3.1) for sensitive tenants
- Confidential computing for prompt processing
- Output watermarking for AI-generated disclosures
- Full EU AI Act conformity assessment by 2026
