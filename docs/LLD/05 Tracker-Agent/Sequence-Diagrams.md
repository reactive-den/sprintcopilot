# Tracker Agent Sequence Diagrams

## Upload events
```
Agent -> Tracker API -> Auth -> EventRepo
EventRepo -> Ack -> Agent
```
