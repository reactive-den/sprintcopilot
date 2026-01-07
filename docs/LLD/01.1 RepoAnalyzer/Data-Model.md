# RepoAnalyzer Data Model

## repo_analysis_job
- id (pk)
- tenant_id
- repo_connection_id
- status
- started_at
- completed_at

## repo_insight
- id (pk)
- tenant_id
- repo_connection_id
- insight_type
- severity
- evidence_jsonb
- summary
- created_at

## sprint_proposal
- id (pk)
- tenant_id
- repo_connection_id
- status
- proposal_jsonb
- created_at
- approved_at
