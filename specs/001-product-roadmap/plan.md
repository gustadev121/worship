# Implementation Plan: WorshipFlow Product Roadmap

**Branch**: `001-product-roadmap` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-product-roadmap/spec.md`

## Summary

Deliver a structured, interactive product roadmap for WorshipFlow defining four sequential development phases (Phase 1: Repertoire & Rehearsal Foundation, Phase 2: Service Planning & Setlists, Phase 3: Volunteer Scheduling & Rostering, Phase 4: Live Service Execution & Stage Mode). The technical approach establishes a clean relational hierarchy (`RoadmapPhase` → `Milestone` → `CapabilityItem`) with directed acyclic graph (DAG) dependency gating, unique compound interest voting per user, idempotent Cloudflare D1 database seeding, and a React Server Component (RSC) interface with responsive web UI controls.

## Technical Context

**Language/Version**: TypeScript 5.8+, Bun 1.4+ (runtime, package manager, and test runner)

**Primary Dependencies**: Vinext 1.3+ / React 19 (App Router with RSC), Drizzle ORM 0.45+, Zod 4.6+, Jose 6.2+

**Storage**: Cloudflare D1 (SQLite) with Drizzle ORM; local Miniflare D1 state in `.wrangler/state/v3` (zero database drift)

**Testing**: Bun Test (`bun test`) executing unit tests for pure domain logic and integration tests against real Miniflare D1 databases

**Target Platform**: Cloudflare Workers edge runtime (`workerd`) via Vinext Cloudflare adapter

**Project Type**: Full-stack web application with React Server Components, server actions/API routes, and client interactive controls

**Performance Goals**: Initial roadmap paint and interactive readiness in <1s (SC-003); API endpoints respond in <100ms; sub-millisecond D1 query execution

**Constraints**: Strict 4-layer clean architecture (`Domain` → `Application` → `Infrastructure` → `Presentation`); zero Node.js built-ins in request handlers; domain purity (no Zod/Node in `src/core/domain`); Biome zero lint warnings; interactive web UI-only delivery (print layouts and export pipelines explicitly deferred)

**Scale/Scope**: 4 strategic phases, ~8-12 milestones, ~25-40 capabilities, church ministry team scale (~10-100 users per church instance)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] **I. Strict 4-Layer Clean Architecture & Core Purity**: Pure domain entities (`RoadmapPhase`, `Milestone`, `CapabilityItem`, `PhaseDependency`, `CapabilityFeedback`) and deterministic DAG validation in `src/core/domain/roadmap.ts` with zero external dependencies. Application use cases in `src/core/application/use-cases/roadmap.ts` only import domain and Zod.
- [x] **II. Unified D1 Persistence (Zero Database Drift)**: Tables (`roadmap_phases`, `roadmap_milestones`, `roadmap_capabilities`, `roadmap_dependencies`, `roadmap_capability_feedback`) defined via Drizzle SQLite schema and SQL migrations, targeting Cloudflare D1 in production and Miniflare D1 locally. No fallback database engines.
- [x] **III. Edge-First & Serverless Runtime Isolation**: All code executes inside `workerd`. Worker environment bindings accessed strictly via `src/presentation/get-request-env.ts`. No `node:fs` or `node:child_process` calls.
- [x] **IV. Automated Architecture Gates & Test-Driven Verification**: Quality gates strictly enforced (`bun run check:arch`, `bun run check`, `bun test`). Pure domain unit tests for dependency validation and integration tests for repository CRUD against D1.
- [x] **V. Domain RBAC & Secure Identity**: Authorization enforced at the Application Use Case layer. Only `ADMIN` can update milestone statuses and delivery notes; `MEMBER` users have read access and can toggle their own single vote per capability.

_Post-Design Evaluation_: All 5 gates pass. No architecture violations introduced.

## Project Structure

### Documentation (this feature)

```text
specs/001-product-roadmap/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── roadmap-api.md   # HTTP endpoint contracts and schemas
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/
│   │   └── roadmap/
│   │       ├── route.ts                            # GET /api/roadmap
│   │       ├── milestones/[id]/status/route.ts     # PATCH milestone status (ADMIN)
│   │       └── capabilities/[id]/vote/route.ts     # POST capability vote toggle (MEMBER/ADMIN)
│   └── roadmap/
│       └── page.tsx                                # RSC Roadmap view
├── core/
│   ├── domain/
│   │   └── roadmap.ts                              # Pure domain types, entities, DAG validator
│   └── application/
│       ├── ports.ts                                # RoadmapRepository port interface
│       ├── schemas.ts                              # Zod schemas for roadmap DTOs
│       ├── dtos.ts                                 # Roadmap DTO interfaces
│       └── use-cases/
│           └── roadmap.ts                          # GetRoadmap, UpdateMilestoneStatus, ToggleCapabilityVote, SeedRoadmap
├── infrastructure/
│   ├── container.ts                                # Dependency container wiring
│   ├── db/
│   │   ├── schema.ts                               # Drizzle schema definitions for roadmap tables
│   │   └── client.ts                               # D1 migration registration
│   └── repositories/
│       └── DrizzleRoadmapRepository.ts             # D1 repository implementation
└── presentation/
    └── components/
        ├── RoadmapTimeline.tsx                     # Responsive phase & milestone timeline
        ├── RoadmapFilters.tsx                      # Track and priority filter bar
        ├── CapabilityCard.tsx                      # Capability details & interest vote button
        └── MilestoneStatusBadge.tsx                # Status and blocking dependency badge

tests/
├── unit/
│   ├── domain/
│   │   └── roadmap.test.ts                         # Pure DAG dependency & invariant unit tests
│   └── application/
│       └── roadmap-use-cases.test.ts               # RBAC & use case unit tests
└── integration/
    └── roadmap-repository.test.ts                  # D1 integration tests for roadmap CRUD & voting
```

**Structure Decision**: Integrated directly into WorshipFlow's existing 4-layer Clean Architecture. Core domain rules are isolated in `src/core/domain/roadmap.ts`, application use cases in `src/core/application/use-cases/roadmap.ts`, Drizzle D1 persistence in `src/infrastructure/repositories/DrizzleRoadmapRepository.ts`, and presentation in `src/app/roadmap/` with shared UI components in `src/presentation/components/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

_Zero violations. No complexity bypasses or external engine additions._
