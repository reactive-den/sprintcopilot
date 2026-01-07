# System Context Diagram

```
[User Browser] -> [Web App] -> [API Gateway/BFF] -> [Service Mesh]
[Admin Browser] -> [Admin UI] -> [API Gateway/BFF]
[API Gateway/BFF] -> [Clarifier Service]
[API Gateway/BFF] -> [HLD Draft Service]
[API Gateway/BFF] -> [Ticket Slicer Service] -> [Jira/ClickUp APIs]
[API Gateway/BFF] -> [Estimator Service]
[API Gateway/BFF] -> [OwnerBot Service]
[API Gateway/BFF] -> [RepoIngestor Service] -> [GitHub APIs]
[API Gateway/BFF] -> [RepoAnalyzer Service]
[Tracker Desktop Agent] -> [Tracker Service] -> [Object Storage]
[All Services] <-> [AI Gateway] <-> [LLM Providers]
[All Services] <-> [Kafka Event Bus]
[All Services] <-> [Postgres (per service)]
[All Services] <-> [Redis Cache]
[All Services] -> [Observability Stack]
```
