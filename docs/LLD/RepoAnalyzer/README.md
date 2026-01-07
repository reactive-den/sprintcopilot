# RepoAnalyzer Service LLD

## Responsibilities
- Analyze repo signals into structured findings and sprint proposals.
- Orchestrate repo-to-sprint workflows with approval gates.
- Emit events that feed ticket slicing and estimation.

## Explicit non-responsibilities
- GitHub webhook ingestion.
- Tracking data collection.

## Dependencies
- Postgres (repo_analyzer database)
- Kafka
- Temporal
- AI Gateway
- Ticket Slicer Service
- Estimator Service

## Component diagram (textual)
```
[Workflow Runner] -> [Signal Aggregator] -> [Insight Generator]
[Insight Generator] -> [Proposal Composer]
[Proposal Composer] -> [Approval Gate]
[Outbox] -> [Event Publisher]
```

## State machine
```
SYNCED -> ANALYZING -> PROPOSAL_DRAFTED -> AWAITING_APPROVAL -> APPROVED
AWAITING_APPROVAL -> REJECTED
ANALYZING -> FAILED
```

Assumption: Analysis favors evidence-backed issues over speculative findings.
