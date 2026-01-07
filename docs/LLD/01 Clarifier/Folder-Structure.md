# Clarifier Folder Structure and Code Skeletons

## Folder structure
```
services/clarifier/
  cmd/server/main.ts
  src/api/routes.ts
  src/api/handlers/session_handlers.ts
  src/domain/session.ts
  src/domain/bdd.ts
  src/services/clarifier_service.ts
  src/services/question_engine.ts
  src/llm/prompts/clarifier_v3.ts
  src/llm/llm_client.ts
  src/repo/session_repo.ts
  src/repo/message_repo.ts
  src/repo/bdd_repo.ts
  src/events/outbox_repo.ts
  src/events/publisher.ts
  src/middleware/idempotency.ts
  src/middleware/auth.ts
  src/config/index.ts
```

## Code skeletons
`services/clarifier/src/api/handlers/session_handlers.ts`
```ts
export async function createSessionHandler(req, res) {
  const input = validateCreateSession(req.body);
  const result = await clarifierService.startSession(input, req.ctx);
  return res.status(201).json(result);
}
```

`services/clarifier/src/services/clarifier_service.ts`
```ts
export async function startSession(input, ctx) {
  const session = await sessionRepo.create(input, ctx.tenantId);
  const prompt = buildClarifierPrompt(session);
  const llmResult = await llmClient.invoke(prompt, { promptVersion: 'clarifier.v3' });
  const questions = validateQuestions(llmResult);
  await messageRepo.addAssistantQuestions(session.id, questions);
  await outboxRepo.enqueue('BDDReady', { session_id: session.id, bdd_id: null });
  return { session_id: session.id, status: 'QUESTIONING', next_questions: questions };
}
```
