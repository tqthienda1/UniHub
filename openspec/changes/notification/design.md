## Context

UniHub currently lacks a unified way to send notifications to users. For example, when a student registers for a workshop, they should receive a confirmation email. The technical blueprint already specifies an extensible notification system using the Strategy Pattern and Bull Queue, but it hasn't been implemented yet.

## Goals / Non-Goals

**Goals:**
- Implement a centralized `NotificationService` that can be used across the application.
- Support multiple delivery channels (Email, Telegram) through a common interface.
- Ensure notification delivery is asynchronous and does not block the main application flow.
- Integrate with Bull Queue for robust job management and retries.

**Non-Goals:**
- Implementing real-time notifications via WebSockets (in-app notifications).
- Building complex message templates or marketing automation features.
- Support for SMS notifications in the initial version.

## Decisions

- **Strategy Pattern**: Define an `INotificationChannel` interface in the backend. Each delivery method (Email, Telegram) will implement this interface.
- **Bull Queue**: Use `@nestjs/bull` to manage notification jobs. The `NotificationService` will push jobs to the queue, and a dedicated worker will process them.
- **Nodemailer**: Use Nodemailer for the Email channel, allowing for easy configuration of SMTP or other mail services.
- **Async Delivery**: Decouple the `send` call from the actual delivery to improve API performance and reliability.

## Risks / Trade-offs

- **Infrastructure Complexity**: Adding Bull Queue increases the dependency on Redis. If Redis is unavailable, notifications will fail to queue.
- **Third-party Reliability**: Delivery depends on the uptime and rate limits of external services (Email providers, Telegram API).
- **Retry Logic**: Failed notifications need a clear retry strategy to avoid spamming or permanent loss of messages.
