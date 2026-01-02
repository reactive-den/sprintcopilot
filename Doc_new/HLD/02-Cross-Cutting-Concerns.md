# Cross-Cutting Concerns (HLD)

## Authentication and authorization (RBAC)
- Auth: OIDC with enterprise SSO support.
- Access tokens: JWT with tenant_id, user_id, roles, scopes, and expiry.
- Refresh tokens: stored server-side with rotation and revocation.
- Roles: Owner, Admin, Manager, Contributor, Contractor.
- Authorization: RBAC + resource ownership checks by tenant_id.

See `Doc_new/Shared/03-Auth-RBAC.md`.

## Tenant isolation strategy
- RLS enforced for every table with tenant_id.
- Tenant_id extracted from JWT and set in DB session via SET LOCAL.
- Sensitive artifacts encrypted with tenant-specific data keys.

## AI/LLM gateway
- Prompt registry with semantic versioning: clarifier.v3, hld.v2.
- Output schemas enforced by JSON Schema + runtime validation.
- Safety filters: PII detection, prompt injection detection, toxicity filter.
- Token accounting by tenant and user with quotas.
- Evals: offline regression suite per prompt version.

See `Doc_new/Shared/04-LLM-Gateway.md`.

## Eventing and async workflows
- Event envelope standard with schema_version and correlation_id.
- Outbox pattern for transactional event emission.
- At-least-once delivery; consumers must be idempotent.
- DLQ topics per event type after retries.

See `Doc_new/Shared/02-Event-Envelope.md` and `Doc_new/Shared/01-Idempotency-Outbox.md`.

## Observability
- Logs: structured JSON with tenant_id, request_id, trace_id.
- Metrics: p50/p95 latency, error rate, queue depth, LLM token usage.
- Tracing: OpenTelemetry with W3C context.
- Alerts: SLO burn-rate alerts per service.

See `Doc_new/Shared/05-Observability.md`.

## Security and compliance
- TLS 1.2+ everywhere; mTLS between services.
- Encryption at rest (KMS) for all sensitive data.
- Audit logs for admin actions and policy changes.
- Consent records immutable and versioned.

See `Doc_new/Shared/06-Security-Compliance.md`.

## Configuration and feature flags
- Central config service with tenant overrides.
- Feature flags for experimental pipelines and LLM models.
- Config changes audited and rollbackable.

See `Doc_new/Shared/07-Config-Feature-Flags.md`.
