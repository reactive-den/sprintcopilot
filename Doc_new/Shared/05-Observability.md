# Observability

## Logs
- Structured JSON logs with tenant_id, request_id, trace_id.
- Redaction of secrets and PII.

## Metrics
- p50/p95 latency, error rate, queue depth.
- LLM token usage and cost per tenant.
- Owner Bot query latency and redaction rate.
- Repo ingestion lag and analysis workflow duration.

## Tracing
- OpenTelemetry with W3C trace context.
- End-to-end tracing across services.

## Alerts
- SLO burn-rate alerts per service.
- Budgeted error alerts per tenant tier.
