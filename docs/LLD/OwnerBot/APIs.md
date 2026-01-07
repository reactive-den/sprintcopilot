# OwnerBot APIs

## POST /owner-bot/query
Request:
```
{
  "text": "Show me Abdul's progress this week",
  "developerId": "dev_123",
  "sprintId": "sprint_456",
  "timeRange": {"from": "2024-08-05", "to": "2024-08-12"}
}
```

Response:
```
{
  "answer": "Abdul completed 3 tickets and has 2 in progress...",
  "evidence": [
    {"ticketId": "TCK-101", "eventAt": "2024-08-08T10:22:11Z"}
  ],
  "redactions": ["time_per_ticket"],
  "citations": ["ticket:TCK-101", "event:tracker_event_789"]
}
```

## GET /owner-bot/health
- Returns service status and read model lag.
