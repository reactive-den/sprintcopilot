# OwnerBot Service LLD

## Responsibilities
- Answer owner/manager progress questions with evidence and redactions.
- Enforce RBAC and consent scopes on tracking data.
- Emit auditable query and response events.

## Explicit non-responsibilities
- Tracking data collection.
- Ticket creation or estimation.

## Dependencies
- Postgres (ownerbot database)
- Kafka
- AI Gateway
- Tracker Service (consent and activity)
- Ticket Slicer Service (ticket metadata)
- Estimator Service (estimates/assignments)

## Component diagram (textual)
```
[API Routes] -> [AuthZ + Consent Guard] -> [Query Orchestrator]
[Query Orchestrator] -> [Read Model Repo]
[Query Orchestrator] -> [LLM Client]
[Query Orchestrator] -> [Audit Logger]
[Outbox] -> [Event Publisher]
```

## State machine
```
RECEIVED -> VALIDATING -> FETCHING_DATA -> GENERATING_ANSWER -> COMPLETED
RECEIVED -> REJECTED
FETCHING_DATA -> FAILED
GENERATING_ANSWER -> FAILED
```

Assumption: Read model lag is acceptable up to 5 minutes for owner queries.
