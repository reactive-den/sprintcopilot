# RepoIngestor Service LLD

## Responsibilities
- Manage GitHub App install flow and repo connections.
- Verify webhooks and normalize GitHub events.
- Emit canonical repo events for downstream analysis.

## Explicit non-responsibilities
- Ticket creation or sprint planning.
- Deep code analysis beyond metadata ingestion.

## Dependencies
- Postgres (repo_ingestor database)
- Kafka
- Secrets Manager / KMS
- GitHub APIs

## Component diagram (textual)
```
[Install Controller] -> [Token Vault]
[Webhook Receiver] -> [Signature Verifier] -> [Normalizer]
[Sync Worker] -> [GitHub Client] -> [Normalizer]
[Outbox] -> [Event Publisher]
```

## State machine
```
DISCONNECTED -> INSTALLING -> CONNECTED -> SYNCING -> CONNECTED
CONNECTED -> ERROR
```

Assumption: Webhook delivery is the primary trigger; periodic sync is a backstop.
