# Ticket Slicer Data Model

## Tables
- ticket_job
- ticket_set
- ticket_item
- integration_account
- integration_link

## SQL DDL
```sql
CREATE TABLE ticket_job (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  hld_document_id UUID NOT NULL,
  status VARCHAR(24) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ticket_set (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  job_id UUID NOT NULL REFERENCES ticket_job(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ticket_item (
  id UUID PRIMARY KEY,
  set_id UUID NOT NULL REFERENCES ticket_set(id),
  type VARCHAR(10) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  acceptance_criteria_json JSONB NOT NULL
);
```

## Indexes
- ticket_job (tenant_id, created_at)
- ticket_item (set_id)
- integration_account (tenant_id, provider)
