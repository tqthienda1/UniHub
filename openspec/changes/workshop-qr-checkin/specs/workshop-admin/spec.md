## ADDED Requirements

### Requirement: Admin can create and publish workshops
An authenticated admin or organizer SHALL be able to create a workshop with title, description, category, start/end datetime, location, and total capacity. A workshop MUST be explicitly published before it appears in the student catalog.

#### Scenario: Create draft workshop
- **WHEN** an admin submits a new workshop with valid fields
- **THEN** the system creates a `Workshop` with status `DRAFT` and returns its ID

#### Scenario: Publish a draft workshop
- **WHEN** an admin sets a `DRAFT` workshop to `PUBLISHED`
- **THEN** the system updates status to `PUBLISHED` and the workshop appears in the student catalog

#### Scenario: Invalid workshop data
- **WHEN** an admin submits a workshop with `endDate` before `startDate`
- **THEN** the system rejects the request with HTTP 422 and a descriptive validation error

---

### Requirement: Admin can edit and cancel workshops
An admin SHALL be able to update workshop details (excluding capacity if registrations exist) and cancel a workshop, which transitions all `CONFIRMED` registrations to `CANCELLED`.

#### Scenario: Edit workshop details
- **WHEN** an admin updates the title or description of a `PUBLISHED` workshop
- **THEN** changes are persisted and reflected immediately in the catalog

#### Scenario: Cannot reduce capacity below current registrations
- **WHEN** an admin attempts to set `totalCapacity` below the number of active registrations
- **THEN** the system rejects the request with HTTP 422 and message "Capacity cannot be less than current registration count"

#### Scenario: Cancel workshop
- **WHEN** an admin cancels a workshop
- **THEN** status transitions to `CANCELLED`, all `CONFIRMED` registrations are transitioned to `CANCELLED`, and `availableSeats` is set to 0

---

### Requirement: Admin can view registrations and attendance
An admin SHALL be able to view a paginated list of registrations for a workshop, filter by status, and export attendance as CSV.

#### Scenario: View registration list
- **WHEN** an admin views the registration list for a workshop
- **THEN** the system returns all registrations with student name, email, registration status, and check-in timestamp (if applicable)

#### Scenario: Filter registrations by status
- **WHEN** an admin filters by status `CHECKED_IN`
- **THEN** the system returns only registrations with `CHECKED_IN` status

#### Scenario: Export attendance as CSV
- **WHEN** an admin clicks "Export CSV"
- **THEN** the system generates and downloads a CSV file with columns: studentId, name, email, registrationStatus, checkedInAt
