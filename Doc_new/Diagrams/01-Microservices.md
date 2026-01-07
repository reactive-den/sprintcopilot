# Microservices Pipeline Diagram

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
   |
   +--> [RepoIngestor Service] --(RepoSyncCompleted)--> [RepoAnalyzer Service]
   |                                      |
   |                                      +--(SprintProposalCreated)--> [Ticket Slicer Service]
   |
   +--> [OwnerBot Service] --(OwnerQueryExecuted)--> [Owner Responses]
```
