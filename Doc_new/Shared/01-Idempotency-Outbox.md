# Idempotency and Outbox Tables

## Idempotency key table (Postgres)
```sql
CREATE TABLE idempotency_key (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  request_path TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_body JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idempotency_key_tenant_path_idx ON idempotency_key (tenant_id, request_path);
```

## Outbox table (Postgres)
```sql
CREATE TABLE outbox_event (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);
CREATE INDEX outbox_event_tenant_idx ON outbox_event (tenant_id, created_at);
```
