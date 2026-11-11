---

name: WorshipFlow
description: Modern, dark-first church worship ministry repertoire and rehearsal design system
colors:
primary: "#6366f1"
primary-hover: "#4f46e5"
primary-foreground: "#ffffff"
background: "#090d16"
foreground: "#f8fafc"
card: "#0f172a"
card-foreground: "#f8fafc"
card-elevated: "#162032"
secondary: "#1e293b"
secondary-hover: "#334155"
secondary-foreground: "#f8fafc"
chord-accent: "#fbbf24"
chord-accent-hover: "#f59e0b"
chord-accent-foreground: "#1c1917"
chord-accent-bg: "rgba(251, 191, 36, 0.12)"
chord-accent-border: "rgba(251, 191, 36, 0.35)"
muted: "#1e293b"
muted-foreground: "#94a3b8"
destructive: "#ef4444"
destructive-hover: "#dc2626"
destructive-foreground: "#ffffff"
border: "#1e293b"
border-subtle: "#162032"
input: "#1e293b"
input-border: "#334155"
status-ready: "#22c55e"
status-practicing: "#f59e0b"
status-pending: "#94a3b8"
role-admin: "#818cf8"
role-member: "#94a3b8"
typography:
display:
fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
fontSize: "2.25rem"
fontWeight: 800
lineHeight: 1.2
letterSpacing: "-0.025em"
headline:
fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
fontSize: "1.5rem"
fontWeight: 700
lineHeight: 1.3
letterSpacing: "-0.02em"
title:
fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
fontSize: "1.125rem"
fontWeight: 600
lineHeight: 1.4
letterSpacing: "-0.01em"
body:
fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
fontSize: "0.875rem"
fontWeight: 400
lineHeight: 1.5
letterSpacing: "0em"
mono:
fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
fontSize: "0.875rem"
fontWeight: 600
lineHeight: 1.4
letterSpacing: "0em"
rounded:
sm: "0.25rem"
md: "0.5rem"
lg: "0.75rem"
xl: "1rem"
full: "9999px"
spacing:
xs: "0.25rem"
sm: "0.5rem"
md: "1rem"
lg: "1.5rem"
xl: "2rem"
components:
button-primary:
backgroundColor: "{colors.primary}"
textColor: "{colors.primary-foreground}"
rounded: "{rounded.md}"
padding: "0.5rem 1rem"
button-primary-hover:
backgroundColor: "{colors.primary-hover}"
card-bordered:
backgroundColor: "{colors.card}"
textColor: "{colors.card-foreground}"
rounded: "{rounded.xl}"
padding: "1.25rem 1.5rem"
---

# WorshipFlow Design System

## Overview

WorshipFlow's design system is engineered for worship ministry practitioners in church environments. Built with a dark-first philosophy, it optimizes for low-light legibility on music stands, rapid chord transposition, and focused administrative planning without visual noise.

- **Primary Mode**: Operate (catalog management, rehearsal studio, role assignment, roadmap).
- **Core Technology**: Tailwind CSS v4 (@theme tokens), Shadcn UI primitives, Inter & Monospace typography.

## Colors

The palette uses a slate/zinc foundation paired with high-intent semantic accents:

- **Background & Surfaces**: Deep Charcoal (`#090d16`), Card Surface (`#0f172a`), Elevated Surface (`#162032`).
- **Brand Action**: Luminous Indigo (`#6366f1` / hover `#4f46e5`) for active links, primary buttons, and focus rings.
- **Stage Accent (Chords & Timestamps)**: High-contrast Amber (`#fbbf24` / hover `#f59e0b`) specifically reserved for musical chord names, practice key badges, and timeline indicators.
- **Practice Status Tokens**:
  - `READY`: Emerald Green (`#22c55e`)
  - `PRACTICING`: Warm Amber (`#f59e0b`)
  - `PENDING`: Neutral Slate (`#94a3b8`)
- **Semantic Feedback**: Destructive Crimson (`#ef4444`) for deletion and critical warnings; Subtle Border (`#1e293b`).

## Typography

Typography prioritizes functional hierarchy and instant scanability:

- **Display & Titles**: `Inter`, bold/extrabold with tight letter-spacing (`-0.025em`) for song titles and primary headers.
- **Body & Labels**: `Inter`, clean regular/medium weight (0.875rem / 14px) for descriptions and table cells.
- **Musical Chords & Timestamps**: Monospace stack (`ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`) for aligned chord sheets, BPM counters, and rehearsal timestamps.

## Layout

- **Container Constraint**: Primary app views use `max-w-6xl mx-auto px-4 sm:px-6` for balanced margins.
- **Data Densities**:
  - Tables (e.g. `RoleMatrix`, User Management): Full container width, generous cell padding (`py-3 px-4`), zero horizontal overflow scrollbar on desktop viewports.
  - Multi-Column Grids: 2-column balanced layouts for split preview widgets (50% / 50% for Section Markers and Chord Sheet preview).
- **Mobile Ergonomics**: Persistent bottom navigation bar on mobile viewports (<768px) with thumb-reachable primary targets.

## Elevation & Depth

- **Single Elevation Principle**: Follows the strict rule of declaring elevation once (either subtle border `border border-border/80` OR soft shadow `shadow-xs`, never pairing heavy borders with heavy drop-shadows).
- **Interactive Micro-Interactions**: Spotlight Card hover reflections with subtle mouse coordinate tracking on desktop; disabled on coarse touch pointers and when `prefers-reduced-motion` is active.

## Shapes

- **Base Radii**:
  - Buttons & Inputs: `rounded-lg` (0.5rem / 8px).
  - Cards & Dialogs: `rounded-2xl` (1rem / 16px).
  - Badges & Pills: `rounded-full` (9999px).
- **Form Controls**: Crisp 1px borders with explicit 2px focus ring using brand `--color-primary`.

## Components

- **Button Primitives**: `primary`, `secondary`, `outline`, `ghost`, `destructive`, and `icon` variants with built-in loading spinners.
- **Badge Primitives**: Semantic status pills with optional `dot` indicator (`statusReady`, `statusPracticing`, `statusPending`, `keyOriginal`, `keyPractice`).
- **Table Primitives**: Clean responsive wrappers (`wf-table-container`) with sticky headers and subtle hover highlighting (`hover:bg-muted/20`).
- **Modal Dialogs**: Backdrop blur with centered dismissible sheet and accessible escape-key handling.

## Do's and Don'ts

### Do's

- **DO** use the amber chord token (`--chord-accent`) exclusively for musical notation, chords, and practice key indicators.
- **DO** render vector SVG icons at standard 14–16px dimensions aligned to text baselines.
- **DO** keep Role Matrix and tables full-width to prevent unnecessary horizontal scrolling.
- **DO** provide Screen Wake Lock during active fullscreen rehearsal mode.

### Don'ts

- **DON'T** use raw emoji or Unicode glyphs (`⚡`, `▶`, `✓`, `⋯`, `○`) for interactive UI controls or statuses.
- **DON'T** use unnecessary kickers or eyebrow subtitles above primary page headings.
- **DON'T** nest borders inside borders with conflicting border radii.
- **DON'T** rely on bright white backgrounds on stage interfaces where glare blinds performers.
