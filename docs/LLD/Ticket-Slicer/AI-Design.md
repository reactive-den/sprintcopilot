# Ticket Slicer AI Design

## Prompt template
```
SYSTEM: You are a senior engineering manager.
USER: Given the HLD/LLD, produce epics, stories, tasks with acceptance criteria.
Constraints:
- Max tickets: {max_tickets}
- Return JSON with fields: epics[], stories[], tasks[]
```

## Few-shot strategy
- 3 examples across SaaS and internal tooling.

## Validation
- Enforce max_tickets.
- De-duplicate titles.
- Reject tickets without acceptance criteria.
