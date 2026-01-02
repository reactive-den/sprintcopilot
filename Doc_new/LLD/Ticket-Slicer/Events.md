# Ticket Slicer Events

## Produced
- TicketPlanReady (topic: tickets.plan-ready.v1)
- TicketsPublished (topic: tickets.published.v1)

## Consumed
- HLDDraftReady (topic: hld.draft-ready.v1)

## Payloads
TicketPlanReady:
```json
{
  "event_id": "evt_300",
  "event_type": "TicketPlanReady",
  "schema_version": "1.0",
  "tenant_id": "ten_001",
  "correlation_id": "corr_001",
  "produced_at": "2025-10-16T12:10:00Z",
  "payload": {
    "ticket_set_id": "set_001",
    "count": 24
  }
}
```

TicketsPublished:
```json
{
  "event_id": "evt_301",
  "event_type": "TicketsPublished",
  "schema_version": "1.0",
  "tenant_id": "ten_001",
  "correlation_id": "corr_001",
  "produced_at": "2025-10-16T12:12:00Z",
  "payload": {
    "ticket_set_id": "set_001",
    "provider": "jira",
    "external_ids": ["ENG-101", "ENG-102"]
  }
}
```
