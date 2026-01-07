# Tracker Service LLD

## Responsibilities
- Ingest activity data and screenshots.
- Enforce policy and consent rules.
- Generate activity reports.

## Explicit non-responsibilities
- Desktop agent implementation.
- Ticket creation.

## Dependencies
- Postgres (tracker database)
- S3 (object storage)
- Kafka

## Component diagram (textual)
```
[API Routes] -> [Policy Engine] -> [Ingest Validator]
[Storage Handler] -> [S3]
[Reporting Engine] -> [Reports API]
[Outbox] -> [Event Publisher]
```
