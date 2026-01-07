# RepoAnalyzer AI Design

## Prompt goals
- Derive grounded insights from repo artifacts.
- Produce problem-impact-change statements with evidence.

## Inputs
- Issues, PRs, CI results, labels, docs excerpts
- Repo metadata and recent change history

## Output contract
- insights[] with type, severity, evidence
- business_intent_hypotheses[] with confidence and citations
- proposal_items[] with rationale and mapping to artifacts
