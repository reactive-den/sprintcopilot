# Screenshot Pipeline

1) Capture screenshot per policy interval.
2) Apply blur/redaction rules.
3) Encrypt with tenant data key.
4) Upload via pre-signed URL.
5) Receive ACK and mark as uploaded.

Assumption: Redaction rules are provided by tenant policy.
