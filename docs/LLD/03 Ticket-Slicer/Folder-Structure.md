# Ticket Slicer Folder Structure and Code Skeletons

## Folder structure
```
services/tickets/
  cmd/server/main.ts
  src/api/routes.ts
  src/api/handlers/job_handlers.ts
  src/api/handlers/publish_handlers.ts
  src/services/slicer_service.ts
  src/services/ac_generator.ts
  src/integrations/jira_client.ts
  src/integrations/clickup_client.ts
  src/llm/prompts/ticket_slicer_v1.ts
  src/repo/job_repo.ts
  src/repo/ticket_repo.ts
  src/events/outbox_repo.ts
  src/events/publisher.ts
  src/middleware/idempotency.ts
  src/config/index.ts
```

## Code skeletons
`services/tickets/src/services/slicer_service.ts`
```ts
export async function sliceTickets(hldDoc) {
  const prompt = buildTicketPrompt(hldDoc);
  const llmResult = await llmClient.invoke(prompt);
  const tickets = validateTicketSet(llmResult);
  return ticketRepo.saveSet(tickets);
}
```

`services/tickets/src/integrations/jira_client.ts`
```ts
export async function publishToJira(tickets, projectKey, token) {
  for (const t of tickets) {
    const payload = mapToJira(t, projectKey);
    await jiraApi.createIssue(payload, token);
  }
}
```
