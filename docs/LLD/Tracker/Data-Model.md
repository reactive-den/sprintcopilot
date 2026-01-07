# Tracker Data Model

## Tables
- tracker_session
- tracker_event
- screenshot
- policy
- consent_record

## SQL DDL
```sql
CREATE TABLE tracker_session (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  developer_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tracker_event (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES tracker_session(id),
  event_type TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL
);
```
