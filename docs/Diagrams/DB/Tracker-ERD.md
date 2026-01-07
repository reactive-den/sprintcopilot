# Tracker Service ERD

Assumption: consent_record.policy_version corresponds to policy.version; the link is enforced at the application layer.
Assumption: consent_record.developer_id refers to developer_profile in the Estimator service (cross-service logical reference).

```mermaid
erDiagram
  tracker_session ||--o{ tracker_event : "session_id"
  tracker_session ||--o{ screenshot : "session_id"
  policy ||--o{ consent_record : "policy_version (logical)"

  tracker_session {
    uuid id PK
    uuid tenant_id
    uuid developer_id
    text device_id
    text consent_version
    timestamptz created_at
  }

  tracker_event {
    uuid id PK
    uuid session_id FK
    text event_type
    jsonb payload_json
    timestamptz timestamp
  }

  screenshot {
    uuid id PK
    uuid session_id FK
    text object_key
    timestamptz captured_at
    bool blurred
    text checksum
  }

  policy {
    uuid id PK
    uuid tenant_id
    text name
    jsonb rules_json
    text version
    timestamptz created_at
  }

  consent_record {
    uuid id PK
    uuid tenant_id
    uuid developer_id
    text policy_version
    timestamptz accepted_at
  }
```
