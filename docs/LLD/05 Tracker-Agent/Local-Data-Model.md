# Tracker Agent Local Data Model

## SQLite schema
```sql
CREATE TABLE local_event (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  uploaded INTEGER DEFAULT 0
);
```
