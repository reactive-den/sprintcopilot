# Tracker Agent Folder Structure and Code Skeletons

## Folder structure
```
agent/
  src/main.rs
  src/ui/
  src/capture/
  src/policy/
  src/crypto/
  src/storage/
  src/uploader/
  src/telemetry/
```

## Code skeleton
`agent/src/uploader/mod.rs`
```rs
pub fn upload_batch(events: Vec<Event>, endpoint: &str) -> Result<(), UploadError> {
  // Serialize events, sign payload, retry on network errors
  Ok(())
}
```
