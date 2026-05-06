## Context

UniHub Workshop is a university-wide platform serving thousands of students who register for events and workshops. Currently, there is no structured registration or attendance-tracking flow. Organizers manage attendance manually (paper sign-in), which creates overbooking risks and produces unreliable attendance data.

The registration system must handle bursty traffic (up to 12,000 simultaneous registrations in 10 minutes), guarantee seat inventory accuracy, and support offline-tolerant check-in for venues with unreliable connectivity.

Key existing infrastructure:
- **NestJS** backend with Prisma ORM on PostgreSQL 15+
- **Redis 7+** already in use for caching
- **React Native** mobile app with offline-capable SQLite
- **ReactJS** admin web portal

## Goals / Non-Goals

**Goals:**
- Implement concurrency-safe seat reservation (zero overbooking guarantee)
- Provide QR code generation per confirmed registration
- Enable organizer QR scan check-in with offline queuing
- Expose real-time seat count via WebSocket
- Implement cron-based seat reclamation for stale `PENDING` registrations
- Provide admin workshop CRUD and attendance reporting

**Non-Goals:**
- Paid workshop payment processing (VNPay/Stripe) — deferred to a future change
- AI-generated PDF summaries of workshop content — separate change
- RabbitMQ-based async flows — avoided in favour of simpler cron + Redis approach to reduce operational complexity
- Push notification on check-in (can be layered on later)

## Decisions

### D1: Redis Distributed Lock for Seat Reservation

**Decision**: Use a Redis `SET NX EX` lock keyed on `workshop:<id>:seat-lock` to serialize concurrent seat decrement operations. Available seat count cached in Redis and persisted to PostgreSQL after decrement.

**Rationale**: Prevents race conditions without requiring PostgreSQL serializable transactions, which would create lock contention at scale. Redis can sustain ~100k ops/sec, comfortably handling the 12,000 req/10 min peak.

**Alternatives considered**:
- *PostgreSQL `SELECT FOR UPDATE`*: Would work but creates table-level hot spots under spike loads.
- *RabbitMQ queue*: Reliable but adds infra complexity; cron-based reclamation is sufficient for seat expiry.

---

### D2: Registration Status State Machine

**Decision**: Registrations follow a strict lifecycle enforced at the service layer:

```
PENDING ──(confirm)──► CONFIRMED ──(check-in)──► CHECKED_IN
   │                       │
   ▼ (expire/cancel)       ▼ (cancel)
EXPIRED                CANCELLED
```

Transitions are only allowed in the forward direction; no back-transitions.

**Rationale**: Clear lifecycle simplifies audit trails and prevents inconsistent states (e.g., checking in a cancelled registration).

---

### D3: QR Code Strategy

**Decision**: Generate a signed JWT payload (`{ registrationId, workshopId, studentId, exp }`) and encode it as a QR code image stored in object storage (or generated client-side on mobile). The scanner validates the JWT signature before marking attendance.

**Rationale**: JWT signing prevents QR forgery without a database lookup on every scan. Expiry (`exp`) limits replay attacks.

**Alternatives considered**:
- *Random UUID token stored in DB*: Requires a DB round-trip per scan — unacceptable under concurrent scan load.
- *Plain registration ID*: No tamper protection.

---

### D4: Cron-Based Seat Reclamation

**Decision**: A NestJS `@Cron` job runs every 5 minutes to find `PENDING` registrations older than 10 minutes and transitions them to `EXPIRED`, then increments Redis seat count.

**Rationale**: Simple, no additional infra. 5-minute cadence gives a worst-case 15-minute hold window (10 min TTL + 5 min cron lag) — acceptable for free workshops.

---

### D5: Offline Check-In Sync

**Decision**: Mobile check-in scanner stores scan events in SQLite when offline. On reconnection, a background sync job sends them to the server in a batch. Server uses `UPSERT` semantics — duplicate scans are idempotent.

**Rationale**: Venue WiFi can be unreliable. SQLite queue ensures no scans are lost.

---

### D6: Real-Time Seat Updates via WebSocket

**Decision**: NestJS WebSocket gateway emits `seat-count-updated` events on the workshop room whenever a seat is claimed or released. React Native and Web clients subscribe to the relevant room.

**Rationale**: Prevents stale seat counts displayed to users, reducing failed registrations caused by acting on outdated data.

## Risks / Trade-offs

- **Redis eviction** → If Redis restarts and seat-count keys are evicted, counts diverge from PostgreSQL. Mitigation: Redis AOF persistence enabled; on startup, re-seed seat counts from DB.
- **QR replay attacks** → A scanned QR can be captured and re-used before expiry. Mitigation: Mark registrations as `CHECKED_IN` atomically; subsequent scans return an "already checked in" error.
- **Cron delay window** → Seats held by expired `PENDING` registrations may appear unavailable for up to 15 minutes. Mitigation: Acceptable trade-off for free workshops; for high-demand events, organizers can manually trigger reclamation.
- **Batch sync conflicts** → Concurrent offline scans from multiple scanners may cause duplicate `CHECKED_IN` records. Mitigation: Unique constraint on `(registrationId, workshopId)` in `WorkshopCheckIn`; idempotent UPSERT.

## Migration Plan

1. Run Prisma migration to add `Workshop`, `WorkshopRegistration`, `WorkshopCheckIn` tables.
2. Seed Redis seat-count keys from existing `Workshop.availableSeats` values.
3. Deploy NestJS module behind a feature flag; enable per-environment.
4. Mobile: release new screens behind a remote config flag.
5. **Rollback**: Disable feature flag; Redis keys are ephemeral and can be dropped; DB tables can be archived.

## Open Questions

- Should `PENDING` TTL be configurable per workshop or system-wide? (Currently hardcoded to 10 min.)
- Is there a requirement to email students on registration confirmation? (Assumed out-of-scope for MVP.)
- For high-demand workshops, should a waitlist queue replace EXPIRED seats? (Deferred to v2.)
