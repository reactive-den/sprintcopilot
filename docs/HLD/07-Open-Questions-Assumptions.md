# Open Questions and Explicit Assumptions (HLD)

## Open questions
- What legal retention period is required for screenshots per region?
- Which compliance frameworks are required beyond SOC2?
- Are data residency controls required per tenant?
- What GitHub scopes are acceptable per tenant and plan tier?
- What is the retention policy for repo metadata and PR comments?

## Explicit assumptions
- Assumption: Jira and ClickUp APIs are available with standard OAuth scopes.
- Assumption: Tenants consent to storing AI-generated documents in cloud storage.
- Assumption: Desktop agent can obtain OS-level permissions for screenshots.
- Assumption: This documentation is based on established SaaS best practices without live web search access.
- Assumption: GitHub App installations are approved by org owners per tenant.
