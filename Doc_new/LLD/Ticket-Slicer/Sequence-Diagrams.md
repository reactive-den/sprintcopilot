# Ticket Slicer Sequence Diagrams

## Publish to Jira
```
Client -> API -> PublishHandler -> JiraClient -> Jira API
Jira API -> JiraClient -> PublishHandler -> IntegrationLinkRepo
PublishHandler -> Outbox -> Kafka (TicketsPublished)
```
