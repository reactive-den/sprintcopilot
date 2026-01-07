# SprintCopilot SaaS Documentation (HLD + LLD)

Note: This master file has been split into multiple files under `Doc_new/`. Start at `Doc_new/README.md`.

Version: 9.0
Owner: Platform Architecture
Date: 2025-10-16

Assumption: This document reflects established production SaaS practices without live web search access.

---

## 1. Product & Domain Overview (HLD)

### Vision & goals
- Convert raw business ideas into validated, structured engineering artifacts in minutes.
- Provide end-to-end traceability from idea -> architecture -> tickets -> assignment -> time tracking.
- Deliver a multi-tenant SaaS with auditable, consent-based tracking and compliance controls.

### Target personas
- Founder or PM: wants fast scope, risks, and a credible execution plan.
- Engineering Manager: wants clear tickets, estimates, and assignments aligned to capacity.
- Developer: wants unambiguous acceptance criteria and assignments.
- Compliance or HR: wants consent-based tracking with retention controls.

### Domain glossary
- Idea: raw text describing a business problem or feature request.
- Clarifier Session: AI-guided conversation and transcript.
- BDD: Business Draft Document produced by Clarifier.
- Architecture Document: HLD + LLD + data flows + NFRs.
- Ticket Set: Epics, stories, tasks derived from HLD/LLD.
- Estimate Set: Ticket sizes and hour estimates.
- Assignment Set: Ticket-to-developer assignments.
- Developer Profile: skills, availability, time zone.
- Policy: Tracking and retention rules.
- Consent Record: immutable acceptance of a policy version.
- Tracker Session: time-window of activity tracking.

### Primary user journeys (step-by-step)
1) Idea to BDD
   - Input: idea title, problem statement, constraints.
   - Clarifier prompts user, gathers answers, and produces BDD.
   - Output: BDD (JSON + markdown) with scope, assumptions, risks, open questions.
2) BDD to architecture docs
   - Input: BDD.
   - HLD Draft Service produces HLD/LLD/data flows/NFRs.
   - Output: architecture docs in markdown and JSON.
3) Docs to tickets
   - Input: HLD/LLD package.
   - Ticket Slicer generates epics, stories, tasks, and acceptance criteria.
   - Output: ticket set and optional Jira/ClickUp publication.
4) Estimation and assignment
   - Input: ticket set and developer profiles.
   - Estimator assigns sizes and hours, then assigns developers.
   - Output: assignment set synced to external tools.
5) Tracking and reporting
   - Input: assignment set and developer consent.
   - Agent captures activity and screenshots per policy.
   - Output: activity reports linked to tickets.

### Non-goals
- Replacing full project management or HR suites.
- Real-time code repository mutation or automated PR creation.
- Non-consensual or stealth employee monitoring.

---

## 2. System Architecture (HLD)

### System context diagram (textual)
```
[User Browser] -> [Web App] -> [API Gateway/BFF] -> [Service Mesh]
[Admin Browser] -> [Admin UI] -> [API Gateway/BFF]
[API Gateway/BFF] -> [Clarifier Service]
[API Gateway/BFF] -> [HLD Draft Service]
[API Gateway/BFF] -> [Ticket Slicer Service] -> [Jira/ClickUp APIs]
[API Gateway/BFF] -> [Estimator Service]
[Tracker Desktop Agent] -> [Tracker Service] -> [Object Storage]
[All Services] <-> [AI Gateway] <-> [LLM Providers]
[All Services] <-> [Kafka Event Bus]
[All Services] <-> [Postgres (per service)]
[All Services] <-> [Redis Cache]
[All Services] -> [Observability Stack]
```

### Microservices diagram (textual)
```
[Web App]
   |
   v
[API Gateway/BFF]
   |
   v
[Workflow Orchestrator]
   |
   +--> [Clarifier Service] --(BDDReady)--> [HLD Draft Service]
   |                                          |
   |                                          +--(HLDDraftReady)--> [Ticket Slicer Service]
   |                                                                      |
   |                                                                      +--(TicketPlanReady)--> [Estimator Service]
   |                                                                                                     |
   |                                                                                                     +--(AssignmentsReady)--> [Tracker Service]
   |
   +--> [Tracker Service] <-> [Object Storage]
```

### Trust boundaries
```
[Public Internet]
  -> [API Gateway/BFF] (TLS termination, WAF, rate limits)
     -> [Service Mesh] (mTLS, service identity)
        -> [Datastores]
  -> [Tracker Desktop Agent] (mutual auth, signed payloads)
  -> [Third-party APIs] (Jira/ClickUp, LLM providers)
```

### Data ownership map
- Clarifier Service: clarifier_session, clarifier_message, bdd_document.
- HLD Draft Service: hld_job, hld_document.
- Ticket Slicer Service: ticket_job, ticket_set, ticket_item, integration_account.
- Estimator Service: estimate_job, estimate_item, developer_profile, assignment_item.
- Tracker Service: tracker_session, tracker_event, screenshot, policy, consent_record.

### Technology choices and rationale
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

### Shared infrastructure
- API Gateway/BFF: auth, rate limiting, request validation, tenant context, response aggregation.
- Workflow Orchestrator: durable pipeline state, retries, timeouts, and compensation.
- AI Gateway: provider abstraction, prompt registry, safety checks, token accounting.
- Event Bus: Kafka with schema registry and DLQ topics.
- Job Queue: Temporal task queues per workflow.
- Storage: S3 for documents and screenshots; Redis for caching and rate limits.
- Observability: OpenTelemetry, Prometheus, Grafana, centralized logs, alerting.

### Multi-tenancy model
- Decision: Shared database per service with tenant_id on all records and RLS policies.
- Decision: Per-tenant encryption keys for sensitive data (envelope encryption with KMS).
- Trade-off: Shared DB simplifies operations but requires strict policy enforcement.
- Why: Balances cost with strong logical isolation; supports enterprise migration to dedicated DBs.

---

## 3. Cross-Cutting Concerns (HLD)

### Authentication & authorization (RBAC)
- Auth: OIDC with enterprise SSO support.
- Access tokens: JWT with tenant_id, user_id, roles, scopes, and expiry.
- Refresh tokens: stored server-side with rotation and revocation.
- Roles: Owner, Admin, Manager, Contributor, Contractor.
- Authorization: RBAC + resource ownership checks by tenant_id.

### Tenant isolation strategy
- RLS enforced for every table with tenant_id.
- Tenant_id extracted from JWT and set in DB session via SET LOCAL.
- Sensitive artifacts encrypted with tenant-specific data keys.

### API standards (applies to all services)
- Versioning: `/v1` in path.
- Headers:
  - Authorization: `Bearer <token>`
  - Idempotency-Key: `<uuid>` for all POST/PUT that create or mutate.
  - X-Request-Id: `<uuid>` propagated end-to-end.
- Idempotency:
  - Idempotency keys stored with request hash and response payload for 24h.
  - Duplicate keys return original response; mismatched payload returns 409.
- Pagination:
  - Cursor-based: `?cursor=<base64>&limit=50`.
  - Response: `next_cursor` and `has_more`.

### Error codes (standard)
- 400 VALIDATION_ERROR
- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 404 NOT_FOUND
- 409 CONFLICT
- 429 RATE_LIMITED
- 500 INTERNAL_ERROR
- 502 DEPENDENCY_ERROR
- 504 TIMEOUT

### Common tables (used in every service)
Idempotency key table (Postgres):
```sql
CREATE TABLE idempotency_key (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  request_path TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_body JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idempotency_key_tenant_path_idx ON idempotency_key (tenant_id, request_path);
```

Outbox table (Postgres):
```sql
CREATE TABLE outbox_event (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);
CREATE INDEX outbox_event_tenant_idx ON outbox_event (tenant_id, created_at);
```

### AI/LLM gateway design
- Prompt registry with semantic versioning: `clarifier.v3`, `hld.v2`.
- Output schemas enforced by JSON Schema + runtime validation.
- Safety filters: PII detection, prompt injection detection, toxicity filter.
- Token accounting by tenant and user with quotas.
- Evals: offline regression suite per prompt version.

### Eventing & async workflows
- Event envelope (Kafka):
```json
{
  "event_id": "evt_123",
  "event_type": "BDDReady",
  "schema_version": "1.0",
  "tenant_id": "ten_001",
  "correlation_id": "corr_123",
  "produced_at": "2025-10-16T12:00:00Z",
  "payload": {}
}
```
- Outbox pattern in each service for transactional event emission.
- At-least-once delivery; consumers must be idempotent.
- DLQ topics per event type after 5 retries.

### Observability
- Logs: structured JSON with tenant_id, request_id, trace_id.
- Metrics: p50/p95 latency, error rate, queue depth, LLM token usage.
- Tracing: OpenTelemetry with W3C context.
- Alerts: SLO burn-rate alerts per service.

### Security & compliance
- TLS 1.2+ everywhere; mTLS between services.
- Encryption at rest (KMS) for all sensitive data.
- Audit logs for admin actions and policy changes.
- Consent records immutable and versioned.

### Configuration & feature flags
- Central config service with tenant overrides.
- Feature flags for experimental pipelines and LLM models.
- Config changes audited and rollbackable.

---

## 4. Service-by-Service Design (LLD)

### 4.1 Clarifier Service

#### 4.1.1 Responsibilities & Boundaries
- Owns conversational state and BDD generation.
- Owns validation and storage of clarifier sessions and messages.
- Does NOT own ticket or architecture generation.

#### 4.1.2 Dependencies
- Postgres (clarifier database)
- AI Gateway for LLM calls
- Kafka for events
- Redis for caching and rate limiting

#### 4.1.3 Component diagram (textual)
```
[API Routes] -> [Session Manager] -> [Question Engine] -> [LLM Client]
[Session Manager] -> [Session Repo, Message Repo]
[BDD Composer] -> [BDD Repo]
[Outbox] -> [Event Publisher]
```

#### 4.1.4 Public APIs
Base path: `/v1/clarifier`

1) POST `/sessions`
- Idempotency: required.
- Request schema:
```json
{
  "idea": "string (min 5, max 2000)",
  "context": "string (max 2000)",
  "constraints": "string (max 1000)"
}
```
- Response schema:
```json
{
  "session_id": "string (uuid)",
  "status": "QUESTIONING",
  "next_questions": ["string"]
}
```

2) POST `/sessions/{session_id}/messages`
- Idempotency: required.
- Request:
```json
{
  "message": "string (min 1, max 2000)"
}
```
- Response:
```json
{
  "status": "QUESTIONING",
  "next_questions": ["string"]
}
```

3) POST `/sessions/{session_id}/finalize`
- Idempotency: required.
- Response:
```json
{
  "bdd_id": "string (uuid)",
  "status": "COMPLETED"
}
```

4) GET `/sessions/{session_id}`
- Response:
```json
{
  "session_id": "string",
  "status": "QUESTIONING",
  "messages": [
    {"role": "USER", "content": "...", "created_at": "..."}
  ]
}
```

5) GET `/sessions?cursor=...&limit=50`

Errors: VALIDATION_ERROR, NOT_FOUND, CONFLICT, TIMEOUT.

#### 4.1.5 Internal Components
- Session Manager: state transitions and TTL.
- Question Engine: question generation and validation.
- Prompt Builder: structured prompt with context.
- LLM Client: calls AI Gateway with prompt version.
- BDD Composer: compiles final BDD with deterministic schema.

State machine:
```
CREATED -> QUESTIONING -> AWAITING_USER -> QUESTIONING -> COMPLETED
CREATED -> FAILED
QUESTIONING -> FAILED
```

#### 4.1.6 Data Model
Postgres tables:
- clarifier_session
  - id uuid pk
  - tenant_id uuid not null
  - status varchar(24) not null
  - idea text not null
  - context text
  - constraints text
  - created_at timestamptz default now()
  - updated_at timestamptz default now()
- clarifier_message
  - id uuid pk
  - session_id uuid fk -> clarifier_session.id
  - role varchar(10) check in ('USER','ASSISTANT')
  - content text not null
  - created_at timestamptz default now()
- bdd_document
  - id uuid pk
  - session_id uuid fk
  - tenant_id uuid not null
  - content_json jsonb not null
  - created_at timestamptz default now()

Indexes:
- clarifier_session (tenant_id, created_at)
- clarifier_message (session_id, created_at)
- bdd_document (tenant_id, created_at)

#### 4.1.7 Events
Produced:
- BDDReady (topic: clarifier.bdd-ready.v1)

Consumed:
- ClarifierRequested (topic: orchestrator.clarifier-requested.v1)

#### 4.1.8 AI-Specific Design
Prompt template (simplified):
```
SYSTEM: You are a business analyst.
USER: Idea: {idea}
Context: {context}
Constraints: {constraints}
Return JSON with fields: questions[], assumptions[], scope.
```

Output schema:
- questions: array of strings, min 3, max 7
- assumptions: array of strings
- scope: string

Hallucination controls:
- Schema validation with retries.
- Max tokens per response.
- Remove any content not in schema.

#### 4.1.9 Failure Modes
- LLM timeout -> retry with smaller context; if still failing, mark FAILED.
- Invalid JSON -> retry once; if still invalid, FAILED.
- Session abandoned -> expire after 7 days.

#### 4.1.10 Folder Structure and Code Skeleton
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

---

### 4.2 HLD Draft Service

#### 4.2.1 Responsibilities & Boundaries
- Owns generation of HLD/LLD, data flows, NFRs from BDD.
- Does NOT own ticket slicing or estimation.

#### 4.2.2 Dependencies
- Postgres (hld database)
- AI Gateway
- Kafka
- Redis

#### 4.2.3 Component diagram (textual)
```
[API Routes] -> [Job Manager] -> [Chunker] -> [LLM Client]
[Renderer] -> [Document Repo]
[Outbox] -> [Event Publisher]
```

#### 4.2.4 Public APIs
Base path: `/v1/hld`

1) POST `/jobs`
- Idempotency: required.
- Request:
```json
{
  "bdd_id": "string (uuid)",
  "output_format": "markdown"
}
```

2) GET `/jobs/{job_id}`
- Response:
```json
{
  "job_id": "string",
  "status": "COMPLETED",
  "document_id": "string"
}
```

3) GET `/documents/{document_id}`
- Response:
```json
{
  "document_id": "string",
  "content_markdown": "# HLD ..."
}
```

#### 4.2.5 Internal Components
- Job Manager: job lifecycle and retries.
- Prompt Builder: creates deterministic section prompts.
- Chunker: token-limit handling.
- Validator: required section validation.
- Renderer: assembles markdown.

State machine:
```
QUEUED -> DRAFTING -> COMPLETED
QUEUED -> FAILED
```

#### 4.2.6 Data Model
- hld_job (id uuid, tenant_id uuid, bdd_id uuid, status, created_at, updated_at)
- hld_document (id uuid, tenant_id uuid, object_key text, format varchar(10), content_hash text, size_bytes int, metadata_json jsonb, created_at)

Indexes:
- hld_job (tenant_id, created_at)
- hld_document (tenant_id, created_at)

#### 4.2.7 Events
Produced:
- HLDDraftReady (topic: hld.draft-ready.v1)

Consumed:
- BDDReady (topic: clarifier.bdd-ready.v1)

#### 4.2.8 AI-Specific Design
- Prompt includes fixed section outline.
- Few-shot examples for architecture style.
- Output validation checks required headings.

#### 4.2.9 Failure Modes
- Token overflow -> chunk prompts, merge outputs.
- Missing sections -> auto-correct with validator feedback.

#### 4.2.10 Folder Structure and Code Skeleton
```
services/hld/
  cmd/server/main.ts
  src/api/routes.ts
  src/api/handlers/job_handlers.ts
  src/services/hld_service.ts
  src/services/chunker.ts
  src/llm/prompts/hld_v2.ts
  src/llm/llm_client.ts
  src/repo/job_repo.ts
  src/repo/document_repo.ts
  src/events/outbox_repo.ts
  src/events/publisher.ts
  src/middleware/idempotency.ts
  src/config/index.ts
```

---

### 4.3 Ticket Slicer & Creator Service

#### 4.3.1 Responsibilities & Boundaries
- Owns conversion of docs to epics, stories, tasks.
- Owns Jira/ClickUp integration and publishing.
- Does NOT own estimation or assignment.

#### 4.3.2 Dependencies
- Postgres (tickets database)
- AI Gateway
- Kafka
- Jira/ClickUp APIs

#### 4.3.3 Component diagram (textual)
```
[API Routes] -> [Slicer Engine] -> [AC Generator] -> [Ticket Repo]
[Integration Adapter] -> [Jira/ClickUp APIs]
[Outbox] -> [Event Publisher]
```

#### 4.3.4 Public APIs
Base path: `/v1/tickets`

1) POST `/jobs`
- Idempotency: required.
- Request:
```json
{
  "hld_document_id": "string (uuid)",
  "max_tickets": 40
}
```

2) GET `/jobs/{job_id}`
- Response:
```json
{
  "job_id": "string",
  "status": "READY",
  "ticket_set_id": "string"
}
```

3) GET `/sets/{set_id}`
- Response:
```json
{
  "set_id": "string",
  "tickets": [
    {
      "title": "Auth: email OTP",
      "type": "STORY",
      "acceptance_criteria": ["User receives OTP", "OTP expires after 10 min"]
    }
  ]
}
```

4) POST `/sets/{set_id}/publish`
- Idempotency: required.
- Request:
```json
{
  "integration_id": "string",
  "project_key": "string"
}
```

#### 4.3.5 Internal Components
- Slicer Engine: constructs epics and stories.
- Acceptance Criteria Generator: Gherkin style.
- Integration Adapter: Jira/ClickUp client.
- Validator: duplication and coverage checks.

#### 4.3.6 Data Model
- ticket_job (id uuid, tenant_id uuid, hld_document_id uuid, status, created_at)
- ticket_set (id uuid, tenant_id uuid, job_id uuid, created_at)
- ticket_item (id uuid, set_id uuid, type, title, description, acceptance_criteria_json)
- integration_account (id uuid, tenant_id uuid, provider, access_token_enc, refresh_token_enc, expires_at)
- integration_link (id uuid, set_id uuid, external_id, provider)

Indexes:
- ticket_job (tenant_id, created_at)
- ticket_item (set_id)
- integration_account (tenant_id, provider)

#### 4.3.7 Events
Produced:
- TicketPlanReady (topic: tickets.plan-ready.v1)
- TicketsPublished (topic: tickets.published.v1)

Consumed:
- HLDDraftReady (topic: hld.draft-ready.v1)

#### 4.3.8 AI-Specific Design
- Prompt templates for slicing and AC generation.
- Few-shot: 3 domain examples.
- Output validation enforces max_tickets and unique titles.

#### 4.3.9 Failure Modes
- Jira API rate limit -> exponential backoff with jitter.
- Token expired -> refresh; if fails, AUTH_REQUIRED.
- Duplicate tickets -> de-dupe and re-run slicing.

#### 4.3.10 Folder Structure and Code Skeleton
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

---

### 4.4 Estimator & Assigner Service

#### 4.4.1 Responsibilities & Boundaries
- Owns estimation and assignment based on developer profiles.
- Does NOT own ticket creation or tracking data capture.

#### 4.4.2 Dependencies
- Postgres (estimator database)
- Kafka
- Redis

#### 4.4.3 Component diagram (textual)
```
[API Routes] -> [Estimation Engine] -> [Assignment Engine]
[Capacity Planner] -> [Developer Repo]
[Outbox] -> [Event Publisher]
```

#### 4.4.4 Public APIs
Base path: `/v1/estimator`

1) POST `/jobs`
- Idempotency: required.
- Request:
```json
{
  "ticket_set_id": "string"
}
```

2) GET `/jobs/{job_id}`
- Response:
```json
{
  "job_id": "string",
  "status": "COMPLETED",
  "estimate_set_id": "string"
}
```

3) POST `/assignments`
- Idempotency: required.
- Request:
```json
{
  "estimate_set_id": "string",
  "strategy": "SKILL_AND_CAPACITY"
}
```

#### 4.4.5 Internal Components
- Estimation Engine: heuristics + optional LLM hints.
- Assignment Engine: greedy matching with constraints.
- Capacity Planner: checks availability and workload.
- Skills Normalizer: maps skills taxonomy.

#### 4.4.6 Data Model
- estimate_job (id uuid, tenant_id uuid, ticket_set_id uuid, status, created_at)
- estimate_item (id uuid, job_id uuid, ticket_id uuid, tshirt_size, hours)
- developer_profile (id uuid, tenant_id uuid, name, skills_json, timezone)
- availability_window (id uuid, developer_id uuid, start_at, end_at, hours)
- assignment_item (id uuid, estimate_job_id uuid, ticket_id uuid, developer_id uuid)

Indexes:
- developer_profile (tenant_id, name)
- assignment_item (developer_id)

#### 4.4.7 Events
Produced:
- EstimatesReady (topic: estimator.estimates-ready.v1)
- AssignmentsReady (topic: estimator.assignments-ready.v1)

Consumed:
- TicketPlanReady (topic: tickets.plan-ready.v1)

#### 4.4.8 AI-Specific Design
- Optional: AI-assisted estimation using prompt templates.
- Fallback: deterministic heuristics when LLM fails.
- Metrics: variance against actuals.

#### 4.4.9 Failure Modes
- Missing developer profiles -> return REQUIRES_PROFILE.
- Capacity conflicts -> re-run with constraints; alert manager.

#### 4.4.10 Folder Structure and Code Skeleton
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

---

### 4.5 Tracker Service

#### 4.5.1 Responsibilities & Boundaries
- Owns ingestion and storage of activity data and screenshots.
- Owns policy enforcement and consent validation.
- Does NOT own desktop agent logic or ticket creation.

#### 4.5.2 Dependencies
- Postgres (tracker database)
- S3 (object storage)
- Kafka

#### 4.5.3 Component diagram (textual)
```
[API Routes] -> [Policy Engine] -> [Ingest Validator]
[Storage Handler] -> [S3]
[Reporting Engine] -> [Reports API]
[Outbox] -> [Event Publisher]
```

#### 4.5.4 Public APIs
Base path: `/v1/tracker`

1) POST `/sessions`
- Idempotency: required.
- Request:
```json
{
  "developer_id": "string",
  "device_id": "string",
  "consent_version": "string"
}
```

2) POST `/events`
- Idempotency: required.
- Request:
```json
{
  "session_id": "string",
  "event_type": "APP_FOCUS",
  "payload": {"app": "VSCode"},
  "timestamp": "2025-10-16T12:20:00Z"
}
```

3) POST `/screenshots`
- Idempotency: required.
- Request: multipart (binary + metadata).

4) GET `/reports/activity?developer_id=...&from=...&to=...`
- Pagination: cursor.

#### 4.5.5 Internal Components
- Ingest API: validates and authenticates agent payloads.
- Policy Engine: checks consent, schedule, app allow/deny.
- Storage Handler: encrypts screenshots and stores in S3.
- Reporting Engine: aggregates events and outputs reports.

#### 4.5.6 Data Model
- tracker_session (id uuid, tenant_id uuid, developer_id uuid, device_id, consent_version, created_at)
- tracker_event (id uuid, session_id uuid, event_type, payload_json, timestamp)
- screenshot (id uuid, session_id uuid, object_key, captured_at, blurred bool, checksum)
- policy (id uuid, tenant_id uuid, rules_json, version, created_at)
- consent_record (id uuid, tenant_id uuid, developer_id uuid, policy_version, accepted_at)

Indexes:
- tracker_event (session_id, timestamp)
- screenshot (session_id, captured_at)
- consent_record (tenant_id, developer_id)

#### 4.5.7 Events
Produced:
- TrackingSessionStarted (topic: tracker.session-started.v1)
- ScreenshotUploaded (topic: tracker.screenshot-uploaded.v1)
- ActivityReportReady (topic: tracker.report-ready.v1)

Consumed:
- AssignmentsReady (topic: estimator.assignments-ready.v1)

#### 4.5.8 Failure Modes
- Upload failure -> resumable upload with retry.
- Consent revoked -> stop ingestion, revoke session token.
- Spoofed agent -> verify device binding and signed payloads.

#### 4.5.9 Folder Structure and Code Skeleton
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

---

## 5. Tracker Desktop Agent (LLD)

### Agent architecture
- UI Shell: shows consent, status, and policy details.
- Background Service: captures activity and screenshots.
- Local Policy Engine: enforces schedule and app restrictions.
- Crypto Module: encrypts before upload.
- Upload Manager: retries and batches.

### OS integrations
- Windows: Win32 APIs for idle time, active window, capture.
- macOS: ScreenCaptureKit, Accessibility APIs, TCC permissions.

### Local storage & offline mode
- Encrypted SQLite for events and metadata.
- Screenshot cache with encrypted blobs.
- Retry with exponential backoff until online.

### Screenshot pipeline
1) Capture screenshot per policy interval.
2) Apply blur/redaction rules.
3) Encrypt with tenant data key.
4) Upload via pre-signed URL.

### Policy enforcement
- Policies fetched on startup and every 6 hours.
- Enforced rules: screenshot interval, app allow/deny list, working hours.
- Consent required before any capture.

### Tamper resistance (non-stealth)
- Signed binaries and integrity check on launch.
- Local audit log of start/stop.
- Detects clock tampering and reports anomalies.

### Update mechanism
- Auto-update via signed packages.
- Staged rollout by tenant.
- Rollback to last known good version.

### Folder structure and code skeleton
```
agent/
  src/main.rs
  src/ui/
  src/capture/
  src/policy/
  src/crypto/
  src/storage/
  src/uploader/
  src/telemetry/
```

---

## 6. Data Flows (HLD + LLD)

### Flow A: Idea -> BDD -> HLD -> Tickets -> Assignment
1) Web App -> API Gateway: POST /clarifier/sessions
2) Clarifier Service stores session and emits BDDReady.
3) HLD Draft Service consumes BDDReady, generates docs, emits HLDDraftReady.
4) Ticket Slicer consumes HLDDraftReady, generates tickets, emits TicketPlanReady.
5) Estimator consumes TicketPlanReady, generates estimates, emits AssignmentsReady.
6) Ticket Slicer publishes tickets to Jira/ClickUp.

### Flow B: Ticket -> Developer -> Tracker -> Reports
1) AssignmentsReady triggers tracking policy enforcement.
2) Developer installs agent and provides consent.
3) Agent sends activity events and screenshots.
4) Tracker Service stores and aggregates events.
5) Reporting engine generates reports and exposes via API.

---

## 7. Non-Functional Requirements

### Performance SLAs
- API Gateway p95 latency < 300ms for non-LLM endpoints.
- LLM pipeline end-to-end < 90 seconds for standard ideas.
- Tracker screenshot upload p95 < 5 seconds.

### Scalability assumptions
- Assumption: 500 tenants, 50,000 monthly active users.
- Assumption: 5,000 concurrent tracker sessions.

### Availability targets
- 99.9% for core APIs.
- 99.5% for LLM-dependent workflows.

### Cost considerations
- Token usage capped per tenant with quotas.
- Screenshot storage tiered by plan.

### Data retention
- Assumption: screenshots retained for 90 days by default.
- Assumption: docs retained for 2 years.

---

## 8. Deployment & Operations

### Environments
- dev, stage, prod with isolated resources.

### CI/CD pipeline
- Build -> unit tests -> integration tests -> security scan -> deploy.
- Canary deployment for production.

### Secrets management
- Secrets in Secrets Manager; no secrets in code.

### Migrations
- Backward-compatible migrations first.
- Non-backward-compatible changes require dual-write and cutover.

### Rollbacks
- Automated rollback on error budget breach.
- Database rollback via snapshot restore.

---

## 9. Backlog & Phasing

### MVP scope
- Clarifier, HLD Draft, Ticket Slicer, Estimator, Tracker MVP.
- Jira integration only.
- Basic activity reports.

### Phase 2
- ClickUp integration.
- Advanced estimation with historical velocity.
- SSO and SCIM provisioning.

### Phase 3
- AI evaluation dashboard.
- Dedicated tenant databases.
- Advanced compliance reporting.

### Intentionally deferred
- Real-time code analysis.
- Automated PR creation.

---

## 10. Open Questions & Explicit Assumptions

### Open questions
- What legal retention period is required for screenshots per region?
- Which compliance frameworks are required beyond SOC2?
- Are data residency controls required per tenant?

### Explicit assumptions
- Assumption: Jira and ClickUp APIs are available with standard OAuth scopes.
- Assumption: Tenants consent to storing AI-generated documents in cloud storage.
- Assumption: Desktop agent can obtain OS-level permissions for screenshots.
- Assumption: This document reflects established production SaaS practices without live web search access.

---

## Appendix A: Detailed LLDs (Per Service)

### A.1 Clarifier Service - Detailed LLD

#### A.1.1 API scopes and rate limits
- Scopes:
  - `clarifier:read` for GET endpoints
  - `clarifier:write` for POST endpoints
- Rate limits:
  - 60 requests/min per user
  - 10 concurrent sessions per tenant

#### A.1.2 Endpoint specifications

POST `/v1/clarifier/sessions`
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

POST `/v1/clarifier/sessions/{session_id}/messages`
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

POST `/v1/clarifier/sessions/{session_id}/finalize`
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

GET `/v1/clarifier/sessions/{session_id}`
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

#### A.1.3 SQL DDL (Clarifier)
```sql
CREATE TABLE clarifier_session (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  status VARCHAR(24) NOT NULL,
  idea TEXT NOT NULL,
  context TEXT,
  constraints TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE clarifier_message (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES clarifier_session(id),
  role VARCHAR(10) NOT NULL CHECK (role IN ('USER','ASSISTANT')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE bdd_document (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES clarifier_session(id),
  tenant_id UUID NOT NULL,
  content_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX clarifier_session_tenant_idx ON clarifier_session (tenant_id, created_at);
CREATE INDEX clarifier_message_session_idx ON clarifier_message (session_id, created_at);
```

#### A.1.4 Event payload (BDDReady)
```json
{
  "event_id": "evt_123",
  "event_type": "BDDReady",
  "schema_version": "1.0",
  "tenant_id": "ten_001",
  "correlation_id": "corr_001",
  "produced_at": "2025-10-16T12:00:00Z",
  "payload": {
    "bdd_id": "bdd_456",
    "session_id": "sess_123",
    "summary": "Short summary of business idea"
  }
}
```

#### A.1.5 Sequence diagram (textual)
```
Client -> API -> Idempotency -> SessionRepo -> LLMClient -> AI Gateway -> LLM
LLM -> AI Gateway -> LLMClient -> SessionRepo -> Outbox -> Publisher -> Kafka
API -> Client (next_questions)
```

#### A.1.6 Code skeletons
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

`services/clarifier/src/events/outbox_repo.ts`
```ts
export async function enqueue(eventType, payload) {
  return db.query(
    'INSERT INTO outbox_event (id, tenant_id, event_type, payload) VALUES ($1,$2,$3,$4)',
    [uuid(), payload.tenant_id, eventType, payload]
  );
}
```

---

### A.2 HLD Draft Service - Detailed LLD

#### A.2.1 API scopes and rate limits
- Scopes:
  - `hld:read` for GET endpoints
  - `hld:write` for POST endpoints
- Rate limits:
  - 10 jobs/min per user
  - 50 jobs/hour per tenant

#### A.2.2 Endpoint specifications
POST `/v1/hld/jobs`
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

GET `/v1/hld/jobs/{job_id}`
- Response includes status and document_id

GET `/v1/hld/documents/{document_id}`
- Response includes object_key (S3), hash, and optional inline content

#### A.2.3 SQL DDL (HLD)
```sql
CREATE TABLE hld_job (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  bdd_id UUID NOT NULL,
  status VARCHAR(24) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hld_document (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  object_key TEXT NOT NULL,
  format VARCHAR(10) NOT NULL,
  content_hash TEXT NOT NULL,
  size_bytes INT NOT NULL,
  metadata_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### A.2.4 Sequence diagram (textual)
```
Client -> API -> JobManager -> LLMClient -> AI Gateway -> LLM
LLM -> Renderer -> S3 -> DocumentRepo -> Outbox -> Kafka
API -> Client (job_id)
```

#### A.2.5 Code skeletons
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

#### A.2.6 Folder structure (HLD service)
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

#### A.2.7 Event payload (HLDDraftReady)
```json
{
  "event_id": "evt_200",
  "event_type": "HLDDraftReady",
  "schema_version": "1.0",
  "tenant_id": "ten_001",
  "correlation_id": "corr_001",
  "produced_at": "2025-10-16T12:05:00Z",
  "payload": {
    "hld_document_id": "doc_001",
    "bdd_id": "bdd_456",
    "object_key": "tenant/ten_001/hld/doc_001.md"
  }
}
```

#### A.2.8 Prompt template (HLD)
```
SYSTEM: You are a principal software architect.
USER: Given this BDD JSON, produce HLD and LLD sections.
Requirements:
- Output markdown with headings: Architecture, Data Flows, NFRs, Risks.
- Use explicit APIs and data models.
```

---

### A.3 Ticket Slicer Service - Detailed LLD

#### A.3.1 Integration flow (Jira)
1) User connects Jira via OAuth.
2) Access token stored encrypted in integration_account.
3) Publish endpoint maps tickets to Jira issues.
4) External IDs stored in integration_link.

#### A.3.2 SQL DDL (Tickets)
```sql
CREATE TABLE ticket_job (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  hld_document_id UUID NOT NULL,
  status VARCHAR(24) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ticket_set (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  job_id UUID NOT NULL REFERENCES ticket_job(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ticket_item (
  id UUID PRIMARY KEY,
  set_id UUID NOT NULL REFERENCES ticket_set(id),
  type VARCHAR(10) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  acceptance_criteria_json JSONB NOT NULL
);
```

#### A.3.3 Folder structure and code skeletons
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

#### A.3.4 Event payloads
TicketPlanReady:
```json
{
  "event_id": "evt_300",
  "event_type": "TicketPlanReady",
  "schema_version": "1.0",
  "tenant_id": "ten_001",
  "correlation_id": "corr_001",
  "produced_at": "2025-10-16T12:10:00Z",
  "payload": {
    "ticket_set_id": "set_001",
    "count": 24
  }
}
```

TicketsPublished:
```json
{
  "event_id": "evt_301",
  "event_type": "TicketsPublished",
  "schema_version": "1.0",
  "tenant_id": "ten_001",
  "correlation_id": "corr_001",
  "produced_at": "2025-10-16T12:12:00Z",
  "payload": {
    "ticket_set_id": "set_001",
    "provider": "jira",
    "external_ids": ["ENG-101", "ENG-102"]
  }
}
```

#### A.3.5 Jira field mapping (minimum set)
- summary -> ticket.title
- description -> ticket.description + acceptance_criteria
- issuetype -> STORY/TASK
- priority -> mapped from estimator output

#### A.3.6 Sequence diagram (publish to Jira)
```
Client -> API -> PublishHandler -> JiraClient -> Jira API
Jira API -> JiraClient -> PublishHandler -> IntegrationLinkRepo
PublishHandler -> Outbox -> Kafka (TicketsPublished)
```

---

### A.4 Estimator Service - Detailed LLD

#### A.4.1 Estimation formula
- Base hours by ticket type:
  - EPIC: 40h
  - STORY: 8h
  - TASK: 4h
- Complexity factor: +1h per acceptance criteria item.
- Cap at tenant max hours per ticket.

#### A.4.2 SQL DDL (Estimator)
```sql
CREATE TABLE estimate_job (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  ticket_set_id UUID NOT NULL,
  status VARCHAR(24) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE estimate_item (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES estimate_job(id),
  ticket_id UUID NOT NULL,
  tshirt_size VARCHAR(5) NOT NULL,
  hours INT NOT NULL
);
```

#### A.4.3 Assignment algorithm (detail)
- Input: ticket set with required skills + estimated hours
- Input: developer profiles with skills and capacity
- Score = (skill_match * 0.6) + (availability * 0.3) + (timezone_overlap * 0.1)
- Greedy assignment with capacity constraint
- If no feasible assignment: emit REQUIRES_PROFILE error

#### A.4.4 Event payload (AssignmentsReady)
```json
{
  "event_id": "evt_400",
  "event_type": "AssignmentsReady",
  "schema_version": "1.0",
  "tenant_id": "ten_001",
  "correlation_id": "corr_001",
  "produced_at": "2025-10-16T12:15:00Z",
  "payload": {
    "assignment_set_id": "as_001",
    "count": 24
  }
}
```

#### A.4.5 Folder structure and code skeletons
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

#### A.4.6 Sequence diagram (assignment)
```
Estimator -> TicketRepo -> DeveloperRepo -> AssignmentEngine
AssignmentEngine -> AssignmentRepo -> Outbox -> Kafka (AssignmentsReady)
```

---

### A.5 Tracker Service - Detailed LLD

#### A.5.1 Screenshot pipeline
1) Agent captures screenshot.
2) Agent blurs sensitive areas (configurable).
3) Agent encrypts image with tenant key.
4) Upload to S3 via presigned URL.
5) Tracker Service records metadata.

#### A.5.2 SQL DDL (Tracker)
```sql
CREATE TABLE tracker_session (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  developer_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tracker_event (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES tracker_session(id),
  event_type TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL
);
```

#### A.5.3 Event payload (ScreenshotUploaded)
```json
{
  "event_id": "evt_500",
  "event_type": "ScreenshotUploaded",
  "schema_version": "1.0",
  "tenant_id": "ten_001",
  "correlation_id": "corr_001",
  "produced_at": "2025-10-16T12:30:00Z",
  "payload": {
    "screenshot_id": "ss_001",
    "session_id": "trk_001",
    "object_key": "tenant/ten_001/ss/ss_001.png"
  }
}
```

#### A.5.4 Folder structure and code skeletons
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

`services/tracker/src/services/storage_handler.ts`
```ts
export async function handleScreenshotUpload(file, meta) {
  const encrypted = await encrypt(file, meta.tenantKey);
  const objectKey = await s3.putObject(encrypted, meta.objectKey);
  return screenshotRepo.save(meta.sessionId, objectKey, meta.capturedAt);
}
```

#### A.5.5 Sequence diagram (screenshot upload)
```
Agent -> Tracker API -> PolicyEngine -> StorageHandler -> S3
StorageHandler -> ScreenshotRepo -> Outbox -> Kafka (ScreenshotUploaded)
```

---

### A.6 Tracker Agent - Detailed LLD

#### A.6.1 Local data model (SQLite)
```sql
CREATE TABLE local_event (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  uploaded INTEGER DEFAULT 0
);
```

#### A.6.2 Update flow
1) Agent checks update endpoint on startup.
2) Downloads signed package.
3) Verifies signature.
4) Applies update on next restart.

#### A.6.3 Folder structure and code skeletons
```
agent/
  src/main.rs
  src/ui/
  src/capture/
  src/policy/
  src/crypto/
  src/storage/
  src/uploader/
  src/telemetry/
```

`agent/src/uploader/mod.rs`
```rs
pub fn upload_batch(events: Vec<Event>, endpoint: &str) -> Result<(), UploadError> {
  // Serialize events, sign payload, retry on network errors
  Ok(())
}
```

#### A.6.4 Network payload (event upload)
```json
{
  "session_id": "trk_001",
  "device_id": "mac_001",
  "events": [
    {"event_type": "APP_FOCUS", "timestamp": "2025-10-16T12:20:00Z", "payload": {"app": "VSCode"}}
  ]
}
```

#### A.6.5 Sequence diagram (agent upload)
```
Agent -> Tracker API -> Auth -> EventRepo
EventRepo -> Ack -> Agent
```
