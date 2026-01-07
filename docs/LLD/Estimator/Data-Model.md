# Estimator Data Model

## Tables
- estimate_job
- estimate_item
- developer_profile
- availability_window
- assignment_item

## SQL DDL
```sql
CREATE TABLE estimate_job (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  ticket_set_id UUID NOT NULL,
  status VARCHAR(24) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE estimate_item (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES estimate_job(id),
  ticket_id UUID NOT NULL,
  tshirt_size VARCHAR(5) NOT NULL,
  hours INT NOT NULL
);
```
