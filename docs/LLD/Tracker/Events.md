# Tracker Events

## Produced
- TrackingSessionStarted (topic: tracker.session-started.v1)
- ScreenshotUploaded (topic: tracker.screenshot-uploaded.v1)
- ActivityReportReady (topic: tracker.report-ready.v1)

## Consumed
- AssignmentsReady (topic: estimator.assignments-ready.v1)

## Payload schema (ScreenshotUploaded)
```json
{
  "event_id": "evt_500",
  "event_type": "ScreenshotUploaded",
  "schema_version": "1.0",
  "tenant_id": "ten_001",
  "correlation_id": "corr_001",
  "produced_at": "2025-10-16T12:30:00Z",
  "payload": {
    "screenshot_id": "ss_001",
    "session_id": "trk_001",
    "object_key": "tenant/ten_001/ss/ss_001.png"
  }
}
```
