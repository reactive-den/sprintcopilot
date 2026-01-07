# HLD Draft AI Design

## Prompt template
```
SYSTEM: You are a principal software architect.
USER: Given this BDD JSON, produce HLD and LLD sections.
Requirements:
- Output markdown with headings: Architecture, Data Flows, NFRs, Risks.
- Use explicit APIs and data models.
```

## Validation
- Required headings enforced in validator.
- Chunked prompts for token limit handling.

## Evaluation metrics
- Section completeness score
- Risk coverage score
- JSON validity rate (if JSON output requested)
