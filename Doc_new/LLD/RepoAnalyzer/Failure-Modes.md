# RepoAnalyzer Failure Modes

## Insufficient evidence
- Behavior: mark insight as low confidence.
- Mitigation: require evidence pointers for each proposal item.

## Analysis timeout
- Behavior: retry workflow with backoff.
- Mitigation: chunk large repos by time window.

## Proposal rejected
- Behavior: store rejection reason and stop workflow.
- Mitigation: allow re-run with updated scope.
