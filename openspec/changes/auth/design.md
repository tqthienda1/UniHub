## Context

UniHub currently operates without an authentication layer. All users have equal access to endpoints, which is a major security risk as we prepare for production deployment. We need a centralized authentication service in our NestJS modular monolith to manage users and secure our APIs.

## Goals / Non-Goals

**Goals:**
- Implement JWT-based authentication for both Web and Mobile clients.
- Provide a clear separation of roles: Admin, Instructor, Student.
- Secure sensitive API endpoints (Workshops, AI Summaries).
- Ensure secure password storage using strong hashing algorithms.

**Non-Goals:**
- External OAuth provider integration (e.g., Google/Facebook) is deferred to a future phase.
- Multi-factor authentication (MFA) is out of scope.
- Email verification and password recovery flows are deferred.

## Decisions

- **JWT for Authentication**: We will use stateless JSON Web Tokens (JWT) for authentication. This allows for scalability and easy integration with our multiple clients (ReactJS and React Native).
- **Bcrypt for Hashing**: We will use Bcrypt to hash passwords before storing them in PostgreSQL.
- **NestJS Passport**: We will leverage `@nestjs/passport` and `passport-jwt` for standard, robust authentication logic in NestJS.
- **Unified User Table**: All users will be stored in a single `User` table in the database, with a `role` enum field to manage permissions.

## Risks / Trade-offs

- **[Risk] JWT exposure** → **[Mitigation]**: Implement short-lived access tokens and ensure all communications happen over HTTPS.
- **[Risk] Increased latency per request** → **[Mitigation]**: Ensure efficient JWT validation logic and use Redis if token revocation becomes necessary in the future.
