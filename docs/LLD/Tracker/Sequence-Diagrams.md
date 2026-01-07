# Tracker Sequence Diagrams

## Screenshot upload
```
Agent -> Tracker API -> PolicyEngine -> StorageHandler -> S3
StorageHandler -> ScreenshotRepo -> Outbox -> Kafka (ScreenshotUploaded)
```
