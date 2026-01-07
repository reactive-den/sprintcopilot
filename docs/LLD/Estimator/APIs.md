# Estimator APIs

Base path: `/v1/estimator`

## POST /jobs
- Idempotency: required
- Request:
```json
{
  "ticket_set_id": "string"
}
```

## GET /jobs/{job_id}
- Response:
```json
{
  "job_id": "string",
  "status": "COMPLETED",
  "estimate_set_id": "string"
}
```

## POST /assignments
- Idempotency: required
- Request:
```json
{
  "estimate_set_id": "string",
  "strategy": "SKILL_AND_CAPACITY"
}
```
