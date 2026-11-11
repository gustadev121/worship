# Feature Specification: Better Auth Authentication & Session Management Integration

**Feature Branch**: `005-better-auth-integration`

**Created**: 2026-11-11

**Status**: Draft

**Input**: User description: "preparar para implementar better auth como autenticador en WorshipFlow"

## User Scenarios & Testing

### User Story 1 - Credentials Authentication & Unified Session Management (Priority: P1) 🎯 MVP

As a church worship leader or team volunteer, I want to securely log in to WorshipFlow using my email/username and password via Better Auth, so that my active session is reliably verified across pages and API routes with zero session drift.

**Why this priority**: Core security foundation. Replaces the hand-rolled PBKDF2/JWT verification loop with Better Auth's standard, hardened session engine while preserving existing user accounts, roles (`ADMIN`, `MEMBER`), and D1 database integrity.

**Independent Test**: Seed a user with email and password; perform login via `/api/auth/sign-in/email` or Better Auth client; verify that a valid session token is created in the D1 `session` table, protected routes (`/`, `/songs/new`, `/admin/*`) authenticate properly, and `ADMIN`/`MEMBER` permissions are enforced.

**Acceptance Scenarios**:

1. **Given** valid registered credentials, **When** the user submits the login form, **Then** Better Auth authenticates the user, generates a secure session cookie, and redirects them to the catalog (`/`).
2. **Given** invalid or mistyped credentials, **When** submitting login, **Then** an error message is returned with 401 status and no session cookie is set.
3. **Given** an authenticated user with role `ADMIN`, **When** accessing `/songs/new`, `/admin/users`, or `/admin/labels`, **Then** access is granted.
4. **Given** an authenticated user with role `MEMBER`, **When** attempting to access admin management routes or mutate songs, **Then** access is denied with 403 Forbidden.
5. **Given** an active session, **When** the user clicks "Cerrar sesión" (logout), **Then** the session is revoked in the database, the session cookie is cleared, and the user is redirected to `/login`.

---

### User Story 2 - Google OAuth & Social Authentication (Priority: P2)

As a worship team member, I want the option to log in using my Google account in 1 click, so that I don't have to remember another church password on my phone or tablet during Sunday services.

**Why this priority**: High convenience for church volunteers who rehearse on mobile and tablet devices.

**Independent Test**: Configure Google OAuth credentials; trigger social login flow; verify that a new user record or linked account is established and the user is signed in with a valid session.

**Acceptance Scenarios**:

1. **Given** a user on the login screen, **When** clicking "Continuar con Google", **Then** the browser initiates the OAuth authorization flow.
2. **Given** an existing user whose email matches the Google account, **When** completing OAuth, **Then** Better Auth links the Google account to the existing user record without duplicating identities.
3. **Given** a new user completing Google OAuth for the first time, **When** account is created, **Then** they are assigned the default `MEMBER` role.

---

### User Story 3 - Self-Service User Profile & Session Security (Priority: P3)

As a worship volunteer or administrator, I want to view my profile details, update my display name, manage active sessions, or change my password safely.

**Why this priority**: Enhances self-service capabilities and provides audit visibility into active sessions across multiple devices (tablet on stage, laptop at home).

**Independent Test**: From user settings, trigger password change; verify old password is required and updated hash is verified on subsequent logins.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** changing password with the correct current password, **Then** the password updates and existing sessions on other devices can optionally be revoked.
2. **Given** an administrator in `/admin/users`, **When** viewing the team roster, **Then** user roles (`ADMIN` vs `MEMBER`) and verification statuses can be inspected and updated.

---

### Edge Cases

- **Database Schema Migration**: Existing users in the `users` table must be seamlessly migrated to Better Auth's schema (`user`, `session`, `account`, `verification`) without breaking existing role assignments or foreign keys (`role_assignments.userId`).
- **Cloudflare D1 & Worker Environment**: Better Auth must initialize using the Drizzle SQLite adapter against the active Cloudflare D1 binding, working cleanly within `workerd` edge constraints without Node.js filesystem dependencies.
- **Session Expiration & Clock Skew**: Expired sessions must be cleanly purged or rejected, triggering automatic redirect to `/login`.
- **Clean Architecture Boundary**: Better Auth server instance and routes belong to `src/infrastructure/auth/better-auth.ts` and `src/app/api/auth/[...all]/route.ts`. The pure domain in `src/core/domain` and `src/core/application` must consume auth only through defined ports/interfaces, keeping core layers 100% pure.

## Requirements

### Functional Requirements

- **FR-001**: System MUST integrate Better Auth (`better-auth`) with Drizzle ORM SQLite adapter targeting Cloudflare D1.
- **FR-002**: System MUST support email/password authentication with secure password hashing.
- **FR-003**: System MUST provide the standard Better Auth handler route at `src/app/api/auth/[...all]/route.ts`.
- **FR-004**: System MUST maintain strict RBAC (`ADMIN` and `MEMBER` roles) embedded in the user record and session payload.
- **FR-005**: System MUST provide a client-side auth client (`createAuthClient`) for reactive UI state (`useSession`, `signIn`, `signOut`).
- **FR-006**: System MUST verify server-side sessions in React Server Components via `auth.api.getSession`.
- **FR-007**: Existing user role assignments (`roleAssignments`) in D1 MUST preserve foreign key referential integrity with the Better Auth user table.
- **FR-008**: System MUST support environment-based configuration of auth secret (`BETTER_AUTH_SECRET`), base URL (`BETTER_AUTH_URL`), and optional OAuth client IDs.

### Key Entities

- **User**: Core identity entity (`id`, `name`, `email`, `role`, `emailVerified`, `image`, `createdAt`, `updatedAt`).
- **Session**: Active session state (`id`, `userId`, `token`, `expiresAt`, `ipAddress`, `userAgent`, `createdAt`, `updatedAt`).
- **Account**: Linked credentials and OAuth providers (`id`, `userId`, `providerId`, `accountId`, `password`, `createdAt`, `updatedAt`).
- **Verification**: Temporary tokens for email verification or password reset (`id`, `identifier`, `value`, `expiresAt`, `createdAt`, `updatedAt`).

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of authentication operations (login, session lookup, logout) complete in < 150ms on Cloudflare D1.
- **SC-002**: Clean Architecture verification (`bun run check:arch`) passes with 0 violations (no Better Auth imports in `src/core/domain` or `src/core/application`).
- **SC-003**: Zero regressions across existing features: all catalog, rehearsal live sync, chord importer, and roadmap tests continue to pass 100%.
- **SC-004**: Production build (`bun run build`) compiles cleanly without bundle or edge runtime issues.

## Assumptions

- Better Auth 1.7+ SQLite/Drizzle adapter is fully compatible with Cloudflare D1 and `workerd`.
- Passwords for newly created users will be hashed and verified via Better Auth's internal secure hashing.
- Existing seeded users (`admin@worshipflow.local` / `volunteer@worshipflow.local`) will be re-seeded or migrated to the new schema tables.
