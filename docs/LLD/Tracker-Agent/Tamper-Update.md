# Tamper Resistance and Updates

## Tamper resistance (non-stealth)
- Signed binaries and integrity check on launch.
- Local audit log of start/stop.
- Detect clock tampering and report anomalies.

## Update mechanism
1) Agent checks update endpoint on startup.
2) Downloads signed package.
3) Verifies signature.
4) Applies update on next restart.

Assumption: Updates can be deferred by policy for active sessions.
