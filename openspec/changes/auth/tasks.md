## 1. Database and Core Setup

- [x] 1.1 Define `User` model and `Role` enum in `prisma/schema.prisma`.
- [x] 1.2 Run Prisma migrations to update the database schema.
- [x] 1.3 Generate the updated Prisma client.
- [x] 1.4 Create the `Users` module, service, and controller in NestJS.

## 2. Backend Authentication Logic

- [x] 2.1 Install required dependencies: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`.
- [x] 2.2 Implement password hashing and verification in `UsersService` using Bcrypt.
- [x] 2.3 Create `AuthService` to handle login logic and JWT generation.
- [x] 2.4 Implement `JwtStrategy` and `JwtAuthGuard` for stateless authentication.
- [x] 2.5 Implement `RolesGuard` and a `@Roles()` decorator for RBAC.

## 3. Secure API Endpoints

- [x] 3.1 Apply `JwtAuthGuard` globally or to specific controllers (e.g., `WorkshopsController`).
- [x] 3.2 Add role-based protection to Instructor/Admin endpoints using the `RolesGuard`.
- [x] 3.3 Verify that unauthenticated requests to protected endpoints return 401/403 errors.

## 4. Frontend Auth Integration (ReactJS)

- [x] 4.1 Create Registration and Login components with form validation.
- [x] 4.2 Implement an `AuthContext` to manage user session and JWT storage (e.g., in localStorage or cookies).
- [x] 4.3 Create a `ProtectedRoute` component to gate access to authenticated-only pages.
- [x] 4.4 Update the navigation bar to show Login/Logout links based on auth state.

- [x] Update app.tsx to login or signin
- [x] Make router protected
EX: when user login -> redirect to home page, when user logout -> redirect to login page
- [x] Make a button from login page to register page

- [x] Implement the auth based on new design and rbac spec, the instructor change to check-in staff
- [x] Check-in staff only action is scan the qr of student for check in the workshop
- [x] Run and build client and server, fix the errors if any occur
- [x] Sync the local schema to supabase database    
- [x] make the MSSV is not unique in the database
- [x] sync the local schema to supabase database
