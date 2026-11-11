# Tasks: Rehearsal Live Playback Synchronization & Active Section Tracking

**Input**: Design documents from `specs/003-rehearsal-live-sync/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/rehearsal-sync.md`, `quickstart.md`)

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/rehearsal-sync.md`

**Tests**: Unit tests for pure domain section resolution algorithms and client playback synchronization hooks are included.

**Organization**: Tasks are grouped by user story (P1 through P3) to enable independent implementation, verification, and MVP delivery.

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Belongs to user story phase (`[US1]`, `[US2]`, `[US3]`)
- Clear descriptions with exact file paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Define pure domain entities, value objects, and shared contracts for section timestamps and playback synchronization.

- [x] T001 Define pure domain timestamp structures (`RehearsalSection`, `ActiveSectionMatch`, `PlaybackSyncState`) in `src/core/domain/rehearsal-sync.ts` per `specs/003-rehearsal-live-sync/data-model.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core pure domain logic that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until the deterministic section resolution algorithm is in place.

- [x] T002 Implement pure deterministic matching function `findActiveSection(sections, currentTimeSeconds)` and timestamp formatter in `src/core/domain/rehearsal-sync.ts` per `specs/003-rehearsal-live-sync/contracts/rehearsal-sync.md`
- [x] T003 [P] Write unit tests for `findActiveSection` covering exact matches, intermediate times, negative timestamps, out-of-order arrays, empty sections, and looped intervals in `tests/unit/domain/rehearsal-sync.test.ts`

**Checkpoint**: Foundation ready — pure domain time-matching is fully tested and ready for presentation layer integration.

---

## Phase 3: User Story 1 - Real-Time Section Detection & Highlighting (Priority: P1) 🎯 MVP

**Goal**: As media plays, the rehearsal studio automatically detects the current timestamp and highlights the matching musical section (Verse, Chorus, Bridge) with an amber glowing border in real time.

**Independent Test**: Start playback on a song with timestamps; verify the active section highlight automatically shifts from Verse to Chorus as playback crosses the timestamp threshold (e.g. 0:45) without user interaction.

### Tests for User Story 1

- [x] T004 [P] [US1] Write unit tests for `usePlaybackSync` time polling, section transitions, and A-B loop boundary preservation in `tests/unit/presentation/use-playback-sync.test.ts`

### Implementation for User Story 1

- [x] T005 [US1] Implement `usePlaybackSync` custom hook in `src/presentation/hooks/use-playback-sync.ts` with 250ms polling loop querying `player.getCurrentTime()` and resolving active section per `specs/003-rehearsal-live-sync/contracts/rehearsal-sync.md`
- [x] T006 [US1] Update `src/presentation/components/rehearsal/chord-sheet.tsx` to add section ID anchor attributes (`id="section-${section.sectionId}"`, `data-active-section="true"`) and reactive active amber glowing border styles
- [x] T007 [US1] Integrate `usePlaybackSync` into `src/presentation/components/RehearsalPlayer.tsx` to synchronize YouTube player playback with active section state and section navigator buttons

**Checkpoint**: User Story 1 complete — real-time section detection and amber highlight switching works during audio/video playback (MVP ready).

---

## Phase 4: User Story 2 - Smooth Automatic Follow-Scroll to Active Section (Priority: P2)

**Goal**: When section transitions occur during playback, the chord sheet viewport automatically scrolls smoothly to keep the active section visible, allowing hands-free playing.

**Independent Test**: Load a long chord sheet exceeding the viewport; start playback and verify that as the song enters Chorus (located below the fold), the viewport automatically scrolls to bring Chorus into view.

### Implementation for User Story 2

- [x] T008 [P] [US2] Enhance `useAutoScroll` in `src/presentation/hooks/use-auto-scroll.ts` with programmatic section scrolling method `scrollToElement(el)` using smooth behavior
- [x] T009 [US2] Add Auto-Follow toggle switch and status indicator in `src/presentation/components/rehearsal/stage-utility-bar.tsx`
- [x] T010 [US2] Connect active section transition listener in `src/presentation/components/RehearsalPlayer.tsx` to trigger smooth scroll to active section element when Auto-Follow is enabled

**Checkpoint**: User Stories 1 and 2 complete — playback highlights and automatically scrolls to each section hands-free.

---

## Phase 5: User Story 3 - Interactive Seeking & Non-Intrusive Manual Override (Priority: P3)

**Goal**: Allow musicians to manually click section markers to jump playback, and temporarily suspend automated scrolling for 3 seconds if the user manually touches or scrolls the screen.

**Independent Test**: While audio is playing, manually scroll the chord sheet upwards; verify the view does not jerk back immediately. Click "Chorus"; verify playback immediately seeks to 0:45, highlights Chorus, and centers the view.

### Implementation for User Story 3

- [x] T011 [P] [US3] Add gesture detection listeners (`wheel`, `touchstart`, `pointerdown`) and 3-second debounce timer in `src/presentation/hooks/use-playback-sync.ts` to suspend auto-follow during manual scrolling
- [x] T012 [US3] Implement bidirectional click-to-seek in `src/presentation/components/RehearsalPlayer.tsx` so clicking section badges or chord sheet headers immediately seeks player and resets manual override

**Checkpoint**: All user stories complete — full bidirectional live playback sync with gesture-resilient auto-scrolling.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Architecture validation, code formatting, comprehensive test execution, and production build verification.

- [x] T013 [P] Run architecture check `bun run check:arch` and verify zero boundary violations
- [x] T014 [P] Run linter and formatting check `bun run check` across all modified files
- [x] T015 Run full automated test suite `bun test` verifying 100% tests passing including new unit tests
- [x] T016 Execute quickstart scenarios in `specs/003-rehearsal-live-sync/quickstart.md` and verify production build with `bun run build`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories.
- **User Stories (Phase 3+)**: Depend on Foundational phase completion.
  - Phase 3 (US1 - MVP): Core playback polling & active section highlighting.
  - Phase 4 (US2): Follow-scrolling (builds on US1 active section state).
  - Phase 5 (US3): Interactive seek & gesture override (builds on US1/US2).
- **Polish (Phase 6)**: Depends on all user stories being complete.

### Parallel Opportunities

- T001, T002, and T003: Pure domain file and test can be prepared together.
- T004 (hook tests) and T008 (auto-scroll extension) operate on independent files and can run in parallel.
- T013, T014 can run in parallel during final polish.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (`src/core/domain/rehearsal-sync.ts`).
2. Complete Phase 2: Foundational (`findActiveSection` + tests).
3. Complete Phase 3: User Story 1 (`usePlaybackSync` + highlight in `ChordSheet` and `RehearsalPlayer`).
4. **STOP and VALIDATE**: Play video, verify section highlights change in real time. (MVP delivered!)

### Incremental Delivery

- Add User Story 2: Auto-follow viewport scrolling for hands-free rehearsal on music stands.
- Add User Story 3: Gesture override buffer (3s) and bidirectional click-to-seek.
- Run Phase 6 Quality Gates.
