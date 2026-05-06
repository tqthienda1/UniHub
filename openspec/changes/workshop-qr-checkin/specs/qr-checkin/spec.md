## ADDED Requirements

### Requirement: System generates a QR code for each confirmed registration
The system SHALL generate a signed QR code containing a JWT payload `{ registrationId, workshopId, studentId, exp }` upon registration confirmation. The QR code SHALL be accessible from the student's registration detail screen.

#### Scenario: QR code generated on confirmation
- **WHEN** a registration reaches `CONFIRMED` status
- **THEN** the system generates a signed JWT and makes it available for QR rendering in the mobile app

#### Scenario: QR code is unique per registration
- **WHEN** two different students confirm registrations for the same workshop
- **THEN** each receives a distinct QR code with their own `registrationId`

---

### Requirement: Organizer can scan QR codes to record attendance
An authenticated organizer or staff member SHALL be able to scan a student's QR code using the mobile scanner interface to mark the registration as `CHECKED_IN`.

#### Scenario: Successful scan and check-in
- **WHEN** an organizer scans a valid QR code for a `CONFIRMED` registration
- **THEN** the system validates the JWT, transitions the registration to `CHECKED_IN`, records a `WorkshopCheckIn` entry with timestamp, and returns a success response

#### Scenario: Already checked in
- **WHEN** an organizer scans a QR code for a registration already in `CHECKED_IN` status
- **THEN** the system returns HTTP 409 with message "Student already checked in"

#### Scenario: Invalid or tampered QR code
- **WHEN** an organizer scans a QR code with an invalid JWT signature
- **THEN** the system returns HTTP 401 with message "Invalid QR code"

#### Scenario: Expired QR code
- **WHEN** an organizer scans a QR code whose JWT `exp` has passed
- **THEN** the system returns HTTP 401 with message "QR code expired"

---

### Requirement: Offline check-in sync
The mobile scanner SHALL queue scan events locally in SQLite when the device is offline and synchronize them to the server when connectivity is restored.

#### Scenario: Offline scan queued
- **WHEN** the scanner device has no network connectivity and an organizer scans a QR code
- **THEN** the scan event is persisted to local SQLite with a `PENDING_SYNC` status

#### Scenario: Sync on reconnect
- **WHEN** the scanner device reconnects to the network
- **THEN** all `PENDING_SYNC` scan events are sent to the server in a batch; successful syncs are marked `SYNCED` and failed ones are retried up to 3 times

#### Scenario: Duplicate scan is idempotent
- **WHEN** the same scan event is sent to the server more than once (e.g., during retry)
- **THEN** the server processes the first occurrence and ignores subsequent duplicates, returning HTTP 200
