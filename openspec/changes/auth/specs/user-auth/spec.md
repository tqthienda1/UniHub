## ADDED Requirements

### Requirement: User Registration
The system SHALL provide an endpoint for new users to register by providing their email, password, and full name.

#### Scenario: Successful Registration
- **WHEN** a user submits valid registration details (unique email, strong password)
- **THEN** the system SHALL create a new user record with a hashed password and return a success message.

### Requirement: User Login
The system SHALL provide an endpoint for users to log in using their email and password.

#### Scenario: Successful Login
- **WHEN** a user submits valid credentials
- **THEN** the system SHALL return a JWT access token valid for a configurable duration.

### Requirement: JWT Authentication Guard
The system SHALL implement a mechanism to validate JWTs provided in the Authorization header of incoming requests.

#### Scenario: Access Protected Route with Valid Token
- **WHEN** a request is made to a protected endpoint with a valid JWT
- **THEN** the system SHALL allow the request to proceed and attach the user payload to the request object.

#### Scenario: Access Protected Route with Invalid Token
- **WHEN** a request is made to a protected endpoint with an invalid or expired JWT
- **THEN** the system SHALL return a 401 Unauthorized error.
