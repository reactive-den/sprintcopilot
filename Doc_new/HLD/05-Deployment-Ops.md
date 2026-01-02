# Deployment and Operations (HLD)

## Environments
- dev, stage, prod with isolated resources.

## CI/CD pipeline
- Build -> unit tests -> integration tests -> security scan -> deploy.
- Canary deployment for production.

## Secrets management
- Secrets in Secrets Manager; no secrets in code.

## Migrations
- Backward-compatible migrations first.
- Non-backward-compatible changes require dual-write and cutover.

## Rollbacks
- Automated rollback on error budget breach.
- Database rollback via snapshot restore.
