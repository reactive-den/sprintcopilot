# Tracker Failure Modes

- Upload failure -> resumable upload with retry.
- Consent revoked -> stop ingestion, revoke session token.
- Spoofed agent -> verify device binding and signed payloads.
