# HLD Draft Data Model

## Tables
- hld_job
- hld_document

## SQL DDL
```sql
CREATE TABLE hld_job (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  bdd_id UUID NOT NULL,
  status VARCHAR(24) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hld_document (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  object_key TEXT NOT NULL,
  format VARCHAR(10) NOT NULL,
  content_hash TEXT NOT NULL,
  size_bytes INT NOT NULL,
  metadata_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Example row
```json
{
  "id": "doc_001",
  "tenant_id": "ten_001",
  "object_key": "tenant/ten_001/hld/doc_001.md",
  "format": "markdown",
  "content_hash": "sha256:...",
  "size_bytes": 104857,
  "metadata_json": {"sections": 12}
}
```
