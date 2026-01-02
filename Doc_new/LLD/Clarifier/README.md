# Clarifier Service LLD

## Responsibilities
- Own conversational state and BDD generation.
- Validate and store clarifier sessions and messages.

## Explicit non-responsibilities
- Ticket creation.
- Architecture generation.

## Dependencies
- Postgres (clarifier database)
- AI Gateway
- Kafka
- Redis

## Component diagram (textual)
```
[API Routes] -> [Session Manager] -> [Question Engine] -> [LLM Client]
[Session Manager] -> [Session Repo, Message Repo]
[BDD Composer] -> [BDD Repo]
[Outbox] -> [Event Publisher]
```

## State machine
```
CREATED -> QUESTIONING -> AWAITING_USER -> QUESTIONING -> COMPLETED
CREATED -> FAILED
QUESTIONING -> FAILED
```

Assumption: Each session expires after 7 days of inactivity.
