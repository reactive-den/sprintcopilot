# SprintCopilot Documentation Index

This folder contains the split HLD and LLD documentation by domain and by microservice.

Assumption: Content reflects established SaaS best practices without live web search access.

## Start here
- HLD overview: `Doc_new/HLD/00-Product-Overview.md`
- System architecture: `Doc_new/HLD/01-System-Architecture.md`
- Cross-cutting concerns: `Doc_new/HLD/02-Cross-Cutting-Concerns.md`
- Per-service LLDs: `Doc_new/LLD/`

## Structure
```
Doc_new/
  README.md
  Diagrams/
  HLD/
  LLD/
    Clarifier/
    HLD-Draft/
    Ticket-Slicer/
    Estimator/
    Tracker/
    Tracker-Agent/
  Shared/
```

## Diagrams (textual)
- `Doc_new/Diagrams/00-System-Context.md`
- `Doc_new/Diagrams/01-Microservices.md`
- `Doc_new/Diagrams/02-Deployment.md`
- `Doc_new/Diagrams/03-Trust-Boundaries.md`
- `Doc_new/Diagrams/DB/README.md`

## Shared standards
- `Doc_new/Shared/00-API-Standards.md`
- `Doc_new/Shared/01-Idempotency-Outbox.md`
- `Doc_new/Shared/02-Event-Envelope.md`
- `Doc_new/Shared/03-Auth-RBAC.md`
- `Doc_new/Shared/04-LLM-Gateway.md`
- `Doc_new/Shared/05-Observability.md`
- `Doc_new/Shared/06-Security-Compliance.md`
- `Doc_new/Shared/07-Config-Feature-Flags.md`

## HLD sections
- `Doc_new/HLD/00-Product-Overview.md`
- `Doc_new/HLD/01-System-Architecture.md`
- `Doc_new/HLD/02-Cross-Cutting-Concerns.md`
- `Doc_new/HLD/03-Data-Flows.md`
- `Doc_new/HLD/04-NFRs.md`
- `Doc_new/HLD/05-Deployment-Ops.md`
- `Doc_new/HLD/06-Backlog-Phasing.md`
- `Doc_new/HLD/07-Open-Questions-Assumptions.md`

## LLD sections (per service)
Each service folder contains:
- README (responsibilities, boundaries, dependencies, diagrams)
- APIs
- Data model
- Events
- AI design (if applicable)
- Failure modes
- Folder structure + code skeletons
- Sequence diagrams

If you want the monolithic file removed, tell me and I will delete `Doc_new/SAAS_HLD_LLD.md`.
