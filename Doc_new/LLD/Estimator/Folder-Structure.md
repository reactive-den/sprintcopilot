# Estimator Folder Structure and Code Skeletons

## Folder structure
```
services/estimator/
  cmd/server/main.ts
  src/api/routes.ts
  src/api/handlers/job_handlers.ts
  src/services/estimation_engine.ts
  src/services/assignment_engine.ts
  src/services/capacity_planner.ts
  src/repo/job_repo.ts
  src/repo/estimate_repo.ts
  src/repo/developer_repo.ts
  src/events/outbox_repo.ts
  src/events/publisher.ts
  src/middleware/idempotency.ts
  src/config/index.ts
```

## Code skeleton
`services/estimator/src/services/assignment_engine.ts`
```ts
export function assign(tickets, developers) {
  const assignments = [];
  for (const ticket of tickets) {
    const best = pickBestDeveloper(ticket, developers);
    if (!best) throw new Error('REQUIRES_PROFILE');
    assignments.push({ ticket_id: ticket.id, developer_id: best.id });
    best.capacity -= ticket.estimated_hours;
  }
  return assignments;
}
```
