## ADDED Requirements

### Requirement: Student can register for a workshop
The system SHALL allow an authenticated student to claim a seat in a workshop that has `availableSeats > 0`. The system MUST use a distributed lock to prevent overbooking under concurrent load.

#### Scenario: Successful registration
- **WHEN** an authenticated student submits a registration request for a workshop with available seats
- **THEN** the system creates a `WorkshopRegistration` with status `CONFIRMED`, decrements `availableSeats` by 1, and returns the registration ID

#### Scenario: No seats available
- **WHEN** a student attempts to register for a workshop with `availableSeats = 0`
- **THEN** the system rejects the request with HTTP 409 and message "No seats available"

#### Scenario: Concurrent registration race condition
- **WHEN** two students simultaneously submit registration requests for the last available seat
- **THEN** exactly one registration succeeds and the other receives HTTP 409; `availableSeats` MUST NOT go below 0

#### Scenario: Student already registered
- **WHEN** a student who already has an active registration (PENDING or CONFIRMED) attempts to register again
- **THEN** the system rejects the request with HTTP 409 and message "Already registered"

---

### Requirement: Registration status lifecycle
A `WorkshopRegistration` SHALL follow the state machine: `CONFIRMED` → `CHECKED_IN` or `CANCELLED`. Only valid transitions SHALL be permitted.

#### Scenario: Invalid status transition
- **WHEN** a service attempts to transition a registration from `CHECKED_IN` back to `CONFIRMED`
- **THEN** the system throws a domain error and persists no state change

---

### Requirement: Student can cancel a registration
An authenticated student SHALL be able to cancel their own registration if status is `CONFIRMED` and the workshop has not yet started. Cancellation MUST increment `availableSeats` by 1.

#### Scenario: Successful cancellation
- **WHEN** a student cancels a `CONFIRMED` registration before the workshop start time
- **THEN** status transitions to `CANCELLED` and `availableSeats` increments by 1

#### Scenario: Cannot cancel after workshop start
- **WHEN** a student attempts to cancel after `workshop.startDate` has passed
- **THEN** the system rejects the request with HTTP 422 and message "Workshop has already started"

---

### Requirement: Cron job reclaims expired pending seats
The system SHALL run a scheduled job every 5 minutes to transition `PENDING` registrations older than 10 minutes to `EXPIRED` and increment `availableSeats` accordingly.

#### Scenario: Pending registration expires
- **WHEN** a `PENDING` registration is older than 10 minutes
- **THEN** the cron job transitions it to `EXPIRED` and restores 1 seat to the workshop's `availableSeats`

#### Scenario: Confirmed registrations are not affected
- **WHEN** the cron job runs
- **THEN** registrations with status `CONFIRMED`, `CHECKED_IN`, or `CANCELLED` are not modified
