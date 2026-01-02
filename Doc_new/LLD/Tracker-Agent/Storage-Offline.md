# Local Storage and Offline Mode

## Local storage
- Encrypted SQLite for events and metadata.
- Screenshot cache with encrypted blobs.
- Device-bound key stored in OS keychain.

## Offline behavior
- Queue events and screenshots locally when offline.
- Retry with exponential backoff until connectivity is restored.

Assumption: Local cache size is capped per tenant policy.
