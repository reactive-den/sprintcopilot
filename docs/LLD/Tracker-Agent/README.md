# Tracker Desktop Agent LLD

## Responsibilities
- Capture activity and screenshots per tenant policy.
- Enforce consent and local policy.
- Encrypt and upload data to Tracker Service.

## Explicit non-responsibilities
- Hidden or stealth monitoring.
- Server-side reporting.

## Architecture
- UI Shell: consent, status, and policy visibility.
- Background Service: capture loop.
- Local Policy Engine: schedule, allow/deny apps.
- Crypto Module: encrypt before upload.
- Upload Manager: batching and retries.

Assumption: Agent runs as a user-level process, not a kernel driver.
