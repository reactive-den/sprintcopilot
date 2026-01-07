# Ticket Slicer Failure Modes

- Jira API rate limit -> exponential backoff with jitter.
- Integration token expired -> refresh; if fails, return AUTH_REQUIRED.
- Duplicate tickets -> de-dupe and re-run slicing.
