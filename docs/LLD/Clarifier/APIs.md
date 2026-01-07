# Clarifier Service APIs

Base path: `/v1/clarifier`

## POST /sessions
- Idempotency: required
- Request JSON Schema:
```json
{
  "type": "object",
  "required": ["idea"],
  "properties": {
    "idea": {"type": "string", "minLength": 5, "maxLength": 2000},
    "context": {"type": "string", "maxLength": 2000},
    "constraints": {"type": "string", "maxLength": 1000}
  },
  "additionalProperties": false
}
```
- Response JSON Schema:
```json
{
  "type": "object",
  "required": ["session_id", "status", "next_questions"],
  "properties": {
    "session_id": {"type": "string", "format": "uuid"},
    "status": {"type": "string", "enum": ["QUESTIONING"]},
    "next_questions": {"type": "array", "items": {"type": "string"}}
  }
}
```

## POST /sessions/{session_id}/messages
- Idempotency: required
- Request JSON Schema:
```json
{
  "type": "object",
  "required": ["message"],
  "properties": {
    "message": {"type": "string", "minLength": 1, "maxLength": 2000}
  }
}
```
- Response JSON Schema:
```json
{
  "type": "object",
  "required": ["status", "next_questions"],
  "properties": {
    "status": {"type": "string", "enum": ["QUESTIONING"]},
    "next_questions": {"type": "array", "items": {"type": "string"}}
  }
}
```

## POST /sessions/{session_id}/finalize
- Idempotency: required
- Response JSON Schema:
```json
{
  "type": "object",
  "required": ["bdd_id", "status"],
  "properties": {
    "bdd_id": {"type": "string", "format": "uuid"},
    "status": {"type": "string", "enum": ["COMPLETED"]}
  }
}
```

## GET /sessions/{session_id}
- Response JSON Schema:
```json
{
  "type": "object",
  "required": ["session_id", "status", "messages"],
  "properties": {
    "session_id": {"type": "string", "format": "uuid"},
    "status": {"type": "string"},
    "messages": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "role": {"type": "string", "enum": ["USER", "ASSISTANT"]},
          "content": {"type": "string"},
          "created_at": {"type": "string", "format": "date-time"}
        }
      }
    }
  }
}
```

## GET /sessions
- Pagination: cursor-based. See `Doc_new/Shared/00-API-Standards.md`.
