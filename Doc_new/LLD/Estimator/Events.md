# Estimator Events

## Produced
- EstimatesReady (topic: estimator.estimates-ready.v1)
- AssignmentsReady (topic: estimator.assignments-ready.v1)

## Consumed
- TicketPlanReady (topic: tickets.plan-ready.v1)

## Payload schema (AssignmentsReady)
```json
{
  "event_id": "evt_400",
  "event_type": "AssignmentsReady",
  "schema_version": "1.0",
  "tenant_id": "ten_001",
  "correlation_id": "corr_001",
  "produced_at": "2025-10-16T12:15:00Z",
  "payload": {
    "assignment_set_id": "as_001",
    "count": 24
  }
}
```
