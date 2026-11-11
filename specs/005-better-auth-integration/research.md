# Research: Better Auth & Multi-Tenant Organization Integration

**Feature**: `005-better-auth-integration`
**Date**: 2026-11-11
**Status**: Completed

## 1. Better Auth with Drizzle ORM on Cloudflare D1

### Context & Problem

WorshipFlow currently uses a custom PBKDF2 password hashing implementation and signed JWT session cookies via `jose`. We need to replace this with Better Auth (`better-auth`), a comprehensive, type-safe authentication library, while running inside Cloudflare Workers (`workerd`) backed by D1. Furthermore, we must add multi-tenant organization support and scope all songs, labels, and role assignments to an `organizationId`.

### Decision

- **Core Library**: `better-auth` (version 1.7+).
- **Drizzle Adapter**: `better-auth/adapters/drizzle` with SQLite provider.
- **Organization Plugin**: Better Auth's official `organization()` server plugin and `organizationClient()` client plugin.
- **Factory Pattern for Cloudflare D1**:
  Because Cloudflare D1 bindings are request-scoped (`env.DB`), we implement a cached factory function `getAuth(env: CloudflareEnv)` that instantiates Better Auth using the Drizzle instance created from `env.DB`.
- **Request Handler**:
  `src/app/api/auth/[...all]/route.ts` captures GET and POST requests and dispatches to `auth.handler(req)`.

---

## 2. Multi-Tenant Database Schema Design

### Context & Problem

We need to support organizations (churches, campuses, ministries) and link all musical assets (`songs`, `labels`, `roleAssignments`) to a specific organization.

### Decision

Better Auth requires the following tables:
1. `user`: Core user entity (`id`, `name`, `email`, `emailVerified`, `image`, `role`, `createdAt`, `updatedAt`).
2. `session`: Session records with `activeOrganizationId` column managed by the organization plugin.
3. `account`: Credentials (passwords) and OAuth providers.
4. `verification`: One-time verification tokens.
5. `organization`: Organization entities (`id`, `name`, `slug`, `logo`, `createdAt`, `metadata`).
6. `member`: Join table linking `user` to `organization` with organization roles (`owner`, `admin`, `member`).
7. `invitation`: Organization invitations.

Modifications to WorshipFlow Tables:
- `songs`: Added column `organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" })`.
- `labels`: Added column `organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" })`.
- `roleAssignments`: Inherits organization scope through `songs.organizationId`.

---

## 3. Session & Active Organization Context Flow

### Context & Problem

How does the server and client know which organization is active?

### Decision

- Better Auth's `organization()` plugin stores `activeOrganizationId` in the `session` record.
- When an authenticated user calls `authClient.organization.setActive({ organizationId })`, Better Auth updates the session in D1 and sets a session cookie.
- In Server Components (`src/app/page.tsx`, etc.), `getSession()` retrieves the active session including `session.activeOrganizationId`.
- If `activeOrganizationId` is not set (e.g. user has not selected one), the system defaults to the user's first organization or prompts them to create/select one.

---

## 4. Clean Architecture Preservation

### Principle I Compliance

- `src/core/domain`: Contains pure types: `Organization`, `OrganizationMember`, `User`, `Song`. 0 dependencies.
- `src/core/application`: Ports (`IOrganizationRepository`, `ISongRepository`) accept `organizationId`. Use cases enforce tenant isolation.
- `src/infrastructure/auth`: Houses `better-auth` configuration, Drizzle adapter, and plugins.
- `src/presentation`: Consumes auth via `authClient` on client and `getSession()` on server.
- Verified by automated gate: `bun run check:arch`.
