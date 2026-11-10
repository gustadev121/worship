# Research & Architecture Decisions: WorshipFlow Product Roadmap

**Feature**: WorshipFlow Product Roadmap (Milestones, Priorities, and Dependency Phases)  
**Branch**: `001-product-roadmap`  
**Date**: 2026-11-10

This document records the architectural investigations, technology choices, and design rationales for the WorshipFlow Product Roadmap capability, resolving all technical context details in alignment with the WorshipFlow Constitution.

---

## 1. Roadmap Domain & Dependency Modeling

### Decision

Model the roadmap as a four-tier relational hierarchy (`RoadmapPhase` → `Milestone` → `CapabilityItem`) supplemented by a dedicated directed adjacency list (`PhaseDependency`) to enforce Directed Acyclic Graph (DAG) prerequisite validation.

### Rationale

- **Hierarchical Clarity**: A 4-phase sequential structure (Foundation, Service Planning, Volunteer Scheduling, Live Execution) is intuitive for church leadership.
- **DAG Prerequisite Validation**: Modeling dependencies between phases and milestones as explicit directed edges (`dependent_milestone_id` → `prerequisite_milestone_id`) allows the domain layer to perform cycle detection and verify that all P1 Critical prerequisites are satisfied before a milestone or phase status can transition to `COMPLETED` or `READY_FOR_RELEASE`.
- **Pure Domain Rules**: The prerequisite validation logic resides purely inside `src/core/domain/roadmap.ts` as deterministic pure functions without external libraries.

### Alternatives Considered

- **Flat List with Tags**: Using a flat list of tasks with phase tags was rejected because it fails to capture structured milestone groupings, progress rollups, and strict blocking dependency sequences required by FR-001 and FR-003.
- **Embedded JSON Dependency Array**: Storing prerequisite milestone IDs as a JSON array inside the `milestones` table was rejected because SQLite D1 foreign keys cannot enforce relational integrity across JSON arrays, risking orphaned dependencies.

---

## 2. Interest Voting & Volunteer Feedback Storage

### Decision

Store volunteer interest votes in a dedicated relational join table `roadmap_capability_feedback` with a composite primary key / unique constraint on `(capability_id, user_id)`. Calculate aggregate tallies dynamically using SQL `COUNT()` queries or view rollups in the Drizzle repository rather than maintaining an unconstrained denormalized counter column.

### Rationale

- **Enforced Uniqueness**: A unique constraint on `(capability_id, user_id)` guarantees at the database level that no user can vote more than once per capability, preventing vote inflation.
- **Toggle Semantics**: An HTTP `POST` action toggles presence: if an active record exists, it can be updated or deleted; if none exists, it is inserted with the optional volunteer note (max 280 characters).
- **Concurrency & Integrity**: Eliminates counter-cache drift and race conditions under concurrent requests. In SQLite/D1, `COUNT(*)` over indexed rows for ~20-50 capabilities executes in <1ms.

### Alternatives Considered

- **Denormalized Counter Cache on Capability**: Storing `interest_count INTEGER` directly on `roadmap_capabilities` was rejected because concurrent votes would cause race conditions and drift without SQLite transactions/locks.
- **Open Discussion Thread / Unbounded Comments**: Storing multi-comment forum threads per capability was rejected to keep volunteer feedback concise, actionable, and lightweight as clarified in Clarification 1.

---

## 3. Baseline Seeding & Migration Strategy in Cloudflare D1

### Decision

Implement an idempotent seeding function in the application layer triggered during database initialization or via `bun run seed`. The seeder checks for existing phases; if none exist, it inserts the canonical 4 phases, initial milestones, and baseline capabilities.

### Rationale

- **Instant Out-of-the-Box Value**: Satisfies Clarification 2 by ensuring that every fresh deployment or local development environment immediately displays the complete WorshipFlow roadmap without requiring manual administrative entry.
- **Administrative Mutability**: By persisting seeded data to D1 tables rather than keeping it in static code, church administrators retain the flexibility to update progress states, target dates, and release notes as their ministry evolves.
- **Zero Drift**: Uses the unified D1 schema across local Miniflare and production Cloudflare D1.

### Alternatives Considered

- **Static In-Code JSON/TypeScript Configuration**: Storing the roadmap solely as a hardcoded static TypeScript file was rejected because administrators would not be able to update progress states or record volunteer feedback without modifying source code and redeploying.
- **Manual Blank Slate**: Forcing administrators to manually type in all 4 phases and milestones was rejected due to unnecessary onboarding friction.

---

## 4. UI Architecture & Web-Only Presentation in Vinext / React 19

### Decision

Render the roadmap as a React Server Component (RSC) at `src/app/roadmap/page.tsx` that fetches the roadmap tree directly through application use cases, paired with interactive Client Components (`RoadmapFilters`, `CapabilityCard`, `VoteButton`) for client-side filtering and toggle actions. Exclusively target the interactive web application interface; print stylesheets (`@media print`) and export document generators are omitted for this release.

### Rationale

- **Fast Initial Paint (<1s)**: RSC renders static phase headers, milestone summaries, and initial counts on the edge worker before sending HTML to the client, easily achieving the sub-second render requirement of SC-003.
- **Clean Client Boundary**: Client components are limited strictly to interactive state (filter pills, drawer toggle, vote button), preserving bundle lightness.
- **Scope Discipline (UI-Only)**: In accordance with the 2026-11-10 clarification, eliminating print media stylesheets and file exports keeps the implementation focused on the core interactive web experience.

### Alternatives Considered

- **Print-Specific Media Stylesheets**: Investigated but explicitly deferred per user clarification to maintain focus exclusively on interactive web UI.
- **Server-Side PDF Generator (e.g. Puppeteer / PDFKit)**: Running a headless browser or heavy PDF compilation library inside Cloudflare Workers edge runtime is either unsupported (due to absence of Node.js binaries) or adds massive bundle overhead.
- **Client-Side Canvas/SVG Export**: Complex to maintain across devices and prone to font rendering discrepancies.

---

## 5. Security & Domain RBAC Enforcement

### Decision

Enforce authorization at the Application Use Case layer:
- `ListRoadmap` / `GetRoadmap`: Open to all authenticated actors (`ADMIN` and `MEMBER`).
- `ToggleCapabilityVote`: Allowed for all authenticated actors (`ADMIN` and `MEMBER`) operating strictly on their own `userId`.
- `UpdateMilestoneStatus` / `ManageRoadmap`: Restricted strictly to `ADMIN` actors.

### Rationale

- Adheres directly to WorshipFlow Constitution Principle V (Domain RBAC & Secure Identity).
- Prevents members from modifying milestone delivery dates or overriding dependency statuses while empowering them to submit feedback.
- Uses existing PBKDF2 Web Crypto authentication and signed Jose JWT session cookies.

---

## Summary of Technical Parameters

| Component              | Choice                                         | Rationale                                               |
| ---------------------- | ---------------------------------------------- | ------------------------------------------------------- |
| **Language / Runtime** | TypeScript 5.8+ / Bun 1.4+                     | Project standard; fast deterministic runtime            |
| **Framework**          | Vinext 1.3+ / React 19                         | RSC edge rendering on Cloudflare Workers                |
| **Database**           | Cloudflare D1 via Drizzle ORM                  | Zero database drift between dev and prod                |
| **Validation**         | Zod 3.24+ (Application layer only)             | Strong schema validation at port boundaries             |
| **Domain Layer**       | Pure TypeScript (`src/core/domain/roadmap.ts`) | Zero external dependencies per Constitution Principle I |
| **Presentation Scope** | Interactive Web UI only                        | Responsive web interface; print layouts deferred        |
