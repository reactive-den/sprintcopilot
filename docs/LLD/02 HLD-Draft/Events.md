# HLD Draft Events

## Produced
- HLDDraftReady (topic: hld.draft-ready.v1)

## Consumed
- BDDReady (topic: clarifier.bdd-ready.v1)

## Payload schema (HLDDraftReady)
```json
{
  "event_id": "evt_200",
  "event_type": "HLDDraftReady",
  "schema_version": "1.0",
  "tenant_id": "ten_001",
  "correlation_id": "corr_001",
  "produced_at": "2025-10-16T12:05:00Z",
  "payload": {
    "hld_document_id": "doc_001",
    "bdd_id": "bdd_456",
    "object_key": "tenant/ten_001/hld/doc_001.md"
  }
}
```
