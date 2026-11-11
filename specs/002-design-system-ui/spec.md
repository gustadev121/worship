# Feature Specification: WorshipFlow Design System & Page UI Architecture

**Feature Branch**: `002-design-system-ui`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Shadcn-based Design system, using react bits library https://reactbits.dev/, define the pages and the UI for each one,"

## Clarifications

### Session 2026-11-10

- Q: What should be the default theme mode and primary brand aesthetic for WorshipFlow when a new user visits without an existing theme preference? (FR-002) → A: Dark-First Default: Defaults to Dark Mode with Deep Slate/Zinc neutrals, Indigo primary brand actions, and Amber chord highlights; user can toggle to Light mode at any time with preference persisted.
- Q: What notation format should the Song Editor and Rehearsal Studio use for authoring and rendering chords above lyrics? (FR-007, FR-008) → A: ChordPro inline bracket notation (e.g. `[G]Amazing [D]grace`), parsed and rendered as elevated chord pills positioned above syllables with dynamic transposition support.
- Q: What interactive stage utility controls should be provided in the Rehearsal Studio header for live practice? (FR-007) → A: Full Stage Control Bar: Transposition stepper (+/- semitones relative to arrangement key), font size scaling controls (A- / A+), and toggleable hands-free auto-scroll with adjustable speed slider.
- Q: Should the Rehearsal Studio (`/songs/[id]/practice`) include a dedicated Fullscreen Stage Mode toggle with Screen Wake Lock support? (FR-007) → A: Fullscreen Stage Mode + Wake Lock: 1-click toggle hides navigation and browser chrome to maximize chord sheet lines, while requesting Screen Wake Lock to prevent tablet display sleep during practice and live worship.
- Q: For mobile device viewports (<768px), how should primary navigation be structured to ensure ergonomic thumb-reach during rehearsals and on-the-go planning? (FR-004) → A: Bottom Navigation Dock + More Drawer: Persistent bottom bar with thumb-accessible icons for Catálogo, Ensayo, Roadmap, and Profile, paired with a "More" slide-over drawer for Admin tools.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Unified Design System Foundation & Global App Shell (Priority: P1)

As a Worship Team member (leader, musician, singer) or Administrator, I want a modern, cohesive, and accessible design system across the entire application with an elegant App Shell, clear navigation, consistent dark/light themes, and subtle interactive accents, so that navigating WorshipFlow is visually polished, intuitive, and distraction-free on any device.

**Why this priority**: The App Shell and foundational design language anchor every page in the application; without a unified component library, individual pages cannot achieve visual harmony, accessibility compliance, or responsive consistency.

**Independent Test**: Can be fully tested by loading the App Shell, toggling themes between dark and light modes, navigating top-level routes, and verifying that typography, color tokens, buttons, badges, and layout containers remain visually harmonious and responsive.

**Acceptance Scenarios**:

1. **Given** any authenticated user or first-time visitor, **When** they load the application, **Then** the application renders by default in Dark Mode using Deep Slate/Zinc neutrals, Indigo primary actions, and Amber highlights, featuring the persistent App Shell with brand header, subtle animated accent, navigation links, active route highlight, user profile avatar with role badge, and theme toggle.
2. **Given** a user switching between dark and light themes, **When** they trigger the theme toggle, **Then** all design tokens (backgrounds, surfaces, borders, typography, card shadows) transition smoothly without visual flash or contrast loss.
3. **Given** a mobile device viewport (<768px), **When** the user opens the application, **Then** the primary navigation transitions to a persistent ergonomic bottom navigation dock (providing one-touch thumb access to Catálogo, Ensayo, Roadmap, and Profile) with a "More" slide-over drawer for administrative tools and settings.

---

### User Story 2 - Repertoire Catalog & Song Discovery Experience (Priority: P2)

As a Worship Leader or Band Member, I want a card-based Song Catalog page (`/`) featuring spotlight interactive cards, dynamic search with instant filtering (by key, tempo, tags), and clear arrangement metrics so that I can quickly explore, identify, and select songs for worship services.

**Why this priority**: Song discovery and catalog browsing is the primary daily entry point for musicians and worship planners preparing weekly worship sets.

**Independent Test**: Can be tested by navigating to `/`, inspecting the song grid, hovering over cards to verify interactive spotlight elevation and badge styling, searching by title/artist, and filtering by canonical keys and labels.

**Acceptance Scenarios**:

1. **Given** a user on the main catalog page (`/`), **When** the page renders, **Then** each song is presented as a card displaying title, artist, original key badge, practice key pill, BPM indicator, and assigned repertoire tags with accessible contrast.
2. **Given** a user moving their cursor across a song card, **When** hovering over the card surface, **Then** a subtle spotlight reflection illuminates the card boundary and elevates the card slightly without layout shift.
3. **Given** an active filter query returning 0 songs, **When** no songs match the criteria, **Then** an animated empty state card with a clear reset button is displayed.

---

### User Story 3 - Interactive Rehearsal Studio & Song Detail UI (Priority: P3)

As a Vocalist or Instrumentalist, I want an immersive Song Detail (`/songs/[id]`) and Rehearsal Player (`/songs/[id]/practice`) interface featuring high-contrast chord/lyric typography, synchronized video rehearsal player with section markers, and a responsive role practice matrix with instant status toggles so that I can rehearse effectively without visual distractions.

**Why this priority**: Delivering an inspiring, readable, and functional rehearsal experience directly improves team readiness and musical excellence on Sunday mornings.

**Independent Test**: Can be tested by opening `/songs/[id]/practice`, verifying the video player alignment with section timestamp pills, toggling personal practice readiness (Ready / Practicing / Pending) with immediate visual feedback, and inspecting chord-above-lyrics formatting in low-light dark mode.

**Acceptance Scenarios**:

1. **Given** a musician in the Rehearsal Studio (`/songs/[id]/practice`), **When** they click a section timestamp badge (e.g., Verse 1, Chorus), **Then** the synchronized rehearsal video seeks immediately to that timestamp and highlights the active section marker.
2. **Given** a vocalist reviewing the Role Matrix on `/songs/[id]`, **When** they inspect vocal assignments (First, Second, Third Voice), **Then** their assigned part is visually emphasized with their personal practice status pill and harmony notes.
3. **Given** low-light rehearsal or stage conditions, **When** Dark Mode is active, **Then** chord symbols are displayed with vibrant, luminous Amber accent styling (`--chord-accent`) positioned directly above high-contrast white lyric text on a dark matte surface.
4. **Given** a musician using a tablet on a music stand in `/songs/[id]/practice`, **When** interacting with the stage utility bar, **Then** they can transpose chords in real-time by +/- semitones, increase/decrease chord sheet font size, and activate smooth hands-free auto-scrolling with adjustable speed.
5. **Given** a musician in `/songs/[id]/practice`, **When** they click the Fullscreen Stage Mode toggle, **Then** the interface transitions into distraction-free fullscreen, hides application navigation bars, and acquires a Screen Wake Lock to prevent tablet display dimming or auto-sleep while active.

---

### User Story 4 - Creation, Management & Roadmap Experience (Priority: P4)

As an Administrator or Worship Leader, I want structured, modern form interfaces for Song Creation/Editing (`/songs/new`, `/songs/[id]/edit`), administrative management consoles (`/admin/users`, `/admin/labels`), and the Strategic Roadmap hub (`/roadmap`) featuring animated progress timelines, collapsible milestone drawers, and responsive data tables so that administrative workflows are effortless and transparent.

**Why this priority**: Eliminates administrative friction, ensures data integrity during repertoire entry, and makes long-term ministry planning visually engaging for the entire team.

**Independent Test**: Can be tested by opening `/songs/new` to verify accordion form sections and YouTube preview, inspecting `/roadmap` to test milestone card expand/collapse and volunteer voting, and testing `/admin/users` data tables.

**Acceptance Scenarios**:

1. **Given** an administrator creating a new song on `/songs/new`, **When** they paste a YouTube URL, **Then** an instant preview card renders the video thumbnail and title metadata.
2. **Given** a team member viewing `/roadmap`, **When** they inspect the 4 sequential phases, **Then** animated progress bars display completion percentages, milestone containers expand smoothly on demand, and one-click volunteer interest voting reflects instant feedback.
3. **Given** an administrator managing users on `/admin/users`, **When** interacting with user lists, **Then** records are presented in a responsive, styled data table with role badges and interactive action dialogs.

---

### User Story 5 - Authentication & First Impression Experience (Priority: P5)

As a team member logging in, I want an aesthetically compelling, secure Login page (`/login`) featuring animated background atmosphere, floating card container, and clear validation feedback so that the initial impression of WorshipFlow is trustworthy and modern.

**Why this priority**: Sets the visual tone and professional standard for the entire platform from the very first user interaction.

**Independent Test**: Can be tested by navigating to `/login`, verifying the ambient background effect and centered card layout, and submitting invalid credentials to verify inline error rings and feedback.

**Acceptance Scenarios**:

1. **Given** a user accessing `/login`, **When** the page renders, **Then** they see a centered authentication card with backdrop blur and subtle border glow positioned over a calm ambient background gradient.
2. **Given** invalid login credentials submitted, **When** submission fails, **Then** the form fields display high-visibility error rings with clear inline error messages without full-page reloads.

---

### Edge Cases

- **Reduced Motion Settings**: When a user or operating system has `prefers-reduced-motion` enabled, all non-essential animations (spotlight cards, text animations, gradient pulses) are disabled, falling back to instant, accessible state transitions.
- **High-Glare / Bright Ambient Lighting**: When the application is viewed on outdoor stages or under direct sanctuary lights, the light theme maintains strict 4.5:1 WCAG contrast ratios across all chord charts and typography.
- **Tablet / Music Stand Orientation**: When a tablet or mobile device rotates between landscape and portrait orientations during rehearsal, the chord/lyric view adjusts dynamically without causing scroll jumps or video restarts.
- **Touchscreen Device Fallbacks**: On touch devices lacking mouse hover capability, interactive card spotlight and hover effects degrade gracefully to tap-active touch states without phantom clicks.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST implement a unified design token architecture based on semantic CSS variables supporting both Dark and Light themes:
  - Base tokens: `background`, `foreground`, `card`, `card-foreground`, `popover`, `popover-foreground` using Deep Slate/Zinc neutrals.
  - Brand tokens: `primary`, `primary-foreground` (Indigo brand palette), `secondary`, `secondary-foreground`, `accent`, `accent-foreground`, and a dedicated `chord-accent` (luminous Amber) for stage music legibility.
  - Feedback tokens: `muted`, `muted-foreground`, `destructive`, `destructive-foreground`, `border`, `input`, `ring`.
  - Geometry tokens: standardized border radii (`radius-sm`, `radius-md`, `radius-lg`, `radius-full`).
- **FR-002**: The system MUST support dual-theme styling (Dark Mode and Light Mode) defaulting out-of-the-box to Dark Mode for sanctuary/stage environments, with smooth transition styling and an accessible theme toggle switch in the App Shell navigation.
- **FR-003**: The system MUST provide standardized reusable component primitives across all views:
  - **Buttons**: Primary, Secondary, Destructive, Outline, Ghost, and Icon-only variants with distinct focus and hover states.
  - **Cards**: Base Card and Spotlight Card (featuring subtle cursor-tracking radial spotlight reflection).
  - **Badges / Pills**: Distinct visual styles for Musical Keys, Repertoire Labels, User Roles (`ADMIN`, `MEMBER`), and Practice Statuses (`READY`, `PRACTICING`, `PENDING`).
  - **Form Controls**: Text inputs, number pickers, dropdown selects, and textareas with unified border, focus ring, and validation error styling.
  - **Overlays**: Accessible Modal Dialogs and Slide-Over Drawers with backdrop blur (`backdrop-filter`) and focus trapping.
- **FR-004**: The system MUST provide a standardized App Shell layout across all application pages containing:
  - Persistent top navigation header with ministry insignia and animated accent.
  - Quick-navigation links to Catálogo (`/`), Roadmap (`/roadmap`), Admin (`/admin/*`), and Nueva Canción (`/songs/new`).
  - User identity avatar with active role badge.
  - Theme mode toggle switch (Dark/Light).
  - Responsive mobile layout (<768px) featuring a persistent thumb-accessible Bottom Navigation Dock (Catálogo, Ensayo, Roadmap, Profile) and a "More" slide-over drawer for Admin consoles and global settings.
- **FR-005**: The system MUST specify and format the Repertoire Catalog view (`/`):
  - Sticky search and filter header with debounced text search, canonical key selector pills, and label filter badges.
  - Responsive grid layout displaying songs as interactive spotlight cards.
  - Song cards displaying Title, Artist, BPM pill, Original Key badge, Practice Key badge, assigned Label pills, and assigned team members count.
  - Empty search state with thematic illustration and filter reset action.
- **FR-006**: The system MUST specify and format the Song Detail view (`/songs/[id]`):
  - Hero arrangement banner with title, artist, key/tempo metrics, and action triggers (Rehearse, Edit).
  - Interactive Role Assignment Matrix table/grid mapping vocal parts (First, Second, Third Voice) and instruments with volunteer avatar, practice status, and harmony notes.
  - Chord chart and lyrics preview section with clean monospace/proportional chord typography.
- **FR-007**: The system MUST specify and format the Rehearsal Studio view (`/songs/[id]/practice`):
  - Full-width, distraction-free practice layout optimized for music stands.
  - Stage utility control bar featuring: real-time key transposition stepper (+/- semitones relative to arrangement key), dynamic font size scaling controls (A- / A+), toggleable hands-free auto-scroll with adjustable speed slider, and a 1-click Fullscreen Stage Mode toggle with Screen Wake Lock integration (preventing display timeout).
  - Embedded synchronized YouTube player with clickable section timestamp markers (Intro, Verse, Chorus, Bridge, Outro).
  - Dedicated chord/lyric reader displaying bold transposable chords parsed from standard ChordPro bracket notation and positioned precisely above lyric syllables.
  - Volunteer practice readiness toggle (`PENDING` → `PRACTICING` → `READY`) with immediate status badge update.
- **FR-008**: The system MUST specify and format Song Creation and Editing views (`/songs/new`, `/songs/[id]/edit`):
  - Sectioned card layout: Basic Metadata (Title, Artist), Musical Attributes (Key, BPM, Time Signature), Media (YouTube URL with live preview thumbnail), and Lyrics/Chords editor supporting standard ChordPro inline bracket notation (e.g., `[G]Amazing [D]grace`) with live formatted preview.
  - Interactive Section Timestamp builder with "Add Timestamp" action and real-time playback verification.
- **FR-009**: The system MUST specify and format the Strategic Roadmap view (`/roadmap`):
  - Visual timeline representing the 4 sequential phases (Foundation, Service Planning, Volunteer Scheduling, Live Stage Mode) with animated progress percentage bars.
  - Expandable milestone accordion cards displaying delivery target horizons, capability deliverables, priority tier pills (`P1`-`P4`), and functional track badges.
  - Interactive volunteer interest voting cards with feedback dialogs and live interest counters.
- **FR-010**: The system MUST specify and format Admin Consoles (`/admin/users`, `/admin/labels`):
  - Clean data table with sortable columns, user role badges, and color-coded repertoire tag pills.
  - Hex color swatch picker for label creation and edit modals.
- **FR-011**: The system MUST specify and format the Authentication view (`/login`):
  - Centered floating glassmorphism card with subtle ambient background gradient animation.
  - Form inputs with floating labels, password visibility toggle, and clear inline validation feedback.
- **FR-012**: The system MUST support accessibility preferences by automatically disabling ambient and hover animations when `prefers-reduced-motion` is detected.

### Key Entities _(Design System Assets & Token Specifications)_

- **DesignTokens**: Represents the semantic variable definitions governing colors, surfaces, typography, radii, and shadows across Dark and Light modes.
- **ComponentPrimitive**: Represents a standardized UI building block (Button, Card, Badge, Modal, Input, Table) ensuring reusable visual consistency.
- **ChordProSheet**: Represents the parsed song chart structure mapping sections (Verse, Chorus, Bridge), lines, lyrics syllables, and bracketed chord markers for transposable rendering.
- **PageLayoutSpec**: Represents the structured visual composition, grid hierarchy, and component arrangement for each application view.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of application pages share an identical design token palette, typography hierarchy, and core component primitive styling.
- **SC-002**: Switching between Dark Mode and Light Mode completes in under 100 milliseconds with zero unstyled flash (FOUC) and zero illegible contrast states.
- **SC-003**: 100% of interactive components (buttons, links, form inputs) comply with WCAG 2.1 AA accessibility standards (minimum 4.5:1 text contrast ratio and 44x44px minimum touch target size on mobile).
- **SC-004**: Musician rehearsal readability satisfaction achieves >95% approval regarding chord and lyric legibility across both dark sanctuary and bright rehearsal environments.
- **SC-005**: Core pages render initial visible content in under 1 second on mobile and desktop devices.

## Assumptions

- **Component Implementation**: Design tokens and component primitives follow semantic conventions (inspired by Shadcn principles and lightweight micro-interactions from React Bits) implemented natively with modern CSS variables without requiring heavy third-party CSS runtimes.
- **Theme Persistence**: User theme preference (Dark / Light) defaults to Dark Mode for immediate stage readiness, and any explicit user toggle is persisted across sessions.
- **Runtime Compatibility**: All UI components and layouts are strictly compatible with WorshipFlow's existing Vinext / React 19 App Router and Cloudflare Workers edge runtime (`workerd`).
- **Reduced Motion Support**: All decorative animations (spotlights, ambient backgrounds) gracefully degrade to static transitions when the user or operating system requests reduced motion.
