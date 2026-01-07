# HLD Draft Service APIs

Base path: `/v1/hld`

## POST /jobs
- Idempotency: required
- Request JSON Schema:
```json
{
  "type": "object",
  "required": ["bdd_id"],
  "properties": {
    "bdd_id": {"type": "string", "format": "uuid"},
    "output_format": {"type": "string", "enum": ["markdown", "json"]}
  }
}
```
- Response JSON Schema:
```json
{
  "type": "object",
  "required": ["job_id", "status"],
  "properties": {
    "job_id": {"type": "string", "format": "uuid"},
    "status": {"type": "string", "enum": ["DRAFTING"]}
  }
}
```

## GET /jobs/{job_id}
- Response includes status and document_id.

## GET /documents/{document_id}
- Response includes object_key (S3), hash, and optional inline content.
