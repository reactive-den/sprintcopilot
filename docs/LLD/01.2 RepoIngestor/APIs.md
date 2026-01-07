# RepoIngestor APIs

## POST /github/connect
- Initiates GitHub App install flow for a tenant.

## POST /github/webhook
- Receives GitHub webhook events.
- Requires signature verification.

## POST /github/sync
- Triggers on-demand sync for a repo.

## GET /github/connections
- Lists connected repos for a tenant.
