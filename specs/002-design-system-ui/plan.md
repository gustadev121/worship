# Implementation Plan: WorshipFlow Design System & Page UI Architecture

**Branch**: `002-design-system-ui` | **Date**: 2026-11-10 | **Spec**: [specs/002-design-system-ui/spec.md](file:///home/gustadev121/Workspace/Non-Profit/cjn/worship/specs/002-design-system-ui/spec.md)

**Input**: Feature specification from `specs/002-design-system-ui/spec.md`

## Summary

Deliver a comprehensive, modern Shadcn-inspired design system with React Bits micro-interactions for WorshipFlow across all 8 core application views (Catalog, Song Detail, Rehearsal Studio, Song New/Edit, Roadmap, Admin Users, Admin Labels, Login). The architecture introduces a unified semantic CSS token system featuring a dark-first stage-ready default (Deep Slate/Zinc neutrals, Indigo brand actions, luminous Amber chord highlights), zero-FOUC edge theme persistence, an ergonomic App Shell (desktop header + mobile bottom dock), transposable ChordPro rendering, hands-free rehearsal controls (auto-scroll, Screen Wake Lock, Fullscreen Stage Mode), and strict WCAG 2.1 AA accessibility.

## Technical Context

**Language/Version**: TypeScript 5.8+ / Bun 1.2+
**Primary Dependencies**: Vinext 1.3 / React 19.3, Drizzle ORM 0.45, Zod 4.6, Jose 6.2 (Native modern CSS custom properties + React Bits micro-interactions, no runtime-heavy CSS-in-JS)
**Storage**: Cloudflare D1 (SQLite) via Drizzle ORM repositories
**Testing**: Bun test runner (`bun test`) with architecture verification (`bun run check:arch`) and Biome linter (`bun run check`)
**Target Platform**: Cloudflare Workers edge runtime (`workerd`) + modern web browsers (Desktop, Tablet, Mobile)
**Project Type**: Full-stack edge web application (React Server Components + interactive Client Components)
**Performance Goals**: Initial render < 1s on mobile, theme toggle < 100ms with zero unstyled flash (FOUC), 60fps micro-interaction animations
**Constraints**: Strict WCAG 2.1 AA (minimum 4.5:1 text contrast), `prefers-reduced-motion` compliance, 4-layer clean architecture purity (zero framework dependencies in core domain), zero Node.js built-ins in request handlers
**Scale/Scope**: 8 application routes, unified App Shell, 12+ component primitives, ChordPro parsing/transposition domain utility, tablet music stand rehearsal experience

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                                | Requirement                                                                                                                                               | Plan Alignment                                                                                                                                                                                        | Status   |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **I. Strict 4-Layer Clean Architecture** | `src/core/domain` pure TypeScript (zero dependencies); `src/core/application` imports domain + Zod only; UI strictly in `src/presentation` and `src/app`. | ChordPro parser & transposition logic located in `src/core/domain/chordpro.ts` with pure TS. Component primitives and tokens strictly in `src/presentation/components/ui/` and `src/app/globals.css`. | **PASS** |
| **II. Unified D1 Persistence**           | Cloudflare D1 exclusively via Drizzle ORM. Zero DB drift.                                                                                                 | All data-driven UI pages (Catalog, Song Detail, Roadmap, Admin) consume existing Application layer ports and Drizzle repositories.                                                                    | **PASS** |
| **III. Edge-First Runtime Isolation**    | Server code runs seamlessly on `workerd` with zero Node.js built-ins. Cloudflare bindings isolated to `get-request-env.ts`.                               | Browser-only APIs (Screen Wake Lock, Fullscreen API, localStorage) guarded in `"use client"` components with `typeof window !== 'undefined'`. Theme resolved via lightweight cookie on edge SSR.      | **PASS** |
| **IV. Automated Architecture Gates**     | Passing `check:arch`, `check` (Biome), and `bun test`.                                                                                                    | All new domain utilities (ChordPro, transposition) backed by unit tests; automated gates run on CI.                                                                                                   | **PASS** |
| **V. Domain RBAC & Secure Identity**     | Authorization enforced at Application layer; UI reflects permissions via role badges and conditional edit actions.                                        | App Shell and admin routes verify session role (`ADMIN` vs `MEMBER`); destructive controls hidden/disabled for unauthorized roles.                                                                    | **PASS** |

## Project Structure

### Documentation (this feature)

```text
specs/002-design-system-ui/
├── spec.md              # Feature specification with clarifications
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0 research findings and technical decisions
├── data-model.md        # Phase 1 data model & design token entities
├── quickstart.md        # Phase 1 validation scenarios & run guide
├── contracts/           # Phase 1 UI component contracts & route specifications
│   ├── design-tokens.md # Semantic CSS tokens & theme contracts
│   ├── app-shell.md     # Header, mobile dock, navigation contracts
│   ├── components.md    # UI primitives & React Bits component contracts
│   └── routes-ui.md     # Layout & interaction contracts for all 8 views
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
src/
├── core/
│   ├── domain/
│   │   ├── chordpro.ts             # Pure domain ChordPro entity, parser, and transposition
│   │   └── ... (existing domain entities)
│   └── application/
│       └── ... (existing application ports & use cases)
├── infrastructure/
│   └── ... (existing Drizzle repositories & adapters)
├── presentation/
│   ├── components/
│   │   ├── ui/                     # Shadcn-inspired primitives (Button, Card, Badge, Modal, Input, Table)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── input.tsx
│   │   │   ├── modal.tsx
│   │   │   └── table.tsx
│   │   ├── reactbits/              # React Bits micro-interaction components
│   │   │   ├── spotlight-card.tsx  # Radial cursor spotlight reflection
│   │   │   ├── aurora-bg.tsx       # Subtle ambient background gradient
│   │   │   └── animated-glow.tsx   # Subtle border glow & insignia pulse
│   │   ├── layout/                 # Global App Shell & navigation
│   │   │   ├── app-shell.tsx
│   │   │   ├── navbar.tsx
│   │   │   ├── mobile-dock.tsx     # Persistent bottom navigation dock
│   │   │   └── theme-toggle.tsx    # Accessible dark/light toggle
│   │   ├── rehearsal/              # Rehearsal Studio components
│   │   │   ├── chord-sheet.tsx     # High-contrast ChordPro reader
│   │   │   ├── stage-utility-bar.tsx # Transposition, font scaling, auto-scroll, Wake Lock
│   │   │   └── section-markers.tsx # Clickable timestamp pills
│   │   └── ... (existing feature components)
│   ├── hooks/
│   │   ├── use-theme.ts            # Client-side theme switching & cookie sync
│   │   ├── use-screen-wake-lock.ts # Screen Wake Lock API wrapper
│   │   └── use-auto-scroll.ts      # Smooth rehearsal auto-scroll hook
│   └── theme/
│       └── tokens.ts               # Type-safe token helpers & definitions
└── app/
    ├── globals.css                 # Semantic CSS custom properties (Dark & Light tokens)
    ├── layout.tsx                  # Root layout injecting App Shell & SSR theme class
    ├── page.tsx                    # Repertoire Catalog (spotlight cards & search)
    ├── login/page.tsx              # Login (Aurora background & glassmorphism card)
    ├── songs/
    │   ├── new/page.tsx            # Song Creation (ChordPro editor with preview)
    │   └── [id]/
    │       ├── page.tsx            # Song Detail (Role matrix & chord preview)
    │       ├── edit/page.tsx       # Song Editing
    │       └── practice/page.tsx   # Rehearsal Studio (Fullscreen Stage Mode)
    ├── roadmap/page.tsx            # Strategic Roadmap (animated progress & milestones)
    └── admin/
        ├── users/page.tsx          # User management data table
        └── labels/page.tsx         # Repertoire label management & swatch picker
```

**Structure Decision**: Standard 4-layer clean architecture layout. All UI tokens, component primitives, React Bits effects, App Shell, and stage rehearsal tools are strictly contained in `src/presentation` and `src/app`, while the pure ChordPro parsing and transposition logic is encapsulated in `src/core/domain/chordpro.ts`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

_No violations detected. Full adherence to Constitution Principles I through V._
