---

## description: "Task list for WorshipFlow Product Roadmap implementation"

# Tasks: WorshipFlow Product Roadmap

**Input**: Design documents from `specs/001-product-roadmap/` (`spec.md`, `plan.md`, `data-model.md`, `contracts/roadmap-api.md`, `research.md`, `quickstart.md`)

**Prerequisites**: `specs/001-product-roadmap/plan.md`, `specs/001-product-roadmap/spec.md`, `specs/001-product-roadmap/data-model.md`

**Constitution Alignment**: Strict 4-layer clean architecture (`Domain` → `Application` → `Infrastructure` → `Presentation`), zero Node built-ins in request handlers, Cloudflare D1 persistence, domain RBAC at use-case layer.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`, `[US4]`)
- Every task specifies the exact file path and quoted validation constraints.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema, migrations, DTOs, and port interfaces

- [x] T001 Define Drizzle SQLite schema for roadmap tables (`roadmap_phases`, `roadmap_milestones`, `roadmap_capabilities`, `roadmap_dependencies`, `roadmap_capability_feedback`) with compound unique index on `(capability_id, user_id)` in `src/infrastructure/db/schema.ts`
- [x] T002 Add DDL migration statements for roadmap tables in `drizzle/0002_roadmap.sql` and register execution in `src/infrastructure/db/client.ts`
- [x] T003 [P] Define `RoadmapRepository` interface and port types in `src/core/application/ports.ts`
- [x] T004 [P] Define Zod schemas and TypeScript DTOs for roadmap phases, milestones, capabilities, and votes in `src/core/application/schemas.ts` and `src/core/application/dtos.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core domain entities, D1 repository implementation, and baseline seeder

**⚠️ CRITICAL**: No user story work can begin until this foundational phase is complete

- [x] T005 [P] Implement pure domain types, entities, and status enums (`PhaseStatus`: `"PLANNED"` | `"IN_PROGRESS"` | `"COMPLETED"` | `"PENDING_PREREQUISITES"`, `MilestoneStatus`: `"NOT_STARTED"` | `"IN_PROGRESS"` | `"COMPLETED"` | `"DEFERRED"`, `PriorityTier`: `"P1"` | `"P2"` | `"P3"` | `"P4"`, `FunctionalTrack`: `"REPERTOIRE"` | `"PLANNING"` | `"ROSTERING"` | `"REHEARSAL"` | `"STAGE"`) in `src/core/domain/roadmap.ts` with zero external dependencies
- [x] T006 [P] Implement `DrizzleRoadmapRepository` in `src/infrastructure/repositories/DrizzleRoadmapRepository.ts` satisfying `RoadmapRepository` port against D1
- [x] T007 Implement baseline canonical 4-phase and milestone seeder in `src/core/application/use-cases/roadmap.ts` and wire execution into `scripts/seed.ts`
- [x] T008 Wire `DrizzleRoadmapRepository` and roadmap use-case instances into the application dependency container in `src/infrastructure/container.ts`

**Checkpoint**: Foundation ready — database tables exist, repository is wired, and baseline entities are defined.

---

## Phase 3: User Story 1 - Strategic Roadmap & Milestone Visibility (Priority: P1) 🎯 MVP

**Goal**: Authenticated users can view the 4 sequential phases, milestone progress percentages, and capability delivery outcomes.

**Independent Test**: Navigate to `/roadmap` (or `GET /api/roadmap`), verify 4 sequential phases are rendered with target horizons and completion percentages, and expand milestone cards to inspect capabilities.

### Tests for User Story 1

- [x] T009 [P] [US1] Unit tests for roadmap domain progress calculation and entity factories in `tests/unit/domain/roadmap.test.ts`
- [x] T010 [P] [US1] Integration tests for roadmap repository hierarchy querying and D1 persistence in `tests/integration/roadmap-repository.test.ts`

### Implementation for User Story 1

- [x] T011 [US1] Implement `GetRoadmap` use case in `src/core/application/use-cases/roadmap.ts` to assemble phases, milestones, capabilities, and calculate completion percentages
- [x] T012 [US1] Implement `GET /api/roadmap` route handler in `src/app/api/roadmap/route.ts` returning full roadmap hierarchy and summary metrics
- [x] T013 [P] [US1] Implement `MilestoneStatusBadge` component in `src/presentation/components/MilestoneStatusBadge.tsx` displaying status pills (`COMPLETED`, `IN_PROGRESS`, `PLANNED`, `DEFERRED`)
- [x] T014 [P] [US1] Implement `CapabilityCard` component in `src/presentation/components/CapabilityCard.tsx` showing title, target persona, priority tier badge (`P1`-`P4`), and acceptance criteria
- [x] T015 [US1] Implement `RoadmapTimeline` component in `src/presentation/components/RoadmapTimeline.tsx` displaying the sequential 4-phase timeline with expandable milestone cards
- [x] T016 [US1] Implement React Server Component roadmap page in `src/app/roadmap/page.tsx` loading data via container use case and rendering `RoadmapTimeline`

**Checkpoint**: User Story 1 (MVP) is fully functional and testable independently.

---

## Phase 4: User Story 2 - Phase Dependency & Prerequisite Mapping (Priority: P2)

**Goal**: Inspect prerequisite relationships between phases/milestones and enforce blocking prerequisite checks so that milestones cannot be marked completed when upstream prerequisites are unmet.

**Independent Test**: Verify Phase 3 shows Phase 2 as a blocking prerequisite; attempt `PATCH /api/roadmap/milestones/:id/status` with `status: "COMPLETED"` when an upstream prerequisite milestone is incomplete, verifying rejection with `400 Bad Request` (`PREREQUISITE_NOT_SATISFIED`).

### Tests for User Story 2

- [x] T017 [P] [US2] Unit tests for DAG prerequisite validation, satisfaction checks, and cycle detection in `tests/unit/domain/roadmap.test.ts`
- [x] T018 [P] [US2] Unit tests for `UpdateMilestoneStatus` use case authorization (`ADMIN` required) and prerequisite gating in `tests/unit/application/roadmap-use-cases.test.ts`

### Implementation for User Story 2

- [x] T019 [US2] Implement pure DAG prerequisite evaluation functions (`canMilestoneComplete`, `detectCycles`) in `src/core/domain/roadmap.ts`
- [x] T020 [US2] Implement `UpdateMilestoneStatus` use case in `src/core/application/use-cases/roadmap.ts` enforcing `ADMIN` authorization and validating prerequisite completion
- [x] T021 [US2] Implement `PATCH /api/roadmap/milestones/[id]/status/route.ts` route handler returning updated milestone or `400 Bad Request` with `PREREQUISITE_NOT_SATISFIED`
- [x] T022 [US2] Update `MilestoneStatusBadge` and `RoadmapTimeline` in `src/presentation/components/RoadmapTimeline.tsx` to visually display prerequisite dependency badges and blocking warnings

**Checkpoint**: User Stories 1 and 2 work independently; milestones enforce prerequisite integrity.

---

## Phase 5: User Story 3 - Capability Priority Triage & Functional Track Filtering (Priority: P3)

**Goal**: Filter roadmap capabilities by priority tier (P1-P4) and functional track (`REPERTOIRE`, `PLANNING`, `ROSTERING`, `REHEARSAL`, `STAGE`) directly in the interactive web UI.

**Independent Test**: Select "PLANNING" and "P1" in the filter controls, confirm only matching capabilities appear; clear filters and confirm the complete multi-phase timeline is restored.

### Tests for User Story 3

- [x] T023 [P] [US3] Unit tests for track and priority query filtering logic in `tests/unit/application/roadmap-use-cases.test.ts`

### Implementation for User Story 3

- [x] T024 [US3] Update `GetRoadmap` use case in `src/core/application/use-cases/roadmap.ts` to support optional filtering by `track`, `priority`, and `phaseNumber`
- [x] T025 [P] [US3] Implement `RoadmapFilters` client component in `src/presentation/components/RoadmapFilters.tsx` supporting toggle buttons for Functional Tracks and Priority Tiers
- [x] T026 [US3] Integrate `RoadmapFilters` into `src/app/roadmap/page.tsx` with responsive layout adapting to mobile screen widths

**Checkpoint**: User Stories 1, 2, and 3 are functional; filtering is fast, reactive, and mobile-friendly.

---

## Phase 6: User Story 4 - Ministry Feedback & Feature Interest Signals (Priority: P4)

**Goal**: Authenticated worship team volunteers can toggle a single interest vote per capability and optionally submit/update a short note (`max 280 characters`) to signal ministry needs.

**Independent Test**: Post interest vote on an upcoming capability -> verify `200 OK` and vote tally increments; toggle off -> verify tally decrements; confirm unique constraint on `(capability_id, user_id)` prevents duplicate records.

### Tests for User Story 4

- [x] T027 [P] [US4] Integration tests for single-vote upsert/toggle and unique constraint enforcement in `tests/integration/roadmap-repository.test.ts`
- [x] T028 [P] [US4] Unit tests for `ToggleCapabilityVote` use case in `tests/unit/application/roadmap-use-cases.test.ts` verifying `note` constraint (max 280 chars) and voter identity isolation

### Implementation for User Story 4

- [x] T029 [US4] Implement `ToggleCapabilityVote` use case in `src/core/application/use-cases/roadmap.ts` validating note length (`max 280 chars`) and toggling user vote state
- [x] T030 [US4] Implement `POST /api/roadmap/capabilities/[id]/vote/route.ts` route handler for authenticated users
- [x] T031 [US4] Implement interactive `VoteButton` component with optimistic feedback state within `src/presentation/components/CapabilityCard.tsx`

**Checkpoint**: All 4 user stories are functional and verified.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Architecture validation, code style, complete test suite, and quickstart verification

- [x] T032 [P] Execute Clean Architecture boundary verification via `bun run check:arch` and verify zero cross-layer import violations
- [x] T033 [P] Execute Biome linting and code formatting check via `bun run check` and ensure 0 warnings or errors
- [x] T034 Run full test suite via `bun test` and ensure 100% pass rate across all unit and integration tests
- [x] T035 Execute end-to-end scenarios from `specs/001-product-roadmap/quickstart.md` confirming roadmap viewing, prerequisite blocking, filtering, and voting

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup (T001-T004) completion — BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational completion. Delivers the core MVP.
- **User Story 2 (Phase 4)**: Depends on US1 completion (extends milestone presentation with dependency badges and status PATCH).
- **User Story 3 (Phase 5)**: Depends on US1 completion (adds client filter controls and filtered queries). Can execute in parallel with US2.
- **User Story 4 (Phase 6)**: Depends on US1 completion (adds voting table and interactive button). Can execute in parallel with US2 and US3.
- **Polish (Phase 7)**: Depends on all desired user stories being completed.

### Parallel Opportunities

- Within Phase 1: `T003` (ports) and `T004` (schemas/DTOs) can execute in parallel.
- Within Phase 2: `T005` (domain entities) and `T006` (Drizzle repository) can execute in parallel.
- Within Phase 3 (US1): `T009` (domain tests), `T010` (integration tests), `T013` (status badge), and `T014` (capability card) can execute in parallel.
- Within Phase 4 (US2): `T017` (DAG tests) and `T018` (use case tests) can execute in parallel.
- Within Phase 6 (US4): `T027` (integration tests) and `T028` (use case tests) can execute in parallel.
- Within Phase 7: `T032` (architecture check) and `T033` (Biome check) can execute in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (`T001`-`T004`).
2. Complete Phase 2: Foundational (`T005`-`T008`).
3. Complete Phase 3: User Story 1 (`T009`-`T016`).
4. **Validate MVP**: Navigate to `/roadmap` and confirm 4 phases and milestones render with progress metrics.

### Incremental Delivery

1. Foundation + US1 → Core MVP deployed and visible to ministry leadership.
2. Add US2 → Administrators gain prerequisite gating and dependency visualization.
3. Add US3 → Band members and leaders gain targeted track filtering (Repertoire, Planning, Rostering, Rehearsal, Stage).
4. Add US4 → Volunteers gain interactive interest voting and contextual notes.
5. Polish → Architecture gates verified, zero lint issues, full test coverage.
