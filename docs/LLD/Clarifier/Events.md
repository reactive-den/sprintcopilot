# Clarifier Events

## Produced
- BDDReady (topic: clarifier.bdd-ready.v1)

## Consumed
- ClarifierRequested (topic: orchestrator.clarifier-requested.v1)

## Payload schema (BDDReady)
```json
{
  "event_id": "evt_123",
  "event_type": "BDDReady",
  "schema_version": "1.0",
  "tenant_id": "ten_001",
  "correlation_id": "corr_001",
  "produced_at": "2025-10-16T12:00:00Z",
  "payload": {
    "bdd_id": "bdd_456",
    "session_id": "sess_123",
    "summary": "Short summary of business idea"
  }
}
```

## Retry and DLQ
- 5 retries with exponential backoff.
- DLQ after retry exhaustion.
