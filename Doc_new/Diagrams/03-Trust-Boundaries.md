# Trust Boundaries Diagram

```
[Public Internet]
  -> [API Gateway/BFF] (TLS termination, WAF, rate limits)
     -> [Service Mesh] (mTLS, service identity)
        -> [Datastores]
  -> [Tracker Desktop Agent] (mutual auth, signed payloads)
  -> [Third-party APIs] (Jira/ClickUp, LLM providers)
```
