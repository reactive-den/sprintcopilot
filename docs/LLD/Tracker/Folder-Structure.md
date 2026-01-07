# Tracker Folder Structure and Code Skeletons

## Folder structure
```
services/tracker/
  cmd/server/main.ts
  src/api/routes.ts
  src/api/handlers/session_handlers.ts
  src/api/handlers/event_handlers.ts
  src/api/handlers/screenshot_handlers.ts
  src/services/policy_engine.ts
  src/services/storage_handler.ts
  src/services/reporting_engine.ts
  src/repo/session_repo.ts
  src/repo/event_repo.ts
  src/repo/screenshot_repo.ts
  src/events/outbox_repo.ts
  src/events/publisher.ts
  src/middleware/idempotency.ts
  src/config/index.ts
```

## Code skeleton
`services/tracker/src/services/storage_handler.ts`
```ts
export async function handleScreenshotUpload(file, meta) {
  const encrypted = await encrypt(file, meta.tenantKey);
  const objectKey = await s3.putObject(encrypted, meta.objectKey);
  return screenshotRepo.save(meta.sessionId, objectKey, meta.capturedAt);
}
```
