# Ticket Slicer Integrations

## Jira integration flow
1) User connects Jira via OAuth.
2) Access token stored encrypted in integration_account.
3) Publish endpoint maps tickets to Jira issues.
4) External IDs stored in integration_link.

## Jira field mapping (minimum set)
- summary -> ticket.title
- description -> ticket.description + acceptance_criteria
- issuetype -> STORY/TASK
- priority -> mapped from estimator output

Assumption: OAuth scopes include issue:write and project:read.
