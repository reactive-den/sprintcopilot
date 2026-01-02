# Non-Functional Requirements (HLD)

## Performance SLAs
- API Gateway p95 latency < 300ms for non-LLM endpoints.
- LLM pipeline end-to-end < 90 seconds for standard ideas.
- Tracker screenshot upload p95 < 5 seconds.

## Scalability assumptions
- Assumption: 500 tenants, 50,000 monthly active users.
- Assumption: 5,000 concurrent tracker sessions.

## Availability targets
- 99.9% for core APIs.
- 99.5% for LLM-dependent workflows.

## Cost considerations
- Token usage capped per tenant with quotas.
- Screenshot storage tiered by plan.

## Data retention
- Assumption: screenshots retained for 90 days by default.
- Assumption: docs retained for 2 years.
