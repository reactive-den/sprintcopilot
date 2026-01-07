# Security and Compliance

## Transport security
- TLS 1.2+ everywhere.
- mTLS between services in the mesh.

## Data security
- Encryption at rest with KMS.
- Per-tenant data keys for sensitive artifacts.
- GitHub App private keys and tokens stored with envelope encryption and rotation.

## Auditability
- Audit logs for admin actions and policy changes.
- Consent records immutable and versioned.
- Owner Bot queries and repo analysis runs are logged with scopes and evidence references.

## Compliance posture
- SOC2-aligned controls for access, logging, retention, and change management.
- Webhook signature verification required for all GitHub events.
- Data minimization applied to repo ingestion; avoid full code ingestion by default.
