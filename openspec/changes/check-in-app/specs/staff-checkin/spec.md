## ADDED Requirements

### Requirement: Staff-specific workshop dashboard
Authenticated users with `STAFF` or `ADMIN` roles SHALL have access to a "Staff Mode" dashboard in the mobile application. This dashboard SHALL display upcoming and currently active workshops for which the user is an organizer or assistant.

#### Scenario: Staff views active workshops
- **WHEN** an authorized staff member opens the Staff Dashboard
- **THEN** the system displays a list of workshops scheduled for today, including Title, Time, and current Registration/Check-in counts

---

### Requirement: Active workshop selection for scanning
Staff members SHALL select a specific workshop from the dashboard to initialize the QR scanner. The scanner SHALL then be "locked" to that workshop's context for the duration of the session.

#### Scenario: Staff selects workshop
- **WHEN** a staff member taps on a workshop in the dashboard
- **THEN** the application transitions to the `QrScannerScreen` and initializes it with the selected `workshopId`

---

### Requirement: Instant non-blocking feedback
The QR scanner SHALL use transient visual overlays and sensory triggers (sound/vibration) to communicate scan results to the operator without requiring interaction to dismiss alerts.

#### Scenario: Successful scan feedback
- **WHEN** the server returns a successful check-in response
- **THEN** the scanner displays a semi-transparent Green overlay for 1000ms, triggers a "success" haptic vibration, and plays a high-pitched beep sound

#### Scenario: Error or duplicate scan feedback
- **WHEN** the server returns an error (e.g., Already Checked In or Invalid)
- **THEN** the scanner displays a semi-transparent Red (for error) or Orange (for duplicate) overlay for 1500ms and triggers a long "error" haptic vibration

---

### Requirement: Manual student check-in
Staff members SHALL be able to access a searchable list of all registered students for the active workshop and manually mark them as `CHECKED_IN`.

#### Scenario: Staff searches and checks in student manually
- **WHEN** a staff member searches for a student by name in the manual check-in list and taps "Check In"
- **THEN** the system sends a check-in request to the server and updates the student's status to `CHECKED_IN` in real-time
