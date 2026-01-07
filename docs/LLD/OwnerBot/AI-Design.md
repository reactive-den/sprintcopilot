# OwnerBot AI Design

## Prompt goals
- Produce concise status summaries with evidence citations.
- Never reveal restricted tracking data without consent.

## Inputs
- Question text
- Aggregated progress data
- Consent scopes and redaction rules
- Evidence references

## Output contract
- summary_text
- evidence_refs[]
- redactions[]
- follow_up_questions[]
