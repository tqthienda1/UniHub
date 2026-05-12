## ADDED Requirements

### Requirement: Trigger Notification on Registration
The registration process must trigger a notification to the student upon successful registration.

#### Scenario: Send confirmation email after registration
- **WHEN** a student successfully registers for a workshop
- **THEN** the system should trigger a 'registration-confirmed' notification to be sent via the NotificationService.
