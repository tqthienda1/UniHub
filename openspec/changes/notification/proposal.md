## Why

Implement the extensible notification system designed in the technical blueprint. The system needs to support multiple communication channels (Email, etc.) while keeping the core business logic decoupled from specific delivery mechanisms. Async delivery is required to ensure that sending notifications does not block HTTP responses.

## What Changes

A new `NotificationModule` will be introduced in the backend. This module will follow the Strategy Pattern to allow easy addition of new channels. It will also integrate with Bull Queue for background processing.

## Capabilities

### New Capabilities
- `notification-core`: Core service and interface definition (`INotificationChannel`) using the Strategy Pattern.
- `email-channel`: Implementation of the email delivery channel using Nodemailer.
- `telegram-channel`: Implementation of the Telegram delivery channel using the Bot API.
- `notification-queue`: Integration with `@nestjs/bull` to handle notification delivery in background workers.

### Modified Capabilities
- `registration`: Update the registration flow to trigger notifications (e.g., confirmation email) upon successful registration.

## Impact

- **Backend**: New `notifications/` directory in `server/src`.
- **Infrastructure**: New Bull Queue named `notification-queue` in Redis.
- **Dependencies**: `@nestjs/bull`, `bull`, `nodemailer`, `telegraf` (or similar for Telegram).
