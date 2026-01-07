# Estimator and Assigner Service LLD

## Responsibilities
- Estimate ticket sizes and hours.
- Assign tickets to developers based on skills and capacity.

## Explicit non-responsibilities
- Ticket creation.
- Activity tracking.

## Dependencies
- Postgres (estimator database)
- Kafka
- Redis

## Component diagram (textual)
```
[API Routes] -> [Estimation Engine] -> [Assignment Engine]
[Capacity Planner] -> [Developer Repo]
[Outbox] -> [Event Publisher]
```
