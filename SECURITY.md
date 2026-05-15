# Security Policy

ESG360 is built for institutional finance: banks, asset managers, listed companies and regulators. Security and trust are non-negotiable. This document summarizes our current posture and the reporting process for vulnerabilities.

## Reporting a vulnerability

- Email: **security@esg360.digital**
- PGP key: available on request
- We acknowledge within **72 hours** and provide a remediation plan within **10 business days**.
- We follow a **coordinated disclosure** model — please give us reasonable time to fix before public disclosure.
- Researchers acting in good faith are protected and credited (with consent).

## Supported versions

We patch the latest minor version of the platform (`main`). Self-hosted deployments are encouraged to track the same.

## Compliance roadmap

| Standard | Status | Notes |
|---------|--------|-------|
| SOC 2 Type II | In progress (target: 2025) | Trust services criteria: security, availability, confidentiality |
| ISO/IEC 27001:2022 | Roadmap | ISMS scope: SaaS platform + supporting infrastructure |
| GDPR | Implemented | Data subject rights, processor agreements, EU residency option |
| LGPD (Brazil) | Implemented | Data subject rights, BR residency option |
| EU AI Act | Tracking | High-risk classification self-assessment ongoing |
| CSRD / ESRS auditability | Implemented | Audit trail per data point + framework mapping |
| CVM Resolution 193 (BR) | Implemented | Native support for IFRS S1/S2 disclosures |

## Security controls

### Authentication

- Email + password with **Argon2id** hashing
- Optional Google SSO (OAuth 2.0)
- Optional SAML 2.0 / OIDC SSO on Enterprise plan
- Per-user password policy (length, breach detection planned)
- Email verification flow with signed tokens

### Authorization

- Per-company role model: `owner`, `admin`, `member`, `viewer`
- Platform-wide superadmin role (audited separately)
- Public API: scoped Bearer tokens hashed at rest (SHA-256)
- All authorization checks centralized in service layer

### Cryptography

- TLS 1.3 in transit (HTTP Strict Transport Security)
- AES-256 at rest (managed by cloud provider)
- Customer-managed keys (CMK) on Enterprise plan
- Secrets stored in managed secret store; never in code or env dumps

### Audit & monitoring

- Immutable audit log for every action (signed, timestamped, queryable)
- AI call log with provider, model, input/output hashes, PII redaction status
- Structured application logs with request IDs
- Error tracking + uptime monitoring + on-call rotation

### Data protection

- Daily encrypted PostgreSQL snapshots, 30-day retention
- Cross-region replication on Enterprise plan
- Documented data retention & deletion policies
- Data subject rights handled at `/dashboard/privacy`

### Network & infrastructure

- Multi-region deployment (EU, US, BR available)
- Pinned data residency by contract on Enterprise plan
- Private networking between services
- Web Application Firewall + DDoS protection

### AI providers

- **Multi-provider router** (Anthropic, OpenAI, DeepSeek) — no vendor lock-in
- **PII redaction** on by default (regex for email, CPF, CNPJ, phone, SSN before send)
- Per-tenant provider preference and data residency configuration
- Full prompt + response logging with retention policies

## Subprocessor list

Available at https://esg360.digital/trust with version-controlled changelog.

## OWASP Top 10 posture

| Risk | Mitigation |
|------|------------|
| A01 Broken Access Control | Centralized service-layer checks, role-based per company, superadmin separated |
| A02 Cryptographic Failures | TLS 1.3, AES-256, Argon2id, hashed API keys |
| A03 Injection | SQLAlchemy ORM with bound parameters; pydantic input validation |
| A04 Insecure Design | Threat modeling per feature; security requirements in PR template |
| A05 Security Misconfiguration | Hardened Docker images, locked-down CORS, CSP planned |
| A06 Vulnerable Components | Renovate/dependabot; SCA in CI |
| A07 Auth Failures | Argon2id, account lockout, email verification, SSO |
| A08 Software/Data Integrity | Signed audit log, container image signing planned |
| A09 Logging Failures | Structured logs, no secrets, central observability |
| A10 SSRF | Outbound URL allowlists for AI providers; no user-controlled fetches |

## Responsible AI

See [`AI-GOVERNANCE.md`](./AI-GOVERNANCE.md) for our model card, governance approach and EU AI Act self-assessment.
