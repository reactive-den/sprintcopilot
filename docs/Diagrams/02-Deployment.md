# Deployment Diagram

```
[Kubernetes Cluster]
  - Namespace: platform
    - api-gateway
    - workflow-orchestrator
    - ai-gateway
  - Namespace: services
    - clarifier
    - hld
    - tickets
    - estimator
    - tracker
    - ownerbot
    - repo-ingestor
    - repo-analyzer
  - Namespace: observability
    - otel-collector
    - prometheus
    - grafana
  - Namespace: data
    - kafka
    - redis
    - postgres
```
