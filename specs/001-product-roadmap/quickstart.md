# Quickstart Validation Guide: WorshipFlow Product Roadmap

**Feature**: WorshipFlow Product Roadmap (Milestones, Priorities, and Dependency Phases)  
**Branch**: `001-product-roadmap`  
**Date**: 2026-11-10

This guide provides step-by-step verification procedures to validate the WorshipFlow Product Roadmap end-to-end, covering database migrations, domain invariants, application use cases, REST endpoints, and UI print responsiveness.

---

## Prerequisites

1. **Bun Runtime**: v1.2+ installed (`bun --version`).
2. **Local Environment Variables**: `.env` configured with `JWT_SECRET`.
3. **Local D1 State**: Clean or seeded Miniflare D1 database (`.wrangler/state`).

---

## 1. Automated Architecture & Quality Verification

Verify that all clean architecture boundaries, linting, and tests pass with zero errors.

```bash
# Verify Clean Architecture boundaries (Presentation -> Infrastructure -> Application -> Domain)
bun run check:arch

# Verify Biome linting and formatting
bun run check

# Execute complete test suite
bun test
```

**Expected Outcome**:
- `check:arch` exits with code 0 (zero cross-layer leaks).
- `check` exits with code 0 (zero lint warnings/errors).
- `bun test` passes 100% of unit and integration tests.

---

## 2. Database Seeding & Migration Verification

Verify that the roadmap tables and baseline canonical 4 phases and milestones are seeded without drift.

```bash
# Seed the local D1 database
bun run seed
```

**Expected Outcome**:
Console output confirms roadmap entities are seeded:
`seeded roadmap_phases=4 roadmap_milestones=8 roadmap_capabilities=...`

---

## 3. End-to-End Functional Test Scenarios

### Scenario A: Strategic Roadmap Hierarchy & Progress Viewing (User Story 1 & 2)

Prove that an authenticated user can retrieve the complete roadmap and verify progress calculations.

1. **Request**:

   ```bash
   curl -s -X GET "http://localhost:5173/api/roadmap" \
     -H "Cookie: auth_token=<MEMBER_JWT_TOKEN>"
   ```
2. **Assertions**:
   - HTTP status is `200 OK`.
   - Response contains exactly 4 phases:
     - Phase 1: Repertoire & Rehearsal Foundation (`COMPLETED`, 100%).
     - Phase 2: Service Planning & Setlist Management (`IN_PROGRESS`).
     - Phase 3: Volunteer Scheduling & Roster Management (`PLANNED` / `PENDING_PREREQUISITES`).
     - Phase 4: Live Service Execution & Stage Mode (`PLANNED` / `PENDING_PREREQUISITES`).
   - Phase 3 lists Phase 2 as a blocking prerequisite (`isBlocking = true`).

---

### Scenario B: Prerequisite Blocking Validation (Domain Invariant 1)

Prove that an administrator cannot mark a downstream milestone `COMPLETED` when an upstream blocking milestone is incomplete.

1. **Request**:

   ```bash
   # Attempt to mark Phase 3 milestone completed while Phase 2 milestone is IN_PROGRESS
   curl -s -X PATCH "http://localhost:5173/api/roadmap/milestones/ms-3-scheduling/status" \
     -H "Cookie: auth_token=<ADMIN_JWT_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"status": "COMPLETED"}'
   ```
2. **Assertions**:
   - HTTP status is `400 Bad Request`.
   - Response body contains `PREREQUISITE_NOT_SATISFIED` error code and identifies the blocking upstream milestone.

---

### Scenario C: Volunteer Interest Toggle & Unique Constraint (User Story 4 & FR-007)

Prove that a team member can toggle an interest vote, update their note, and cannot cast duplicate votes.

1. **Cast Vote**:

   ```bash
   curl -s -X POST "http://localhost:5173/api/roadmap/capabilities/cap-2-1/vote" \
     -H "Cookie: auth_token=<MEMBER_JWT_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"hasInterest": true, "note": "Crucial for our worship leaders"}'
   ```

   **Assertion**: Returns `200 OK`, `hasInterest: true`, `newTotalInterestCount: N + 1`.

2. **Toggle Off**:

   ```bash
   curl -s -X POST "http://localhost:5173/api/roadmap/capabilities/cap-2-1/vote" \
     -H "Cookie: auth_token=<MEMBER_JWT_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"hasInterest": false}'
   ```

   **Assertion**: Returns `200 OK`, `hasInterest: false`, `newTotalInterestCount: N`. Exactly one record exists for `(cap-2-1, user_id)` in the database.

---

### Scenario D: RBAC Protection Gate (Constitution Principle V)

Prove that non-administrative team members cannot alter milestone statuses.

1. **Request**:

   ```bash
   curl -s -X PATCH "http://localhost:5173/api/roadmap/milestones/ms-2-setlists/status" \
     -H "Cookie: auth_token=<MEMBER_JWT_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"status": "COMPLETED"}'
   ```
2. **Assertions**:
   - HTTP status is `403 Forbidden`.
   - Milestone status remains unchanged in the database.

---

### Scenario E: Web UI Filtering & Responsive Timeline Verification (FR-006)

Prove that the roadmap page provides interactive filtering and responsive layout within the web interface.

1. Navigate in browser to `http://localhost:5173/roadmap`.
2. Apply filter: select "PLANNING" functional track and "P1" priority tier.
   - **Assertion**: Only matching capabilities (e.g. Setlist drag-and-drop) are displayed.
3. Switch viewport to mobile width (375px).
   - **Assertion**: Timeline shifts seamlessly to a vertical stacked layout with sticky phase headers and touch-friendly vote toggles.
