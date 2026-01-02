# Tracker APIs

Base path: `/v1/tracker`

## POST /sessions
- Idempotency: required
- Request:
```json
{
  "developer_id": "string",
  "device_id": "string",
  "consent_version": "string"
}
```

## POST /events
- Idempotency: required
- Request:
```json
{
  "session_id": "string",
  "event_type": "APP_FOCUS",
  "payload": {"app": "VSCode"},
  "timestamp": "2025-10-16T12:20:00Z"
}
```

## POST /screenshots
- Idempotency: required
- Request: multipart (binary + metadata)

## GET /reports/activity
- Query: developer_id, from, to
- Pagination: cursor-based
