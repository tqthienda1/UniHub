## ADDED Requirements

### Requirement: Student can browse published workshops
The system SHALL display a paginated list of workshops with status `PUBLISHED`, ordered by start date ascending. Each item SHALL show title, date/time, location, category, available seats, and total capacity.

#### Scenario: View workshop list
- **WHEN** a student opens the workshop catalog
- **THEN** the system returns workshops with status `PUBLISHED`, paginated (default 20 per page), sorted by `startDate` ascending

#### Scenario: No published workshops
- **WHEN** no workshops have status `PUBLISHED`
- **THEN** the system returns an empty list and displays an appropriate empty-state message

---

### Requirement: Student can search and filter workshops
The system SHALL allow filtering by keyword (title/description), category, date range, and availability (seats remaining > 0).

#### Scenario: Search by keyword
- **WHEN** a student enters a search term
- **THEN** the system returns workshops whose title or description contains the term (case-insensitive)

#### Scenario: Filter by category
- **WHEN** a student selects one or more categories
- **THEN** the system returns only workshops belonging to those categories

#### Scenario: Filter by available seats
- **WHEN** a student toggles "Available only"
- **THEN** the system returns only workshops where `availableSeats > 0`

---

### Requirement: Student can view workshop detail
The system SHALL provide a detail view for each workshop including full description, speaker/organizer info, schedule, location map link, and real-time seat count updated via WebSocket.

#### Scenario: View detail of a published workshop
- **WHEN** a student navigates to a workshop detail page
- **THEN** the system displays full workshop information including current `availableSeats`

#### Scenario: Real-time seat update
- **WHEN** another user registers for the same workshop while a student is viewing the detail
- **THEN** the student's seat count updates in real time without a page refresh
