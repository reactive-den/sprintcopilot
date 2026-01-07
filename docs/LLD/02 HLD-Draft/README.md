# HLD Draft Service LLD

## Responsibilities
- Generate HLD/LLD, data flows, and NFRs from BDD.
- Store rendered architecture documents in object storage.

## Explicit non-responsibilities
- Ticket slicing or estimation.

## Dependencies
- Postgres (hld database)
- AI Gateway
- Kafka
- Redis
- S3 (object storage)

## Component diagram (textual)
```
[API Routes] -> [Job Manager] -> [Chunker] -> [LLM Client]
[Renderer] -> [Document Repo] -> [S3]
[Outbox] -> [Event Publisher]
```

## State machine
```
QUEUED -> DRAFTING -> COMPLETED
QUEUED -> FAILED
```

Assumption: HLD documents are stored in S3 and referenced by object_key.
