## Context

The current QR check-in system in UniHub is functional but basic. It uses a hardcoded workshop ID in the mobile app and relies on simple alerts for feedback. To support real-world event operations, we need a robust, staff-focused application experience that allows organizers to manage check-ins for multiple concurrent workshops with high efficiency.

## Goals / Non-Goals

**Goals:**
- Provide a clear event selection flow for staff.
- Implement high-speed scanning with instant, non-blocking feedback.
- Show real-time progress indicators (attendance counts).
- Support manual check-ins for edge cases.
- Integrate sensory feedback (haptics/sound) for improved speed in loud or crowded environments.

**Non-Goals:**
- Building a completely separate mobile application (we will enhance the existing one with a dedicated "Staff" mode).
- Implementing offline-first synchronization (out of scope for this phase).
- Complex biometric authentication for staff.

## Decisions

- **Dedicated Staff Dashboard**: Introduce a "Staff" section in the mobile app, accessible to users with the `ADMIN` or `STAFF` role.
- **Workshop Selector**: A new screen where staff can see a list of today's workshops and select one to start checking students in.
- **Live Counters**: Use WebSocket events to keep the attendance counters (Checked-in / Total) updated in real-time.
- **Visual Feedback Overlays**: Replace blocking `Alert` windows with transient, color-coded overlays (Green for success, Red for failure) that allow the scanner to remain active.
- **Sensory Feedback**: Use `expo-haptics` for a quick vibration on success and `expo-av` for a "ping" sound, allowing staff to keep their eyes on the students.
- **Manual Search**: A "Can't scan?" button that leads to a searchable list of registered students for the selected workshop, allowing one-tap manual check-in.

## Risks / Trade-offs

- **Network Reliability**: High-speed scanning is sensitive to API latency. We will implement optimistic UI updates where possible, or at least ensure the "loading" state is non-intrusive.
- **Role Permissions**: Access control must be strictly enforced on both the frontend (hiding the tab) and backend (securing the endpoints).
