# AI/LLM Gateway Design

## Prompt registry
- Semantic versioning per service: clarifier.v3, hld.v2, tickets.v1.
- Stored with metadata: model, temperature, max_tokens, safety profile.

## Output validation
- JSON Schema validation with retries.
- Reject outputs with missing required fields.

## Safety filters
- PII detection and redaction.
- Prompt injection detection with allow/deny rules.
- Toxicity filter for user-visible output.

## Token accounting
- Per-tenant and per-user quotas.
- Alerts when 80% of quota is consumed.

## Evaluation
- Offline regression suite per prompt version.
- Metrics: JSON validity rate, completeness score, hallucination rate.
