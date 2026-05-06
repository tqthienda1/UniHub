## 1. Database Schema

- [x] 1.1 Create Prisma models: `Workshop`, `WorkshopRegistration`, `WorkshopCheckIn`
- [x] 1.2 Add status enums: `WorkshopStatus` (DRAFT, PUBLISHED, CANCELLED), `RegistrationStatus` (CONFIRMED, CHECKED_IN, CANCELLED, EXPIRED)
- [x] 1.3 Add unique constraint on `WorkshopCheckIn(registrationId)` to enforce idempotent check-in
- [x] 1.4 Run `prisma migrate dev` and verify migration applies cleanly
- [x] 1.5 Seed Redis `workshop:<id>:seats` counter from `Workshop.availableSeats` on server startup


## 2. NestJS Workshops Module — Backend Foundation

- [x] 2.1 Scaffold `WorkshopsModule` with controller, service, and repository files
- [x] 2.2 Register module in `AppModule`; inject `PrismaService` and `RedisService`
- [x] 2.3 Implement `WorkshopRepository`: CRUD operations on `Workshop` and `WorkshopRegistration` via Prisma
- [x] 2.4 Implement seat-count helper: `getAvailableSeats(workshopId)` from Redis with DB fallback


## 3. Workshop Catalog API

- [x] 3.1 Implement `GET /workshops` — paginated, filterable by keyword, category, date range, availability
- [x] 3.2 Implement `GET /workshops/:id` — full workshop detail including real-time `availableSeats` from Redis
- [x] 3.3 Add guards: catalog endpoints are public (no auth required)
- [x] 3.4 Write integration tests for catalog filtering logic


## 4. Workshop Registration API

- [x] 4.1 Implement `POST /workshops/:id/register` with Redis distributed lock (`SET NX EX 5s`) to serialize seat claims
- [x] 4.2 Decrement Redis seat counter atomically on successful registration; persist to DB
- [x] 4.3 Enforce duplicate-registration guard (student already has active registration)
- [x] 4.4 Implement `DELETE /workshops/:id/registrations/:regId` — cancel registration, increment Redis seat counter
- [x] 4.5 Add state-machine validation on status transitions (CONFIRMED → CANCELLED only if pre-start)
- [x] 4.6 Implement `GET /workshops/:id/my-registration` — return current student's registration and QR token
- [x] 4.7 Write unit tests for concurrent registration race condition scenario


## 5. Cron-Based Seat Reclamation

- [x] 5.1 Install `@nestjs/schedule`; add `ScheduleModule.forRoot()` to `AppModule`
- [x] 5.2 Implement cron task (`@Cron` every 5 min): find `PENDING` registrations older than 10 min
- [x] 5.3 Batch-transition stale `PENDING` registrations to `EXPIRED`; increment Redis seat counter per reclaimed seat
- [x] 5.4 Add logging for each reclamation run (count expired, workshops affected)
- [x] 5.5 Write unit tests for cron reclamation logic


## 6. QR Code Generation

- [x] 6.1 Install `jsonwebtoken`; configure `QR_JWT_SECRET` in environment config
- [x] 6.2 Implement `QrService.generate(registration)`: sign JWT `{ registrationId, workshopId, studentId, exp: +24h }` and return payload string
- [x] 6.3 Expose QR token via `GET /workshops/:id/my-registration` response field
- [x] 6.4 Write unit tests: verify token signature, expiry field, uniqueness per registration


## 7. QR Check-In API

- [x] 7.1 Implement `POST /workshops/:id/checkin` — accept JWT string in request body
- [x] 7.2 Validate JWT signature and expiry; return 401 on failure
- [x] 7.3 Transition registration to `CHECKED_IN` and insert `WorkshopCheckIn` record atomically (Prisma transaction)
- [x] 7.4 Return 409 if registration already `CHECKED_IN` (idempotency guard)
- [x] 7.5 Protect endpoint with `ORGANIZER` or `ADMIN` role guard
- [x] 7.6 Write integration tests for all check-in scenarios (success, duplicate, tampered, expired)


## 8. WebSocket Gateway — Real-Time Seat Updates

- [x] 8.1 Create `WorkshopsGateway` with `@WebSocketGateway`; add to `WorkshopsModule`
- [x] 8.2 On seat count change (registration or cancellation), emit `seat-count-updated` event to room `workshop:<id>`
- [x] 8.3 Handle client subscription via `subscribe-workshop` event; join/leave room accordingly
- [x] 8.4 Write smoke test: simulate registration and verify event emitted


## 9. Workshop Admin API

- [x] 9.1 Implement `POST /admin/workshops` — create workshop (status defaults to DRAFT)
- [x] 9.2 Implement `PATCH /admin/workshops/:id` — update fields; validate capacity ≥ active registration count
- [x] 9.3 Implement `PATCH /admin/workshops/:id/publish` — transition DRAFT → PUBLISHED; seed Redis seat counter
- [x] 9.4 Implement `DELETE /admin/workshops/:id` — cancel workshop; mass-cancel active registrations
- [x] 9.5 Implement `GET /admin/workshops/:id/registrations` — paginated, filterable by status
- [x] 9.6 Implement `GET /admin/workshops/:id/registrations/export` — stream CSV response
- [x] 9.7 Protect all admin endpoints with `ADMIN` or `ORGANIZER` role guard
- [x] 9.8 Write integration tests for cancel-workshop cascade


## 10. Mobile App — Workshop Catalog & Registration Screens

- [x] 10.1 Create `WorkshopListScreen`: paginated list with search bar and filter chips (category, available only)
- [x] 10.2 Create `WorkshopDetailScreen`: full detail view with real-time seat count via WebSocket subscription
- [x] 10.3 Implement "Register" button with optimistic UI; handle 409 conflicts gracefully
- [x] 10.4 Create `MyRegistrationsScreen`: list of active student registrations with status badges
- [x] 10.5 Create `QrCodeScreen`: render QR code from JWT token using `react-native-qrcode-svg`
- [x] 10.6 Implement cancel registration action with confirmation dialog


## 11. Mobile App — Organizer QR Scanner

- [x] 11.1 Create `QrScannerScreen` (role-gated to ORGANIZER/ADMIN) using `expo-camera` or `react-native-camera`
- [x] 11.2 On successful scan, call `POST /workshops/:id/checkin`; display success/error toast

- [ ] 11.3 Implement offline queue: persist scan events to SQLite when network unavailable
- [ ] 11.4 Implement background sync: on reconnect, flush SQLite queue in batch; mark synced/failed
- [ ] 11.5 Show pending sync count badge on scanner screen when offline queue is non-empty

## 12. Admin Web Portal — Workshop Management

- [x] 12.1 Create `WorkshopsAdminPage`: table of all workshops with status filters and "Create Workshop" CTA
- [x] 12.2 Create `WorkshopFormModal`: controlled form for create/edit with field validation

- [x] 12.3 Create `WorkshopDetailAdminPage`: registration list with status filter, check-in count, and CSV export button

- [x] 12.4 Implement publish/cancel workshop actions with confirmation dialogs
- [x] 12.5 Add role guard: hide admin pages from non-admin users


## 13. End-to-End Verification

- [ ] 13.1 Manual test: register 2 concurrent users for 1-seat workshop; verify exactly 1 succeeds
- [ ] 13.2 Manual test: scan QR on mobile; verify registration transitions to CHECKED_IN
- [ ] 13.3 Manual test: scan same QR twice; verify second scan returns 409
- [ ] 13.4 Manual test: take scanner offline, scan QR, reconnect; verify sync and CHECKED_IN status
- [ ] 13.5 Verify Redis seat counter stays consistent with DB after cron reclamation run
