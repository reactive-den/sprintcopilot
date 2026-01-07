# OwnerBot Failure Modes

## Missing consent
- Behavior: return redacted response with explanation.
- Mitigation: surface consent scope gaps in response.

## Stale read model
- Behavior: warn and include read model lag.
- Mitigation: background catch-up job and lag alerting.

## Downstream service timeout
- Behavior: partial response with explicit gaps.
- Mitigation: circuit breaker and cached summaries.
