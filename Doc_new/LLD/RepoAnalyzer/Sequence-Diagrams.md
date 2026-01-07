# RepoAnalyzer Sequence Diagrams

## Repo to sprint workflow
```
RepoAnalyzer -> Kafka: RepoSyncCompleted
RepoAnalyzer -> Temporal: start RepoToSprintWorkflow
RepoAnalyzer -> Signal Aggregator: collect issues/PRs/CI
RepoAnalyzer -> Insight Generator: produce findings
RepoAnalyzer -> Proposal Composer: draft sprint proposal
Owner -> API Gateway: approve proposal
RepoAnalyzer -> Ticket Slicer: create tickets
RepoAnalyzer -> Estimator: estimate and assign
RepoAnalyzer -> Kafka: SprintProposalApproved
```
