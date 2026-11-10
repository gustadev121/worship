<!--
# Sync Impact Report
- Version Change: 0.0.0 -> 1.0.0
- Modified Principles:
  - [PRINCIPLE_1_NAME] -> I. Strict 4-Layer Clean Architecture & Core Purity
  - [PRINCIPLE_2_NAME] -> II. Unified D1 Persistence (Zero Database Drift)
  - [PRINCIPLE_3_NAME] -> III. Edge-First & Serverless Runtime Isolation
  - [PRINCIPLE_4_NAME] -> IV. Automated Architecture Gates & Test-Driven Verification
  - [PRINCIPLE_5_NAME] -> V. Domain RBAC & Secure Identity
- Added Sections:
  - Technical Constraints & Security Standards
  - Development Workflow & Quality Gates
- Removed Sections: None
- Deferred TODOs: None
-->

# WorshipFlow Constitution

## Core Principles

### I. Strict 4-Layer Clean Architecture & Core Purity

The codebase MUST enforce a strict unidirectional dependency hierarchy: Presentation/App → Infrastructure → Application → Domain.
- `src/core/domain` MUST remain completely pure with zero external dependencies (not even Zod, Node.js, or Bun packages). It contains only pure TypeScript types, interfaces, entities, value objects, and deterministic business rules.
- `src/core/application` MUST only import from `../domain` and `zod`. It contains use cases, port interfaces (repositories, services), and input validation schemas.
- Infrastructure and Presentation modules MUST NEVER leak into core layers.
- Architecture integrity MUST be verified by automated CI checks (`bun run check:arch`). Any cross-layer import violation is a blocking build failure.

### II. Unified D1 Persistence (Zero Database Drift)

Persistence across all environments MUST target Cloudflare D1 exclusively.
- Local development and test environments MUST use Miniflare D1 bindings backed by `.wrangler/state`.
- Production MUST run on native Cloudflare D1 database bindings.
- Alternative database engines (e.g., `sql.js`, in-memory SQLite fallbacks) MUST NOT be introduced, ensuring zero behavior or schema divergence between development and production.
- Database access MUST occur exclusively through Drizzle ORM repositories implementing Application layer ports.

### III. Edge-First & Serverless Runtime Isolation

All application server code MUST run seamlessly within the Cloudflare Workers edge runtime (`workerd`).
- Code paths executed during request handling MUST NOT rely on Node.js-specific built-in modules (`node:fs`, `node:child_process`, etc.).
- Cloudflare Worker runtime bindings (`cloudflare:workers`) MUST be strictly encapsulated within `src/presentation/get-request-env.ts`. No other module may directly import `cloudflare:workers`.
- The presentation layer uses Vinext App Router (React Server Components and Client Components compiled with Vite).

### IV. Automated Architecture Gates & Test-Driven Verification

All features, use cases, and domain logic MUST be accompanied by comprehensive tests.
- Core domain entities and application use cases MUST be verified via fast, deterministic unit tests.
- Data repositories, authentication flows, and external services MUST have integration tests executing against real D1 databases.
- Quality gates MUST run and pass cleanly prior to any merge or deployment:
  1. `bun run check:arch` (Clean Architecture boundary verification)
  2. `bun run check` (Biome linting and code formatting)
  3. `bun test` (Full unit and integration test suite)

### V. Domain RBAC & Secure Identity

Authorization rules MUST be enforced at the Application use-case layer, not delegated solely to the UI.
- The system recognizes two primary user roles: `ADMIN` and `MEMBER`.
- Members MUST only be permitted to update their own role practice statuses and personal profile details. All catalog modifications (songs, arrangements, global labels, user management) require `ADMIN` authorization.
- Passwords MUST be hashed using Web Crypto PBKDF2 with unique salts.
- Session tokens MUST be signed and verified using tamper-resistant JWT cookies (`jose`) with strict expiration windows.

## Technical Constraints & Security Standards

- **Runtime & Tooling**: Bun is the primary package manager and test runner; Vite is the build tool and development server.
- **ORM & Migrations**: Drizzle ORM is used for type-safe query generation and migration management against SQLite/D1 schemas.
- **Code Style & Formatting**: Biome is strictly enforced. Code must adhere to zero linter errors or warnings.
- **Secrets Management**: Secrets, API keys, and JWT private signing keys MUST be injected via environment variables or Cloudflare Worker secrets. Hardcoded secrets in source control are strictly prohibited.
- **Client/Server Boundary**: React Server Components (RSC) should be preferred by default. Client components (`"use client"`) MUST be limited to interactive UI state (e.g., audio/YouTube rehearsal controls, matrix selection).

## Development Workflow & Quality Gates

- **Specification Before Implementation**: Non-trivial features and domain enhancements MUST follow the Spec Kit specification workflow (`/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`).
- **Pre-Merge Validation**: Before pushing or merging code to `main`, every developer and agent MUST verify:
  - Clean architecture: `bun run check:arch` exits with code 0.
  - Linting & formatting: `bun run check` exits with code 0.
  - Test suite: `bun test` passes 100% of tests.
- **Database Schema Changes**: Any schema changes in `src/infrastructure/db/schema.ts` MUST include corresponding migration statements in `src/infrastructure/db/client.ts` and test assertions.

## Governance

This Constitution serves as the authoritative governing standard for WorshipFlow development.
- All code reviews, architectural proposals, and automated agent operations MUST verify compliance with these principles.
- Amendments to this Constitution require explicit review, architectural consensus, and a semantic version bump:
  - **MAJOR**: Structural changes altering the 4-layer architecture, removing core principles, or replacing core platforms.
  - **MINOR**: Adding new principles, introducing new quality gates, or materially expanding development guidance.
  - **PATCH**: Non-semantic clarifications, typo fixes, or stylistic enhancements.
- All team members and AI coding assistants MUST adhere to this constitution during all development phases.

**Version**: 1.0.0 | **Ratified**: 2026-10-26 | **Last Amended**: 2026-11-08
