# Clarifier AI Design

## Prompt template
```
SYSTEM: You are a business analyst.
USER: Idea: {idea}
Context: {context}
Constraints: {constraints}
Return JSON with fields: questions[], assumptions[], scope.
```

## Output schema
- questions: array of strings, min 3, max 7
- assumptions: array of strings
- scope: string

## Few-shot strategy
- 3 curated examples: SaaS, marketplace, internal tool.

## Hallucination controls
- Schema validation with retries.
- Max tokens per response.
- Reject any fields not defined in schema.

## Evaluation metrics
- JSON validity rate
- Question relevance score
- BDD completeness score
