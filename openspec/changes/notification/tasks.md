## 1. Foundation & Interface

- [x] 1.1 Create `NotificationModule` in `server/src/notifications`.
- [x] 1.2 Define `INotificationChannel` interface with a `send(recipient: string, payload: any): Promise<void>` method.
- [x] 1.3 Implement the base `NotificationService` that manages a list of registered channels.
- [x] 1.4 Create DTOs and types for notification payloads.

## 2. Channel Implementations

- [x] 2.1 Implement `EmailChannel` using `nodemailer`.
- [x] 2.2 Ensure the email channel is properly registered and injected into the `NotificationService`.
- [x] 2.3 Add configuration validation for SMTP credentials.

## 3. Queue Integration

- [x] 3.1 Configure `@nestjs/bull` in the `NotificationModule`.
- [x] 3.2 Create the `notification-queue` and define job names.
- [x] 3.3 Implement the `NotificationProcessor` to consume jobs from the queue and call the `NotificationService`.
- [x] 3.4 Update `NotificationService` to push notification requests into the Bull Queue instead of executing them directly.

## 4. Integration & Testing

- [x] 4.1 Inject `NotificationService` into the `WorkshopsService` or wherever the registration logic resides.
- [x] 4.2 Trigger a registration confirmation notification upon successful workshop registration.
- [x] 4.3 Add necessary environment variables to `.env` and `ConfigModule`.
- [x] 4.4 Verify that notifications are correctly queued in Redis and delivered via the worker.

- [x] Run and build server again it occurs error