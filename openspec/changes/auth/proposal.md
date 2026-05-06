## Why

The UniHub Workshop system currently lacks a centralized authentication and authorization mechanism. Implementing a robust auth system is essential for securing sensitive endpoints, managing user roles (Student, Instructor, Admin), and personalizing the user experience as we scale.

## What Changes

- Implement a JWT-based authentication system in the NestJS backend.
- Create secure endpoints for user registration, login, and profile management.
- Implement Role-Based Access Control (RBAC) to distinguish between Students, Instructors, and Admins.
- **BREAKING**: Protect existing Workshop and AI Summary endpoints so they are only accessible to authenticated and authorized users.
- Update the ReactJS (Admin/Student) applications to include authentication flows and state management.

## Capabilities

### New Capabilities
- `user-auth`: Core authentication functionality including registration, login, and JWT issuance/validation.
- `rbac`: Role-based access control system to manage permissions across the application.

### Modified Capabilities
- `workshop-management`: Integrating authentication to restrict workshop creation to Instructors/Admins and viewing to registered Students.

## Impact

- **Backend (NestJS)**: Addition of `AuthModule` and `UsersModule`. Integration of Passport.js and JWT guards.
- **Database (PostgreSQL)**: Introduction of a `users` table linked to workshops and other entities.
- **Frontend (React)**: Implementation of authentication state management, protected route components, and login/register pages.
