# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary User**: Worship Leaders, Music Directors, and Pastors preparing weekly worship setlists, managing song arrangements, and coordinating band personnel.
- **Secondary Users**: Worship team musicians (guitarists, keyboardists, drummers, bassists) and vocalists (leads, harmonies, backing vocals) preparing personal parts for rehearsal and Sunday services.

## Product Purpose

WorshipFlow exists to streamline church worship ministry operations by unifying song repertoire management, vocal/instrument part assignments, rehearsal readiness tracking, and long-term capability planning into a distraction-free, stage-ready platform.

## Positioning

Unlike generic church management suites (e.g. Planning Center Services) or disconnected chord sheet apps (e.g. SongSelect, Ultimate Guitar), WorshipFlow integrates deep multi-part vocal/instrumental matrices with synchronized rehearsal media (ChordPro + YouTube playback + section markers) and a transparent community-driven ministry roadmap.

## Operating Context

- **Midweek Preparation**: Worship leaders authoring songs, setting keys, and assigning parts. Musicians reviewing their assigned parts and listening to reference tracks.
- **Midweek Rehearsal**: Fast-paced stage or rehearsal room with tablets on music stands, low-light ambient conditions, needing quick chord transposition, wake-lock enabled fullscreen, and instant section jumping.
- **Sunday Services**: Rapid execution, reliable offline-ready view, zero latency, high-contrast dark mode to avoid stage glare.

## Capabilities and Constraints

- **Repertoire Management**: Song catalog with title, artist, original key, practice key, BPM, time signature, and custom tags/labels.
- **ChordPro Notation**: Chords-above-lyrics parsing with semitone transposition (+/- 12 semitones) and section markers (Verse, Chorus, Bridge, etc.).
- **Part & Role Matrix**: Vocal roles (First Voice/Lead, Second Voice/High Harmony, Third Voice/Low Harmony, Backing Vocals) and Instrumental roles (Keyboard, Acoustic/Electric Guitar, Bass, Drums) with readiness states (`READY`, `PRACTICING`, `PENDING`).
- **Synchronized Rehearsal Studio**: YouTube video sync with clickable section timestamps and hands-free auto-scrolling with wake lock.
- **Strategic Product Roadmap**: 4 sequential phases (Phase 1: Foundation, Phase 2: Service Planning & Setlists, Phase 3: Volunteer Scheduling, Phase 4: Live Stage Mode) with volunteer feature voting.
- **Technical Stack**: Bun runtime, Next.js / Vinext, SQLite / Drizzle ORM, Tailwind CSS v4, Shadcn UI primitives, Biome code quality.

## Brand Commitments

- **Name**: WorshipFlow (WorshipFlow v0.2).
- **Aesthetic Tone**: Focused, reverent, precise, modern dark-first stage tool.
- **Color Accent**: Deep Slate/Zinc neutrals with Indigo action points and luminous Amber chord pills.
- **Restraint**: Zero distracting clutter or animations during rehearsal mode; high legibility on mobile stands.

## Evidence on Hand

- Core Domain Models: `src/core/domain/chordpro.ts`, `src/core/domain/song.ts`, `src/core/domain/role-assignment.ts`.
- Specifications: `specs/001-product-roadmap/spec.md`, `specs/002-design-system-ui/spec.md`.
- Test Suites: 139 passing automated unit and integration tests (`tests/`).

## Product Principles

1. **Rehearsal-First Reliability**: Stage and rehearsal interfaces must prioritize distraction-free legibility, rapid key transposition, and tablet screen-lock resilience over decorative complexity.
2. **Clarity of Role & Readiness**: Every volunteer should know immediately what part they sing or play and whether their part is ready for Sunday.
3. **Transparent Ministry Roadmap**: Feature evolution and phase dependencies are public and visible to the whole ministry team.
4. **Offline and Low-Light Readiness**: Default to low-glare dark mode that performs smoothly in dimly lit auditoriums.

## Accessibility & Inclusion

- Dark-first high contrast ratio (minimum 4.5:1 for body copy and chords against dark slate backgrounds).
- Responsive touch targets (minimum 44x44px for tablet and mobile stand interactions).
- Full keyboard navigation and semantic ARIA labeling for tables, dialogs, and stage controls.
