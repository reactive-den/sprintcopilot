# Data Flows (HLD)

## Flow A: Idea -> BDD -> HLD -> Tickets -> Assignment
1) Web App -> API Gateway: POST /clarifier/sessions
2) Clarifier Service stores session and emits BDDReady.
3) HLD Draft Service consumes BDDReady, generates docs, emits HLDDraftReady.
4) Ticket Slicer consumes HLDDraftReady, generates tickets, emits TicketPlanReady.
5) Estimator consumes TicketPlanReady, generates estimates, emits AssignmentsReady.
6) Ticket Slicer publishes tickets to Jira/ClickUp.

## Flow B: Ticket -> Developer -> Tracker -> Reports
1) AssignmentsReady triggers tracking policy enforcement.
2) Developer installs agent and provides consent.
3) Agent sends activity events and screenshots.
4) Tracker Service stores and aggregates events.
5) Reporting engine generates reports and exposes via API.

## Flow C: Owner Bot -> Progress Answer
1) Owner posts query via API Gateway.
2) OwnerBot validates RBAC and consent scopes.
3) OwnerBot reads progress read model (or queries services directly).
4) OwnerBot emits OwnerQueryExecuted and OwnerQueryResponseGenerated.
5) Response includes evidence and redactions.

## Flow D: Repo -> Insights -> Sprint Proposal
1) Owner connects GitHub repo via RepoIngestor.
2) RepoIngestor processes webhooks and sync jobs, emits RepoSyncCompleted.
3) RepoAnalyzer runs analysis workflow and emits RepoInsightGenerated.
4) RepoAnalyzer drafts SprintProposalCreated and waits for approval.
5) On approval, tickets and assignments are created and downstream tracking begins.
