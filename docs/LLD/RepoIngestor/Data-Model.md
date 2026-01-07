# RepoIngestor Data Model

## repo_connection
- id (pk)
- tenant_id
- installation_id
- repo_id
- repo_full_name
- permissions_jsonb
- connected_at

## repo_webhook_event
- id (pk)
- tenant_id
- repo_id
- event_type
- delivery_id
- payload_jsonb
- received_at

## repo_sync_checkpoint
- id (pk)
- tenant_id
- repo_id
- last_synced_at
- etag
- status
