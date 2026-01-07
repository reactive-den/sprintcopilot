# HLD Draft Sequence Diagrams

## Draft job flow
```
Client -> API -> JobManager -> LLMClient -> AI Gateway -> LLM
LLM -> Renderer -> S3 -> DocumentRepo -> Outbox -> Kafka
API -> Client (job_id)
```
