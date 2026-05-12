## ADDED Requirements

### Requirement: Async Notification Queue
Notifications must be processed asynchronously using a message queue to prevent blocking the main request flow.

#### Scenario: Queue notification job
- **WHEN** the NotificationService is called to send a message
- **THEN** it should push a job into the 'notification-queue' in Redis and return immediately.

### Requirement: Background Worker Processing
A background worker must listen to the notification queue and execute the delivery.

#### Scenario: Process job from queue
- **WHEN** a job is available in the queue
- **THEN** the background worker should pick it up and call the appropriate channels to send the notification.
