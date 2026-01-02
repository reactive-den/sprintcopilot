# System Architecture (HLD)

## Diagrams
- System context: `Doc_new/Diagrams/00-System-Context.md`
- Microservices pipeline: `Doc_new/Diagrams/01-Microservices.md`
- Deployment: `Doc_new/Diagrams/02-Deployment.md`
- Trust boundaries: `Doc_new/Diagrams/03-Trust-Boundaries.md`

## Data ownership map
- Clarifier Service: clarifier_session, clarifier_message, bdd_document.
- HLD Draft Service: hld_job, hld_document.
- Ticket Slicer Service: ticket_job, ticket_set, ticket_item, integration_account.
- Estimator Service: estimate_job, estimate_item, developer_profile, assignment_item.
- Tracker Service: tracker_session, tracker_event, screenshot, policy, consent_record.

## Technology choices and rationale
- Decision: AWS as primary cloud with EKS, RDS Postgres, MSK, S3, KMS.
  - Trade-off: Vendor lock-in vs. operational maturity and managed services.
  - Why: Reduces operational burden and provides strong security primitives.
- Decision: TypeScript + Node.js 20 LTS for all backend services.
  - Trade-off: Lower raw performance than Go; higher developer velocity and shared libraries.
  - Why: Consistency and maintainability.
- Decision: Postgres 15 per service with Row Level Security (RLS).
  - Trade-off: Shared DB increases blast radius if policies misconfigured.
  - Why: Strong relational integrity and consistent tooling.
- Decision: Kafka for domain events; Temporal for workflow orchestration.
  - Trade-off: Additional operational complexity.
  - Why: Reliable async processing and deterministic retries.
- Decision: REST/JSON for public APIs; internal service calls via REST with mTLS.
  - Trade-off: Less efficient than gRPC; simpler debugging and broader support.
  - Why: Faster iteration and easier integration.

## Shared infrastructure
- API Gateway/BFF: auth, rate limiting, request validation, tenant context, response aggregation.
- Workflow Orchestrator: durable pipeline state, retries, timeouts, and compensation.
- AI Gateway: provider abstraction, prompt registry, safety checks, token accounting.
- Event Bus: Kafka with schema registry and DLQ topics.
- Job Queue: Temporal task queues per workflow.
- Storage: S3 for documents and screenshots; Redis for caching and rate limits.
- Observability: OpenTelemetry, Prometheus, Grafana, centralized logs, alerting.

## Multi-tenancy model
- Decision: Shared database per service with tenant_id on all records and RLS policies.
- Decision: Per-tenant encryption keys for sensitive data (envelope encryption with KMS).
- Trade-off: Shared DB simplifies operations but requires strict policy enforcement.
- Why: Balances cost with strong logical isolation; supports enterprise migration to dedicated DBs.
