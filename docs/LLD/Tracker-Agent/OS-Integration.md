# OS Integrations

## Windows
- Idle time: GetLastInputInfo
- Active window: GetForegroundWindow + GetWindowText
- Screenshot: BitBlt or Desktop Duplication API

## macOS
- Idle time: IOKit + NSEvent
- Active app: NSWorkspace
- Screenshot: ScreenCaptureKit
- Permissions: Screen Recording + Accessibility (TCC)

Assumption: Users grant required permissions during onboarding.
