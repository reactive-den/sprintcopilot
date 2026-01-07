# API Standards

## Versioning
- All public APIs use path versioning: `/v1`.

## Required headers
- Authorization: `Bearer <token>`
- Idempotency-Key: `<uuid>` for POST/PUT/PATCH that mutate state.
- X-Request-Id: `<uuid>` propagated end-to-end.

## Idempotency behavior
- Idempotency keys stored with request hash and response payload for 24h.
- Duplicate key returns original response.
- Same key with different payload returns 409 CONFLICT.

## Pagination
- Cursor-based pagination: `?cursor=<base64>&limit=50`.
- Responses include `next_cursor` and `has_more`.

## Standard error format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "field is required",
    "details": {"field": "idea"}
  },
  "request_id": "req_123"
}
```

## Error codes
- 400 VALIDATION_ERROR
- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 404 NOT_FOUND
- 409 CONFLICT
- 429 RATE_LIMITED
- 500 INTERNAL_ERROR
- 502 DEPENDENCY_ERROR
- 504 TIMEOUT
