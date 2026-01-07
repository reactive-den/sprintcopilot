# Ticket Slicer Service LLD

## Responsibilities
- Convert HLD/LLD docs into epics, stories, tasks, and acceptance criteria.
- Publish tickets to Jira/ClickUp.

## Explicit non-responsibilities
- Estimation and assignment.

## Dependencies
- Postgres (tickets database)
- AI Gateway
- Kafka
- Jira/ClickUp APIs

## Component diagram (textual)
```
[API Routes] -> [Slicer Engine] -> [AC Generator] -> [Ticket Repo]
[Integration Adapter] -> [Jira/ClickUp APIs]
[Outbox] -> [Event Publisher]
```

## State machine
```
QUEUED -> SLICING -> READY -> PUBLISHED
QUEUED -> FAILED
```
