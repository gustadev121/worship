# Tasks: WorshipFlow Design System & Page UI Architecture

**Input**: Design documents from `specs/002-design-system-ui/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`)

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: Unit tests for pure domain ChordPro parsing/transposition, client hooks (`useTheme`), and component accessibility are included.

**Organization**: Tasks are grouped by user story (P1 through P5) to enable independent implementation, verification, and MVP delivery.

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Belongs to user story phase (`[US1]`, `[US2]`, `[US3]`, `[US4]`, `[US5]`)
- Clear descriptions with exact file paths

---

## Phase 1: Setup (Shared Infrastructure & Design Tokens)

**Purpose**: Initialize directory structure and global CSS token foundation for the design system.

- [x] T001 Create presentation directory structure for UI primitives (`src/presentation/components/ui/`), React Bits micro-interactions (`src/presentation/components/reactbits/`), layouts (`src/presentation/components/layout/`), rehearsal studio (`src/presentation/components/rehearsal/`), hooks (`src/presentation/hooks/`), and theme definitions (`src/presentation/theme/`)
- [x] T002 Implement semantic CSS custom properties in `src/app/globals.css` defining `:root` (Dark Mode default: `--background: #090d16`, `--card: #0f172a`, `--foreground: #f8fafc`, `--primary: #6366f1`, `--chord-accent: #fbbf24`) and `.light` theme override (`--background: #f8fafc`, `--card: #ffffff`, `--foreground: #0f172a`, `--chord-accent: #92400e`, `--chord-accent-bg: #fef3c7`) per `contracts/design-tokens.md`
- [x] T003 [P] Implement type-safe design token definitions and theme schemas in `src/presentation/theme/tokens.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core UI component primitives and theme synchronization that MUST be complete before page views can be built.

**⚠️ CRITICAL**: No user story page view can be assembled until foundational primitives and theme synchronization are ready.

- [x] T004 [P] Implement `useTheme()` client hook and edge cookie synchronization (`worshipflow_theme=dark|light`) in `src/presentation/hooks/use-theme.ts`
- [x] T005 Implement zero-FOUC edge SSR theme detection in `src/app/layout.tsx` by reading `worshipflow_theme` cookie and injecting root HTML attributes `<html class="light" data-theme="light">` or `<html class="" data-theme="dark">`
- [x] T006 [P] Implement `Button` UI primitive supporting 6 variants (`primary`, `secondary`, `outline`, `ghost`, `destructive`, `icon`), 4 sizes (`sm`, `md`, `lg`, `icon`), loading states, and minimum touch target size (`>= 44x44px`) in `src/presentation/components/ui/button.tsx` per `contracts/components.md`
- [x] T007 [P] Implement `Card` UI compound primitives (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) with hover elevation in `src/presentation/components/ui/card.tsx`
- [x] T008 [P] Implement `Badge` UI primitive supporting 11 domain variants (`default`, `secondary`, `outline`, `keyOriginal`, `keyPractice`, `statusReady`, `statusPracticing`, `statusPending`, `roleAdmin`, `roleMember`, `tierP1`-`tierP4`, and custom hex colors) in `src/presentation/components/ui/badge.tsx`
- [x] T009 [P] Implement `Input` and `Textarea` form primitives with unified borders, focus rings (`var(--ring)`), floating error hints, and password visibility toggles in `src/presentation/components/ui/input.tsx`
- [x] T010 [P] Implement accessible `Modal` dialog primitive featuring focus-trapping (`useFocusTrap`), glassmorphism backdrop blur (`backdrop-filter: blur(8px)`), Escape key listener, and ARIA dialog roles in `src/presentation/components/ui/modal.tsx`
- [x] T011 [P] Implement responsive `Table` UI primitive with sticky headers, striped rows, and horizontal swipe container for mobile viewports (`overflow-x: auto`) in `src/presentation/components/ui/table.tsx`
- [x] T012 [P] Implement React Bits `AnimatedGlow` micro-interaction component with `@media (prefers-reduced-motion: reduce)` static fallback in `src/presentation/components/reactbits/animated-glow.tsx`

**Checkpoint**: Foundation ready — all core component primitives and theme synchronization are ready for user stories.

---

## Phase 3: User Story 1 - Unified Design System Foundation & Global App Shell (Priority: P1) 🎯 MVP

**Goal**: Deliver a polished, responsive App Shell layout across all application pages with a sticky desktop navbar (`>=768px`), persistent mobile bottom dock (`<768px`), "Más" slide-over sheet, theme toggle, and role badges (`ADMIN` vs `MEMBER`).

**Independent Test**: Load the application on desktop and mobile viewports, toggle between Dark and Light modes, verify zero FOUC, verify desktop header adapts to fixed bottom dock on screens <768px, and open "Más" drawer.

### Tests for User Story 1

- [x] T013 [P] [US1] Unit test for `useTheme()` hook validating theme toggling, default dark mode fallback, and cookie serialization in `tests/unit/presentation/use-theme.test.ts`

### Implementation for User Story 1

- [x] T014 [P] [US1] Implement `ThemeToggle` switch component supporting dark/light mode toggling with accessible `aria-label` in `src/presentation/components/layout/theme-toggle.tsx`
- [x] T015 [P] [US1] Implement `DesktopNavbar` header (`h-16`) featuring animated brand insignia (`AnimatedGlow`), active route indicators, theme toggle, and role avatar with role badge in `src/presentation/components/layout/navbar.tsx` per `contracts/app-shell.md`
- [x] T016 [P] [US1] Implement `MobileDock` persistent bottom navigation bar (`<768px`) with safe-area insets (`env(safe-area-inset-bottom)`) and 4 touch targets (`>=48x48px`: Catálogo, Ensayo, Roadmap, Más) in `src/presentation/components/layout/mobile-dock.tsx`
- [x] T017 [US1] Implement `MoreDrawer` slide-over bottom sheet containing user identity card, role pill, admin navigation shortcuts (`/admin/users`, `/admin/labels`), theme switch, and logout in `src/presentation/components/layout/more-drawer.tsx`
- [x] T018 [US1] Assemble global `AppShell` layout container integrating `DesktopNavbar`, `MobileDock`, and `MoreDrawer` with main landmark container in `src/presentation/components/layout/app-shell.tsx` and bind to `src/app/layout.tsx`

**Checkpoint**: User Story 1 complete — global App Shell and theming functional and testable independently.

---

## Phase 4: User Story 2 - Repertoire Catalog & Song Discovery Experience (Priority: P2)

**Goal**: Deliver an interactive Song Catalog page (`/`) featuring React Bits `SpotlightCard` cursor light tracking, sticky search and multi-criteria filters, and animated empty state.

**Independent Test**: Navigate to `/`, hover over song cards to verify cursor spotlight reflection, search songs by title/artist, filter by musical key pills and repertoire labels, and verify empty search state card with reset filter action.

### Tests for User Story 2

- [x] T019 [P] [US2] Unit test verifying `SpotlightCard` cursor coordinate calculations and graceful degradation under `@media (pointer: coarse)` and `prefers-reduced-motion` in `tests/unit/presentation/spotlight-card.test.ts`

### Implementation for User Story 2

- [x] T020 [P] [US2] Implement React Bits `SpotlightCard` micro-interaction tracking mouse pointer `(x, y)` relative to bounding box with radial spotlight gradient and touchscreen/reduced-motion fallback in `src/presentation/components/reactbits/spotlight-card.tsx` per `contracts/components.md`
- [x] T021 [US2] Update `src/presentation/components/SongCard.tsx` to utilize `SpotlightCard`, musical key badges (`keyOriginal`, `keyPractice`), BPM pill, repertoire label pills, and volunteer count badge per `contracts/routes-ui.md`
- [x] T022 [US2] Update `src/presentation/components/SongFilters.tsx` with sticky container, debounced search text input, canonical key selector pills, and repertoire label filter badges
- [x] T023 [US2] Refactor Repertoire Catalog page `src/app/page.tsx` with responsive grid layout (1 col mobile, 2 col tablet, 3 col desktop), spotlight song cards, catalog statistics banner, and animated empty search state card with reset action

**Checkpoint**: User Story 2 complete — Song Catalog discovery experience fully testable.

---

## Phase 5: User Story 3 - Interactive Rehearsal Studio & Song Detail UI (Priority: P3)

**Goal**: Deliver a pure domain ChordPro parser and key transposition engine, Song Detail page (`/songs/[id]`) with vocal role matrix, and Rehearsal Studio (`/songs/[id]/practice`) with Stage Utility Bar (semitone transposition, font scaling, Fullscreen API, Screen Wake Lock, and auto-scroll).

**Independent Test**: Open `/songs/[id]`, verify arrangement hero and vocal matrix; navigate to `/songs/[id]/practice`, verify synchronized video section timestamp jumping, transpose chords by +/- semitones, toggle Fullscreen mode, verify Screen Wake Lock activation, and test hands-free auto-scrolling with touch-to-pause cooldown.

### Tests for User Story 3

- [x] T024 [P] [US3] Unit tests for pure domain ChordPro parser and key transposition engine verifying bracket notation extraction, syllable pairing, slash chords, and chromatic semitone shifts in `tests/unit/domain/chordpro.test.ts`

### Implementation for User Story 3

- [x] T025 [P] [US3] Implement pure domain `ChordProSheet`, line syllable pairing, and key transposition algorithm (`src/core/domain/chordpro.ts`) with zero external dependencies per `data-model.md` and Constitution Principle I
- [x] T026 [P] [US3] Implement `useScreenWakeLock` hook acquiring `navigator.wakeLock.request('screen')` with automatic re-acquisition on `document.visibilitychange` and fallback indicator in `src/presentation/hooks/use-screen-wake-lock.ts`
- [x] T027 [P] [US3] Implement `useAutoScroll` hook with `requestAnimationFrame` microsecond delta timing, configurable speed slider (10 to 80 px/s), and 3-second touch-to-pause cooldown in `src/presentation/hooks/use-auto-scroll.ts`
- [x] T028 [US3] Implement `ChordSheet` reader component displaying transposable chords in luminous Amber (`--chord-accent`) positioned vertically above corresponding lyric syllables in an `inline-flex` column pattern in `src/presentation/components/rehearsal/chord-sheet.tsx` per `contracts/routes-ui.md`
- [x] T029 [US3] Implement `StageUtilityBar` with transposition stepper (+/- semitones relative to arrangement key), dynamic font scaling controls (A- / A+), auto-scroll controls, 1-click Fullscreen toggle, and Screen Wake Lock status indicator in `src/presentation/components/rehearsal/stage-utility-bar.tsx`
- [x] T030 [US3] Update `src/presentation/components/RoleMatrix.tsx` with styled vocal parts (First, Second, Third Voice) and instruments table, volunteer avatars, harmony notes, and personal practice status pills (`READY`, `PRACTICING`, `PENDING`)
- [x] T031 [US3] Refactor Song Detail page `src/app/songs/[id]/page.tsx` with arrangement hero banner, quick rehearsal actions, interactive role matrix, and chord chart preview
- [x] T032 [US3] Refactor Rehearsal Studio page `src/app/songs/[id]/practice/page.tsx` integrating video player synchronization, clickable section timestamp markers, Fullscreen Stage Mode, and hands-free stage utility bar

**Checkpoint**: User Story 3 complete — Rehearsal Studio and Song Detail experience fully functional.

---

## Phase 6: User Story 4 - Creation, Management & Roadmap Experience (Priority: P4)

**Goal**: Deliver modern form interfaces for Song Creation/Editing (`/songs/new`, `/songs/[id]/edit`) with live ChordPro preview and section timestamp builder; Strategic Roadmap (`/roadmap`) with 4-phase animated progress bars; Admin User Management (`/admin/users`) and Label Management (`/admin/labels`).

**Independent Test**: Create/edit songs with live ChordPro formatting, view roadmap progress bars and toggle volunteer interest, manage users on `/admin/users`, and edit labels with hex swatch picker on `/admin/labels`.

### Implementation for User Story 4

- [x] T033 [P] [US4] Refactor Song Creation page `src/app/songs/new/page.tsx` with sectioned card layout (Metadata, Musical Attributes, YouTube URL with live preview thumbnail, and ChordPro editor with real-time parsed preview)
- [x] T034 [P] [US4] Refactor Song Edit page `src/app/songs/[id]/edit/page.tsx` with pre-filled form fields, ChordPro editor with formatted preview, and section timestamp builder
- [x] T035 [P] [US4] Refactor Strategic Roadmap view `src/app/roadmap/page.tsx` and roadmap components (`RoadmapTimeline.tsx`, `CapabilityCard.tsx`) with 4-phase animated progress bars, priority tier badges (`tierP1`-`tierP4`), expandable milestone accordions, and interactive volunteer voting feedback per `contracts/routes-ui.md`
- [x] T036 [P] [US4] Refactor Admin Users console `src/app/admin/users/page.tsx` with styled data table, role badges (`ADMIN`/`MEMBER`), sortable columns, and user edit dialog
- [x] T037 [P] [US4] Refactor Admin Labels console `src/app/admin/labels/page.tsx` with label management data table and hex color swatch picker modal

**Checkpoint**: User Story 4 complete — Creation, roadmap, and administrative consoles fully functional.

---

## Phase 7: User Story 5 - Authentication & First Impression Experience (Priority: P5)

**Goal**: Deliver an aesthetically compelling Login page (`/login`) featuring React Bits `AuroraBackground` ambient gradient mesh, centered glassmorphism container, floating validation rings, and password visibility toggle.

**Independent Test**: Navigate to `/login`, verify ambient aurora gradient, verify centered card with backdrop blur, submit invalid credentials to test error rings and inline messages.

### Implementation for User Story 5

- [x] T038 [P] [US5] Implement React Bits `AuroraBackground` micro-interaction component with 3 multi-layered radial blobs (Indigo, Purple, Sky), `blur(60px)`, and `@media (prefers-reduced-motion: reduce)` static fallback in `src/presentation/components/reactbits/aurora-bg.tsx` per `contracts/components.md`
- [x] T039 [US5] Refactor Login page `src/app/login/page.tsx` with centered glassmorphism card, Aurora background, floating validation rings, and password visibility toggle per `contracts/routes-ui.md`

**Checkpoint**: User Story 5 complete — Authentication view fully functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Verify quality gates, accessibility compliance, code formatting, and end-to-end functionality across all stories.

- [x] T040 [P] Verify WCAG 2.1 AA accessibility compliance across all 8 routes (minimum 4.5:1 text contrast and `>= 44x44px` mobile touch targets) per `contracts/design-tokens.md`
- [x] T041 Run Biome linter and formatter check (`bun run check`) and ensure zero errors or warnings
- [x] T042 Run Clean Architecture verification gate (`bun run check:arch`) ensuring zero violations in `src/core/domain/`
- [x] T043 Run full test suite (`bun test`) ensuring 100% of tests pass across all domain and application modules
- [x] T044 Execute end-to-end quickstart validation scenarios defined in `specs/002-design-system-ui/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS all User Stories**.
- **User Stories (Phases 3–7)**: Depend on Phase 2 completion.
  - Can proceed sequentially (US1 → US2 → US3 → US4 → US5) or in parallel by feature team slices.
- **Polish (Phase 8)**: Depends on all desired user stories being completed.

### User Story Dependencies

- **User Story 1 (P1 - App Shell)**: Depends on Phase 2. Foundation for all other views.
- **User Story 2 (P2 - Catalog)**: Depends on Phase 2 and US1 App Shell.
- **User Story 3 (P3 - Rehearsal Studio)**: Depends on Phase 2. Core ChordPro domain (T024, T025) can be developed in parallel with US1/US2.
- **User Story 4 (P4 - Management & Roadmap)**: Depends on Phase 2 and US1 App Shell.
- **User Story 5 (P5 - Login)**: Depends on Phase 2 primitives.

---

## Parallel Execution Examples

### User Story 1 Parallel Stream

```bash
# Launch layout components in parallel:
Task: "T014 [US1] Implement ThemeToggle switch in src/presentation/components/layout/theme-toggle.tsx"
Task: "T015 [US1] Implement DesktopNavbar in src/presentation/components/layout/navbar.tsx"
Task: "T016 [US1] Implement MobileDock in src/presentation/components/layout/mobile-dock.tsx"
```

### User Story 3 Parallel Stream

```bash
# Launch pure domain ChordPro parser and rehearsal hooks in parallel:
Task: "T024 [US3] Unit tests for ChordPro parser in tests/unit/domain/chordpro.test.ts"
Task: "T025 [US3] Pure domain ChordPro parser in src/core/domain/chordpro.ts"
Task: "T026 [US3] useScreenWakeLock hook in src/presentation/hooks/use-screen-wake-lock.ts"
Task: "T027 [US3] useAutoScroll hook in src/presentation/hooks/use-auto-scroll.ts"
```

---

## Implementation Strategy

### MVP Delivery (Phase 1 + Phase 2 + User Story 1)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational Primitives).
2. Complete Phase 3 (User Story 1: Global App Shell, Theming, Mobile Dock).
3. **STOP and VALIDATE**: Verify dark/light theme switching, 0ms FOUC, responsive navbar/dock.
4. Deploy/demo the foundational Design System shell (MVP!).

### Incremental Feature Expansion

1. Add **User Story 2**: Repertoire Catalog with Spotlight cards and filtering.
2. Add **User Story 3**: ChordPro parsing, Song Detail, and Rehearsal Studio stage tools.
3. Add **User Story 4**: Song creation/editing, Roadmap, and Admin consoles.
4. Add **User Story 5**: Login view with Aurora background.
5. Execute **Polish**: Architecture verification, Biome formatting, full test suite pass.
