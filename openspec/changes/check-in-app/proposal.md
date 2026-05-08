## Why

Currently, the UniHub platform has a basic QR scanner implementation in the mobile app, but it lacks the necessary UI/UX for staff to efficiently manage workshop check-ins. Staff members need a dedicated flow to select a workshop, see real-time attendance counts, and scan student QR codes with clear visual feedback (Success/Failure/Duplicate) without intrusive alerts. This will improve the speed and reliability of event entry and provide a professional experience for event organizers.

## What Changes

- **New**: Dedicated "Staff Mode" dashboard for organizers to view and select active workshops.
- **New**: Workshop selection screen with search and filter for upcoming/active events.
- **New**: Real-time attendance monitoring on the scanner screen (e.g., "45/100 Checked In").
- **Modification**: Redesigned `QrScannerScreen` with high-performance scanning and instant visual feedback overlays (Green/Red/Orange).
- **New**: Success/Error sound effects and haptic feedback on successful scan.
- **New**: Manual check-in search capability for students who cannot present a QR code.
- **Modification**: Update mobile navigation to support a separate "Staff" tab or mode.

## Capabilities

### New Capabilities
- `staff-checkin`: A dedicated workflow for event staff to manage attendance, including event selection, high-speed scanning, and manual student lookup.

### Modified Capabilities
- `qr-checkin`: Update requirements to support real-time feedback and workshop-specific context for the scanner.

## Impact

- **Mobile**: Significant updates to `mobile/src/screens/QrScannerScreen.tsx`, new `StaffWorkshopSelectScreen.tsx`, and `ManualCheckInScreen.tsx`.
- **Backend API**: New endpoints in `WorkshopsController` to list "Staff-Managed Workshops" and a search endpoint for registrations.
- **Dependencies**: Add `expo-haptics` and `expo-av` for sensory feedback.
