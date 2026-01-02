# Event Envelope and Delivery

## Standard event envelope
```json
{
  "event_id": "evt_123",
  "event_type": "BDDReady",
  "schema_version": "1.0",
  "tenant_id": "ten_001",
  "correlation_id": "corr_123",
  "produced_at": "2025-10-16T12:00:00Z",
  "payload": {}
}
```

## Delivery semantics
- At-least-once delivery.
- Consumers must be idempotent.
- Events emitted via outbox pattern.

## Retry and DLQ strategy
- 5 retries with exponential backoff and jitter.
- DLQ topic per event type after retry exhaustion.
- Manual replay tooling for DLQ events.
