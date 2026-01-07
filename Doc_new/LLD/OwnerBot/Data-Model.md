# OwnerBot Data Model

## owner_query
- id (pk)
- tenant_id
- actor_id
- query_text
- requested_scopes
- time_range_start
- time_range_end
- created_at

## owner_query_result
- id (pk)
- tenant_id
- owner_query_id (fk)
- answer_text
- redactions_jsonb
- evidence_jsonb
- created_at

## progress_read_model_dev_ticket_summary
- tenant_id
- developer_id
- ticket_id
- status
- last_activity_at
- total_tracked_seconds
- sprint_id
- estimate_points
- pr_links_jsonb

## progress_read_model_ticket_timeline
- tenant_id
- ticket_id
- event_type
- event_at
- actor_id
- metadata_jsonb
