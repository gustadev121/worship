# Implementation Plan: Better Auth & Multi-Tenant Organization Integration

**Branch**: `005-better-auth-integration` | **Date**: 2026-11-11 | **Spec**: [specs/005-better-auth-integration/spec.md](file:///home/gustadev121/Workspace/Non-Profit/cjn/worship/specs/005-better-auth-integration/spec.md)

**Input**: Feature specification from `specs/005-better-auth-integration/spec.md` with multi-tenant organization support.

## Summary

Migrate WorshipFlow's authentication layer to **Better Auth** (`better-auth`) with the official **Organization Plugin**, running on Cloudflare D1 via the Drizzle ORM SQLite adapter.
All music content (`songs`, `labels`, `roleAssignments`) will be linked to an `organizationId`, enforcing multi-tenant isolation across church teams and campuses. Users will be able to sign in with credentials (or social providers), belong to multiple organizations, and seamlessly switch active organizations from the top navigation bar.

## Technical Context

**Language/Version**: TypeScript 5.8+ on Bun runtime (ESNext)
**Primary Dependencies**: `better-auth` (v1.7+), `@better-auth/drizzle-adapter`, Drizzle ORM, React 19, Vinext
**Storage**: Cloudflare D1 via Drizzle ORM schemas (`user`, `session`, `account`, `verification`, `organization`, `member`, `invitation`, updated `songs` and `labels`)
**Testing**: Bun test runner (`bun test`) with Miniflare D1 database bindings
**Target Platform**: Cloudflare Workers edge runtime (`workerd`) for server, modern evergreen browsers for client
**Project Type**: Next.js / Vinext App Router Full-Stack Web Application (Clean Architecture)
**Performance Goals**: Session resolution in < 15ms; organization switching in < 300ms without re-authenticating
**Constraints**: Zero external dependencies in `src/core/domain`; Better Auth encapsulated inside `src/infrastructure/auth`; multi-tenant filters strictly enforced in application use cases
**Scale/Scope**: 7 auth/org tables in D1, updated song repositories, 1 new route handler (`/api/auth/[...all]`), 1 new layout component (`OrganizationSwitcher`)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                            | Compliance Assessment                                                                                                                                                                                                                                               | Status   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **I. Clean Architecture Purity**     | Better Auth and its adapter reside strictly in `src/infrastructure/auth/better-auth.ts` and `src/app/api/auth/`. Core layers (`src/core/domain` and `src/core/application`) import 0 external auth libraries and interact only through pure domain types and ports. | **PASS** |
| **II. Unified D1 Persistence**       | Better Auth uses Drizzle ORM configured exclusively for SQLite/D1 across development, test, and production. Zero schema or database engine drift.                                                                                                                   | **PASS** |
| **III. Edge-First Isolation**        | Better Auth edge-compatible bundle runs cleanly inside `workerd` without Node.js `fs`/`child_process` modules. Cloudflare D1 bindings are obtained via request env.                                                                                                 | **PASS** |
| **IV. Automated Architecture Gates** | Automated checks via `bun run check:arch`, `bun run check`, `bun test`, and `bun run build`.                                                                                                                                                                        | **PASS** |
| **V. Domain RBAC & Secure Identity** | Better Auth enforces password hashing, session expiration, and role assignments (`ADMIN`, `MEMBER`, `owner`, `admin`, `member`) verified in application use cases.                                                                                                  | **PASS** |

## Project Structure

### Documentation (this feature)

```text
specs/005-better-auth-integration/
├── spec.md              # Feature specification & requirements
├── checklists/
│   └── requirements.md  # 16/16 requirements completeness checks
├── plan.md              # Implementation plan (this file)
├── research.md          # Technical research & Better Auth D1 integration
├── data-model.md        # Drizzle schema for Better Auth & Organizations
├── quickstart.md        # Step-by-step testable validation scenarios
├── contracts/
│   └── auth-and-organization.md # HTTP endpoints & application ports
└── tasks.md             # Generated in next phase (/speckit-tasks)
```

### Source Code Impact

```text
src/
├── core/
│   ├── domain/
│   │   └── organization.ts           # Pure domain Organization & Member entities (NEW)
│   └── application/
│       └── ports.ts                  # Extended SessionPayload & SongFilter with organizationId (MODIFIED)
├── infrastructure/
│   ├── auth/
│   │   ├── better-auth.ts            # Better Auth server instance & D1 adapter factory (NEW)
│   │   └── auth-client.ts            # Better Auth client for React components (NEW)
│   ├── db/
│   │   ├── schema.ts                 # Added auth/org tables & songs.organizationId (MODIFIED)
│   │   └── client.ts                 # Database migrations & client bindings (MODIFIED)
│   └── repositories/
│       ├── drizzle-song-repository.ts # Enforce organizationId filtering on queries (MODIFIED)
│       └── drizzle-organization-repository.ts # Organization repository implementation (NEW)
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts          # Better Auth universal handler endpoint (NEW)
│   ├── layout.tsx                    # Multi-tenant session resolution & provider (MODIFIED)
│   └── page.tsx                      # Catalog scoped to active organization (MODIFIED)
├── presentation/
│   ├── auth.ts                       # Server session adapter using Better Auth getSession (MODIFIED)
│   └── components/
│       └── layout/
│           ├── navbar.tsx            # Integrated OrganizationSwitcher in header (MODIFIED)
│           └── organization-switcher.tsx # Dropdown component for active organization (NEW)
└── scripts/
    └── seed.ts                       # Seed default organization & link default songs (MODIFIED)

tests/
└── integration/
    └── auth-organization.test.ts     # End-to-end integration tests on D1 (NEW)
```

## Phases

### Phase 0: Outline & Research

- Evaluated Better Auth 1.7+ with Drizzle SQLite adapter against Cloudflare Workers D1.
- Validated `organization()` plugin schema and session context injection.
- Defined multi-tenant scoping strategy for songs and labels.
- Output: [`specs/005-better-auth-integration/research.md`](file:///home/gustadev121/Workspace/Non-Profit/cjn/worship/specs/005-better-auth-integration/research.md)

### Phase 1: Design & Contracts

- Defined complete Drizzle schema with 7 Better Auth/Organization tables and foreign keys in `data-model.md`.
- Specified API routes and Application layer ports in `contracts/auth-and-organization.md`.
- Authored runnable quickstart guide in `quickstart.md`.
- Validated Constitution compliance (Gates I through V passed).
