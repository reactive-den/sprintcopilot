# Estimator Sequence Diagrams

## Assignment flow
```
Estimator -> TicketRepo -> DeveloperRepo -> AssignmentEngine
AssignmentEngine -> AssignmentRepo -> Outbox -> Kafka (AssignmentsReady)
```
