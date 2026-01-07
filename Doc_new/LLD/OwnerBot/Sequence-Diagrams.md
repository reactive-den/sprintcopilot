# OwnerBot Sequence Diagrams

## Owner progress query
```
Owner -> API Gateway: POST /owner-bot/query
API Gateway -> OwnerBot: query
OwnerBot -> AuthZ: validate roles + tenant
OwnerBot -> Consent Guard: resolve scopes
OwnerBot -> Read Model: fetch aggregates
OwnerBot -> LLM Client: generate answer
OwnerBot -> Kafka: OwnerQueryExecuted, OwnerQueryResponseGenerated
OwnerBot -> Owner: response + evidence
```
