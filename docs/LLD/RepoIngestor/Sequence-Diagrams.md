# RepoIngestor Sequence Diagrams

## GitHub install flow
```
Owner -> API Gateway: POST /github/connect
API Gateway -> RepoIngestor: request install
RepoIngestor -> GitHub: initiate install
Owner -> GitHub: approve installation
GitHub -> RepoIngestor: installation webhook
RepoIngestor -> Kafka: RepoConnected
```

## Webhook ingestion
```
GitHub -> RepoIngestor: webhook event
RepoIngestor -> Signature Verifier: validate
RepoIngestor -> Normalizer: map to canonical event
RepoIngestor -> Kafka: RepoEventReceived
```
