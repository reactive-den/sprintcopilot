# HLD Draft Folder Structure and Code Skeletons

## Folder structure
```
services/hld/
  cmd/server/main.ts
  src/api/routes.ts
  src/api/handlers/job_handlers.ts
  src/services/hld_service.ts
  src/services/chunker.ts
  src/services/renderer.ts
  src/llm/prompts/hld_v2.ts
  src/llm/llm_client.ts
  src/repo/job_repo.ts
  src/repo/document_repo.ts
  src/storage/s3_client.ts
  src/events/outbox_repo.ts
  src/events/publisher.ts
  src/middleware/idempotency.ts
  src/config/index.ts
```

## Code skeleton
`services/hld/src/services/hld_service.ts`
```ts
export async function draft(job) {
  const bdd = await bddClient.fetch(job.bdd_id);
  const chunks = chunker.split(bdd);
  const parts = [];
  for (const chunk of chunks) {
    parts.push(await llmClient.invoke(buildPrompt(chunk), { promptVersion: 'hld.v2' }));
  }
  const markdown = renderer.merge(parts);
  const objectKey = await s3.putObject(markdown);
  return documentRepo.save({ objectKey, format: 'markdown', size: markdown.length });
}
```
