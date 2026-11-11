# Feature Specification: Better Auth Authentication & Multi-Tenant Organization Integration

**Feature Branch**: `005-better-auth-integration`

**Created**: 2026-11-11

**Status**: Draft

**Input**: User description: "implementar better auth como autenticador, agregar soporte para organizaciones y vincular el contenido musical (canciones, etiquetas, asignaciones) a las organizaciones"

## User Scenarios & Testing

### User Story 1 - Credentials Authentication & Unified Session Management (Priority: P1) 🎯 MVP

As a church worship leader or team volunteer, I want to securely log in to WorshipFlow using my email/username and password via Better Auth, so that my active session is reliably verified across pages and API routes with zero session drift.

**Why this priority**: Core security foundation. Replaces hand-rolled PBKDF2/JWT verification with Better Auth's hardened session engine while preserving existing user accounts, roles (`ADMIN`, `MEMBER`), and D1 database integrity.

**Independent Test**: Seed a user with email and password; perform login via `/api/auth/sign-in/email` or Better Auth client; verify that a valid session token is created in the D1 `session` table, protected routes (`/`, `/songs/new`, `/admin/*`) authenticate properly, and `ADMIN`/`MEMBER` permissions are enforced.

**Acceptance Scenarios**:

1. **Given** valid registered credentials, **When** submitting the login form, **Then** Better Auth authenticates the user, generates a secure session cookie, and redirects them to the catalog (`/`).
2. **Given** invalid or mistyped credentials, **When** submitting login, **Then** an error message is returned with 401 status and no session cookie is set.
3. **Given** an authenticated user with role `ADMIN`, **When** accessing `/songs/new`, `/admin/users`, or `/admin/labels`, **Then** access is granted.
4. **Given** an authenticated user with role `MEMBER`, **When** attempting to access admin management routes or mutate songs, **Then** access is denied with 403 Forbidden.
5. **Given** an active session, **When** the user clicks "Cerrar sesión" (logout), **Then** the session is revoked in the database, the session cookie is cleared, and the user is redirected to `/login`.

---

### User Story 2 - Multi-Tenant Organization Support & Scoped Music Content (Priority: P2)

As a worship leader managing one or more church campuses or ministries (e.g. "Iglesia Central", "Ministerio Juvenil"), I want my songs, chord sheets, labels, and rehearsal role assignments scoped strictly to my active organization, so that each church team manages their own repertory independently without data collision.

**Why this priority**: Multi-tenancy is essential for churches with multiple campuses, youth teams, or church plants using the platform simultaneously.

**Independent Test**: Create two organizations (Org A and Org B); add songs to Org A; switch active organization to Org B; verify that Org B catalog is empty and cannot access Org A songs; switch back to Org A and verify all songs remain intact.

**Acceptance Scenarios**:

1. **Given** an authenticated user belonging to an organization, **When** viewing the catalog (`/`), **Then** only songs and labels belonging to the active `organizationId` are displayed.
2. **Given** a user creating a new song or label, **When** saved, **Then** the record is tagged with the current active `organizationId`.
3. **Given** a user with membership in multiple organizations, **When** switching active organization via the organization switcher in the navbar, **Then** the session updates and the view immediately refreshes to the selected organization's content.
4. **Given** a user attempting to query or edit a song by ID belonging to another organization, **Then** the system returns 404 Not Found or 403 Forbidden.

---

### User Story 3 - Organization Management & Member Invitations (Priority: P3)

As an organization administrator (`owner` or `admin`), I want to invite team volunteers via email, assign organization roles, or create new organizations.

**Why this priority**: Enables frictionless onboarding of new musicians and volunteers into specific church teams.

**Independent Test**: As an org admin, send an invite to an email address; verify an invitation record is created in the `invitation` table; accept invite; verify user joins the organization with assigned role.

**Acceptance Scenarios**:

1. **Given** an org admin, **When** inviting a volunteer by email with role `member`, **Then** an invitation record is created with an expiration window.
2. **Given** a user accepting an invitation, **When** confirmed, **Then** a `member` record links the user to the organization.
3. **Given** an authorized user, **When** creating a new organization (e.g. "Nueva Sede"), **Then** the organization is provisioned and the creator is assigned as `owner`.

---

### User Story 4 - Google OAuth & Social Authentication (Priority: P4)

As a worship team volunteer, I want the option to log in using my Google account in 1 click, so that I don't have to remember passwords on my phone or tablet during Sunday rehearsals.

**Why this priority**: High convenience for mobile/tablet musicians.

**Independent Test**: Trigger Google OAuth; verify linked account is created in `account` table and user signs in with a valid session.

**Acceptance Scenarios**:

1. **Given** a user on `/login`, **When** clicking "Continuar con Google", **Then** the browser initiates OAuth flow.
2. **Given** an existing user whose email matches the Google account, **When** completing OAuth, **Then** Better Auth links the Google account without creating a duplicate user.

---

### Edge Cases

- **Schema Migration & Backwards Compatibility**: Existing `songs`, `labels`, and `roleAssignments` in Cloudflare D1 must be associated with a default organization (`organizationId`) so existing seed data and catalog remain fully functional.
- **Edge Runtime Compatibility**: Better Auth and its Organization plugin must run cleanly within Cloudflare Workers `workerd` using Drizzle ORM SQLite adapter.
- **Organization Deletion & Cascade**: Deleting an organization must cascade or cleanly handle associated songs, labels, and role assignments without orphaned database rows.
- **Clean Architecture Boundaries**: Better Auth plugins and handlers live in `src/infrastructure/auth/` and `src/app/api/auth/`. The Application use cases (`ListSongs`, `CreateSong`, etc.) receive `organizationId` from the authenticated session context, keeping `src/core/domain` pure and decoupled from Better Auth.

## Requirements

### Functional Requirements

- **FR-001**: System MUST integrate Better Auth (`better-auth`) with Drizzle ORM SQLite adapter targeting Cloudflare D1.
- **FR-002**: System MUST enable the official Better Auth Organization plugin (`organization()`) supporting multi-tenancy.
- **FR-003**: System MUST define database tables for `user`, `session`, `account`, `verification`, `organization`, `member`, and `invitation` in `src/infrastructure/db/schema.ts`.
- **FR-004**: System MUST add `organizationId` foreign key to `songs` and `labels` tables, scoping all music content to the active organization.
- **FR-005**: System MUST provide the standard Better Auth handler route at `src/app/api/auth/[...all]/route.ts`.
- **FR-006**: System MUST provide an Organization Switcher component in the navigation shell allowing users to switch active organizations.
- **FR-007**: Application layer ports and use cases MUST accept `organizationId` in filters and mutations to enforce multi-tenant isolation.
- **FR-008**: System MUST support email/password authentication and optional Google OAuth social login.
- **FR-009**: Database seeds MUST provision a default organization ("WorshipFlow Central") linked to seeded users and catalog.

### Key Entities

- **Organization**: Church campus or worship team (`id`, `name`, `slug`, `logo`, `createdAt`, `metadata`).
- **Member**: User membership within an organization (`id`, `organizationId`, `userId`, `role`, `createdAt`).
- **Invitation**: Pending invite (`id`, `organizationId`, `email`, `role`, `status`, `expiresAt`, `inviterId`).
- **User**: Identity entity (`id`, `name`, `email`, `role`, `emailVerified`, `image`, `createdAt`, `updatedAt`).
- **Song / Label / RoleAssignment**: Music entities now carrying `organizationId` to ensure complete tenant partitioning.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of music queries (songs, labels, role assignments) strictly filter by the active session's `organizationId`.
- **SC-002**: Switching active organizations updates the UI catalog in < 300ms without full page re-authentication.
- **SC-003**: Clean Architecture verification (`bun run check:arch`) passes with 0 violations.
- **SC-004**: 100% test pass rate across existing unit and integration test suites, with new multi-tenant organization test coverage.
- **SC-005**: Production build (`bun run build`) compiles cleanly on Cloudflare Workers edge runtime.

## Assumptions

- Better Auth Organization plugin is compatible with SQLite/D1 via Drizzle adapter.
- Existing single-tenant songs and labels will be migrated to the default organization during schema initialization.
- An authenticated user without an organization will be prompted to create or join one before creating songs.
