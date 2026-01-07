# Ticket Slicer APIs

Base path: `/v1/tickets`

## POST /jobs
- Idempotency: required
- Request:
```json
{
  "hld_document_id": "string (uuid)",
  "max_tickets": 40
}
```

## GET /jobs/{job_id}
- Response:
```json
{
  "job_id": "string",
  "status": "READY",
  "ticket_set_id": "string"
}
```

## GET /sets/{set_id}
- Response:
```json
{
  "set_id": "string",
  "tickets": [
    {
      "title": "Auth: email OTP",
      "type": "STORY",
      "acceptance_criteria": ["User receives OTP", "OTP expires after 10 min"]
    }
  ]
}
```

## POST /sets/{set_id}/publish
- Idempotency: required
- Request:
```json
{
  "integration_id": "string",
  "project_key": "string"
}
```

## Error codes
- VALIDATION_ERROR, NOT_FOUND, DEPENDENCY_ERROR, RATE_LIMITED
