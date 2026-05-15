# Architecture

ESG360 is the **ESG Financial Intelligence Infrastructure** for sustainability — a multi-tenant SaaS that translates ESG data into capital-market primitives (basis points, WACC, PD/LGD, enterprise value).

## Bird's-eye view

```
                  ┌────────────────────────────────────────────┐
                  │         Frontend (Next.js 16)              │
                  │  marketing · dashboard · embed widgets     │
                  └──────────────────┬─────────────────────────┘
                                     │ HTTPS (REST + JSON)
                  ┌──────────────────▼─────────────────────────┐
                  │       FastAPI backend (Python 3.12)        │
                  │ ┌────────────────────────────────────────┐ │
                  │ │ /api/v1/*   — authenticated app API    │ │
                  │ │ /public/v1/* — Bearer-key public API   │ │
                  │ │ /embed/*    — public widget endpoints  │ │
                  │ └────────────────────────────────────────┘ │
                  │       Services · Repositories · ORM        │
                  └─────┬──────────────┬───────────────┬───────┘
                        │              │               │
              ┌─────────▼───┐  ┌───────▼────┐  ┌──────▼────────┐
              │ PostgreSQL  │  │   Redis    │  │  AI Router    │
              │ (asyncpg)   │  │ cache+queue│  │ Anthropic /   │
              │             │  │            │  │ OpenAI /      │
              │             │  │            │  │ DeepSeek      │
              └─────────────┘  └────────────┘  └───────────────┘
                                     │
                              ┌──────▼─────┐
                              │  Celery    │
                              │  workers   │
                              │ (docs, AI) │
                              └────────────┘
```

## Layered design

### 1. Domain layer (`backend/app/domain/`)

- **Models** (SQLAlchemy 2.0 with `Mapped[]`): User, Company, Document, DataPoint, Framework, Report, AILog, Subscription, plus the new financial intelligence models (ESGFinancialScore, ClimateScenarioResult, FundingReadinessAssessment, CreditIntelligenceAssessment, ValuationImpact, AbatementOption, Portfolio, PortfolioHolding, FrameworkMapping)
- **Schemas** (Pydantic v2): typed DTOs at the API boundary

### 2. Repository layer (`backend/app/repositories/`)

Async data access. One repo per aggregate root.

### 3. Service layer (`backend/app/services/`)

Business logic. Imports repositories. Each financial intelligence pillar is a dedicated service:

| Service | Responsibility |
|---------|----------------|
| `financial_score_service.py` | 0-100 composite score, bps spread, WACC adj, rating band, percentile |
| `climate_risk_service.py` | NGFS/IEA scenario VaR (physical + transition + total) |
| `funding_readiness_service.py` | Per-instrument checklist, gap analysis, remediation |
| `credit_intelligence_service.py` | ESG-adjusted PD/LGD per counterparty + book impact |
| `valuation_impact_service.py` | Two-stage DCF with ESG-adjusted WACC/beta/growth |
| `macc_service.py` | Marginal abatement cost curve (CRUD + sorting) |
| `portfolio_service.py` | Buy-side aggregation + holding refresh |
| `knowledge_graph_service.py` | Framework mapping graph (CSRD↔IFRS↔CVM 193…) |

### 4. API layer (`backend/app/api/v1/endpoints/`)

Thin routers per resource. Authentication via `Depends(get_current_user)`. Public API is separate (`public_api.py`) with scoped Bearer keys.

### 5. AI layer (`backend/app/ai/`)

`llm_router.py` — multi-provider router with PII redaction. See [`AI-GOVERNANCE.md`](./AI-GOVERNANCE.md).

### 6. Workers (`backend/app/workers/`)

Celery tasks for document processing and report generation.

## Data model — financial intelligence

```
companies (existing)
  ├── esg_financial_scores            (1:N, unique by company+year+methodology)
  ├── climate_scenario_results        (1:N)
  ├── funding_readiness_assessments   (1:N, per instrument)
  ├── credit_intelligence_assessments (1:N, owner_company assesses counterparties)
  ├── valuation_impacts               (1:N)
  ├── abatement_options               (1:N — MACC inputs)
  └── portfolios                      (1:N)
        └── portfolio_holdings        (1:N)

framework_mappings (graph: source_framework+code → target_framework+code, unique edge)
api_keys (existing — extended scopes for /public/v1)
ai_logs  (existing — extended fields for provider router)
```

## Frontend

Next.js 16 App Router with i18n (en/es/pt). Locale prefix at `/[locale]/`.

```
src/app/[locale]/
  page.tsx                    — landing
  manifesto/page.tsx          — brand manifesto
  trust/page.tsx              — security & compliance
  developers/page.tsx         — public API docs
  solutions/companies/page.tsx
  solutions/finance/page.tsx
  dashboard/
    financial-score/          — composite score + spread + drivers
    climate-risk/             — NGFS/IEA scenarios
    funding-readiness/        — per-instrument cockpit
    portfolio/                — buy-side aggregates
    credit-intelligence/      — counterparty PD/LGD
    valuation/                — DCF impact
    macc/                     — abatement curve
    (existing pages: reports, upload, esg-score, …)
```

API client: `src/services/api.ts` — typed fetch wrapper, one module per resource.

## Deployment topology

- **Frontend** → Railway / Vercel / static host (Next.js standalone)
- **Backend** → Railway (Docker image from `backend/Dockerfile`)
- **DB** → Railway PostgreSQL or external managed Postgres
- **Redis** → Railway Redis
- **Workers** → Railway worker service (Celery)
- **CI/CD** → GitHub Actions

Environment variables: see `backend/app/core/config.py`.

## Public surface

| Path | Auth | Purpose |
|------|------|---------|
| `/api/v1/*` | Session/JWT | Authenticated app API |
| `/api/v1/public/v1/*` | Bearer (API key) | Programmatic read-only access |
| `/api/v1/embed/score/{id}.html` | None | Embeddable widget |
| `/api/v1/embed/score/{id}.json` | None | JSON badge |

## Migrations

Alembic. Latest revision: `002_add_financial_intelligence`. Run with:

```bash
cd backend && alembic upgrade head
```

## Observability roadmap

- OpenTelemetry traces (planned)
- Prometheus metrics (planned)
- Structured logs already in place (JSON via stdlib logging)
