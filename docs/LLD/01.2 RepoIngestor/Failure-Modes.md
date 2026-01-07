# RepoIngestor Failure Modes

## Invalid webhook signature
- Behavior: reject with 401 and log audit event.
- Mitigation: alert on repeated failures.

## GitHub API rate limits
- Behavior: backoff and retry with jitter.
- Mitigation: incremental sync with checkpoints.

## Token revocation
- Behavior: mark connection as disconnected.
- Mitigation: notify tenant admin to re-install.
