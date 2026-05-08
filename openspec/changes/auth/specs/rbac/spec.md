## ADDED Requirements

### Requirement: Role-Based Access Control (RBAC)
The system SHALL restrict access to specific API endpoints based on the authenticated user's role (Admin, Check-in Staff, Student).

#### Scenario: Authorized Admin Action
- **WHEN** an authenticated user with the 'Admin' role attempts to access an admin-only endpoint
- **THEN** the system SHALL permit the operation.

#### Scenario: Unauthorized Student Action
- **WHEN** an authenticated user with the 'Student' role attempts to access an endpoint restricted to 'Check-in staff' or 'Admins'
- **THEN** the system SHALL return a 403 Forbidden error.

### Requirement: Default Role Assignment
The system SHALL assign the 'Student' role by default to all newly registered users unless otherwise specified by an Admin.

#### Scenario: New User Default Role
- **WHEN** a new user registers through the public registration endpoint
- **THEN** the system SHALL assign them the 'Student' role.
