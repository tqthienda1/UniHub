## Why

UniHub currently has no mechanism for students to register for workshops or for organizers to track attendance in real time. Without a structured registration flow and a reliable check-in method, seat overbooking is likely and attendance data is lost. Adding a QR-based check-in system enables accurate, offline-capable attendance tracking and closes the loop between registration and actual participation.

## What Changes

- **New**: Student-facing workshop discovery and registration flow (browse, register, cancel).
- **New**: QR code generation tied to each confirmed registration, stored per-student.
- **New**: Organizer/staff check-in scanner interface that validates and marks attendance via QR scan.
- **New**: Concurrency-safe seat reservation using Redis-backed distributed lock to prevent overbooking under traffic spikes (up to 12,000 concurrent users).
- **New**: Registration status lifecycle (`PENDING` → `CONFIRMED` → `CHECKED_IN` / `CANCELLED` / `EXPIRED`).
- **New**: Cron-job based seat reclamation: releases seats held in `PENDING` state that exceed the reservation window.
- **New**: Real-time seat-count updates pushed to connected clients via WebSocket.
- **New**: Admin workshop management (create, edit, cancel workshops; view registrations and attendance).

## Capabilities

### New Capabilities

- `workshop-catalog`: Browse, search, and filter published workshops with real-time seat availability.
- `workshop-registration`: Register for a workshop, with Redis-protected seat claiming, registration lifecycle management, and cron-based seat reclamation.
- `qr-checkin`: Generate per-registration QR codes and provide a scanner interface for organizers to validate and record attendance, with offline-tolerant design.
- `workshop-admin`: Admin/organizer CRUD for workshops, capacity management, registration export, and attendance dashboard.

### Modified Capabilities

*(none — no existing specs require changes)*

## Impact

- **Database**: New Prisma models — `Workshop`, `WorkshopRegistration`, `WorkshopCheckIn`; migrations required.
- **Backend API**: New NestJS module `workshops` with REST endpoints for catalog, registration, and check-in; WebSocket gateway for live seat counts.
- **Redis**: Distributed locks for seat reservation; cached seat-count counters per workshop.
- **Cron Jobs**: Node.js worker (or NestJS scheduler) to expire `PENDING` registrations and reclaim seats.
- **Mobile**: New screens for workshop list, detail, registration confirmation, and QR code display.
- **Web (Admin)**: New admin pages for workshop creation, registration management, and check-in dashboard.
- **Dependencies**: `qrcode` / `react-native-qrcode-svg` for QR generation; `react-native-camera` or `expo-camera` for scanning.
