# Clarifier Sequence Diagrams

## Start session
```
Client -> API -> Idempotency -> SessionRepo -> LLMClient -> AI Gateway -> LLM
LLM -> AI Gateway -> LLMClient -> SessionRepo -> Outbox -> Publisher -> Kafka
API -> Client (next_questions)
```
