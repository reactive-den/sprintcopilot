# Authentication and Authorization (RBAC)

## Authentication
- OIDC with enterprise SSO support.
- JWT access tokens with short TTL.
- Refresh tokens stored server-side with rotation and revocation.

## Token claims
- tenant_id
- user_id
- roles
- scopes
- exp

## Roles
- Owner, Admin, Manager, Contributor, Contractor.

## Authorization
- Role-based access control per tenant.
- Resource-level checks for ownership and scope.
