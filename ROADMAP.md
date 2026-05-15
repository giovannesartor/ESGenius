# Roadmap

This document tracks the strategic milestones for ESG360 as we evolve from a multi-framework ESG platform into the **ESG Financial Intelligence Infrastructure** for sustainability.

> Direction is firm. Dates are indicative and may shift based on customer feedback and regulatory cycles.

## Now (shipped)

- ✅ Multi-tenant SaaS, RBAC, SSO (Google), audit log
- ✅ CSRD/ESRS, IFRS S1/S2, TCFD, CVM 193 framework support
- ✅ Document upload + AI extraction
- ✅ Carbon emissions calculator (Scope 1/2/3)
- ✅ ESG composite score
- ✅ Reports + chat assistant + simulator + materiality
- ✅ **Financial Intelligence layer** (this release):
  - ESG Financial Score (0-100, bps, WACC, rating band, percentile)
  - Climate Risk Engine (NGFS + IEA scenarios)
  - Funding Readiness Cockpit (SLL, green bond, IPO, M&A, PE)
  - Credit Intelligence (PD/LGD adjustments, book impact)
  - Valuation Impact (two-stage DCF)
  - Marginal Abatement Cost Curve
  - Portfolio Intelligence (buy-side aggregates)
  - Framework Knowledge Graph
  - Public API v1 + embeddable score widget
  - Multi-provider AI router (Anthropic / OpenAI / DeepSeek) + PII redaction

## Next (Q1)

- Self-serve onboarding for buy-side (asset managers, banks)
- Bloomberg ticker → company resolver for portfolio holdings
- Deeper sector calibrations for the Financial Score (oil & gas, banks, real estate)
- SBTi target validation tooling
- Webhook system for score changes & material events
- SOC 2 Type I attestation
- Portuguese & Spanish UI parity for new financial intelligence pages

## Q2

- Sentiment & controversy ingestion (news + regulatory enforcement feeds)
- Real-time refresh of public-company scores
- Regulator data export packs (CVM, EFRAG, ISSB-ready zips)
- SAML/OIDC SSO for Enterprise
- Customer-managed encryption keys (CMK)
- Marketplace for pre-built portfolios & sector benchmarks

## Q3

- Predictive component of Financial Score (ML overlay on top of deterministic base)
- Scenario Studio: custom carbon price paths and physical climate hazards
- Counterparty graph view (supply chain ESG cascades)
- Audit-firm collaboration mode (read-only assurance views)
- SOC 2 Type II audit
- ISO 27001 certification kickoff

## Q4

- Disclosure auto-drafting bots with citation back to source documents
- TNFD (nature) module
- Brazilian Pix-style instant ESG attestations for SLL coupon resets
- Banking core integrations (PD/LGD push to Murex, Calypso, etc.)
- BYO LLM (self-hosted Llama 3.1 / Mistral for sensitive tenants)
- ISO 27001 certification target

## Beyond (2026+)

- Sustainability-linked **derivatives** pricing module
- Insurance underwriting overlay (climate + nature physical risk)
- Regulator-grade attestation network (signed score lineage between counterparties)
- EU AI Act full conformity assessment
- Public companies disclosure marketplace (subscribed by buy-side at scale)

## How to influence this roadmap

- Customer council: monthly call with design partners
- Open issues on GitHub (anonymized requests welcome)
- Email **product@esg360.digital** for any strategic input

We will not promise dates we cannot defend in front of an audit committee. We will ship what makes sustainability **the financial language of the next decade**.
