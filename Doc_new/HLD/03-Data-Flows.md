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
