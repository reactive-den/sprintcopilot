# Clarifier Data Model

## Tables
- clarifier_session
- clarifier_message
- bdd_document

## SQL DDL
```sql
CREATE TABLE clarifier_session (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  status VARCHAR(24) NOT NULL,
  idea TEXT NOT NULL,
  context TEXT,
  constraints TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE clarifier_message (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES clarifier_session(id),
  role VARCHAR(10) NOT NULL CHECK (role IN ('USER','ASSISTANT')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE bdd_document (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES clarifier_session(id),
  tenant_id UUID NOT NULL,
  content_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX clarifier_session_tenant_idx ON clarifier_session (tenant_id, created_at);
CREATE INDEX clarifier_message_session_idx ON clarifier_message (session_id, created_at);
```

## Constraints and indexes
- tenant_id is required on all tables.
- session_id enforces referential integrity.
- Indexes optimize tenant and session queries.

## Example row
```json
{
  "id": "bdd_456",
  "session_id": "sess_123",
  "tenant_id": "ten_001",
  "content_json": {"problem": "...", "scope": "..."}
}
```
