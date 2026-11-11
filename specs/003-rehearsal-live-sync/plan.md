# Implementation Plan: Rehearsal Live Playback Synchronization & Active Section Tracking

**Branch**: `003-rehearsal-live-sync` | **Date**: 2026-11-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-rehearsal-live-sync/spec.md`

## Summary

Enhance the WorshipFlow rehearsal studio (`/songs/[id]/practice`) with live playback synchronization between reference media (YouTube embedded player) and the interactive ChordPro chord sheet. A lightweight 250ms polling loop queries playback time, determines the active musical section in real time based on configured `sectionTimestamps`, applies a high-contrast active glow to the section, and smoothly auto-scrolls the viewport to maintain focus on the playing section while respecting musician manual touch/scroll gestures with a 3-second buffer.

## Technical Context

**Language/Version**: TypeScript 5.8 / 7.0, Bun runtime 1.4.4  
**Primary Dependencies**: React 19.3, Next.js / Vinext 1.3, Vite 8.3, Tailwind CSS v4, YouTube Iframe API  
**Storage**: Cloudflare D1 via Drizzle ORM (existing `sectionTimestamps` JSON column on `songs` table; zero schema migrations required)  
**Testing**: `bun test` (unit tests for pure section matcher algorithms, hook interaction tests, and simulated DOM event dispatch)  
**Target Platform**: Cloudflare Workers edge runtime (`workerd`), desktop & tablet browsers (iPad/Android stage tablets)  
**Project Type**: Full-stack web application (App Router RSC + Client Component rehearsal studio)  
**Performance Goals**: Time polling interval <= 250ms, active section switch latency < 300ms, smooth scroll animation 60fps, CPU usage < 1% on mobile tablets  
**Constraints**: Pure domain preservation (pure matching functions in `src/core/domain/chordpro.ts` or `src/core/domain/rehearsal.ts`), zero Node.js-only imports, clean timer cleanup on unmount, touch gesture override protection (3s pause)  
**Scale/Scope**: 1 unified rehearsal studio page, ~3 component/hook updates, 0 database schema changes

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                  | Requirement                                | Status   | Notes                                                                         |
| :------------------------- | :----------------------------------------- | :------- | :---------------------------------------------------------------------------- |
| **I. Clean Architecture**  | Pure domain, strict inward dependencies    | **PASS** | Pure matching calculation in domain; UI state & timers in presentation hooks. |
| **II. Unified D1**         | No schema drift, single D1 engine          | **PASS** | No new database tables needed. Reads existing song arrangement data.          |
| **III. Edge Runtime**      | Cloudflare Workers & browser compatibility | **PASS** | Runs in browser client component (`"use client"`), no Node.js built-ins.      |
| **IV. Architecture Gates** | Automated CI quality gates pass            | **PASS** | `bun run check:arch`, `bun run check`, and `bun test` run and pass.           |
| **V. Domain RBAC**         | Secure role-based authorization            | **PASS** | Rehearsal view accessible to all authenticated church team members.           |

## Project Structure

### Documentation (this feature)

```text
specs/003-rehearsal-live-sync/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── rehearsal-sync.md
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code Layout

```text
src/
├── core/
│   └── domain/
│       ├── chordpro.ts                  # Pure ChordPro parsing & key transposition
│       └── rehearsal-sync.ts            # Pure section timestamp matching functions
├── presentation/
│   ├── hooks/
│   │   ├── use-playback-sync.ts         # Real-time player polling & active section resolution
│   │   └── use-auto-scroll.ts           # Extended with smooth section snapping & gesture pause
│   └── components/
│       ├── RehearsalPlayer.tsx          # Rehearsal orchestrator integrating video & chord sheet
│       └── rehearsal/
│           ├── chord-sheet.tsx          # Section container with reactive active highlights & ref anchors
│           └── stage-utility-bar.tsx    # Utility controls with Auto-Follow toggle indicator
tests/
└── unit/
    ├── domain/
    │   └── rehearsal-sync.test.ts       # Deterministic time-to-section matching tests
    └── presentation/
        └── use-playback-sync.test.ts    # Polling, loop boundaries, and debounce tests
```

**Structure Decision**: Single web application layout following WorshipFlow's established Clean Architecture directory convention.

## Complexity Tracking

> No constitution violations detected. Zero unnecessary complexity introduced.

| Potential Complexity    | Why Needed                                               | Simpler Alternative Rejected Because                                                        |
| :---------------------- | :------------------------------------------------------- | :------------------------------------------------------------------------------------------ |
| 250ms timer polling     | YouTube Iframe API lacks native `timeupdate` event       | `onStateChange` only fires on pause/play; `requestAnimationFrame` wastes battery on tablets |
| 3s manual scroll buffer | Prevents scroll-fighting when user inspects later chords | Without buffer, script forcefully yanks viewport away from the musician                     |
