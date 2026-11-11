# Data Model & Entity Specifications: WorshipFlow Design System & UI Architecture

**Feature Branch**: `002-design-system-ui` | **Date**: 2026-11-10

This document defines the formal data structures, domain entities, value objects, token definitions, and UI state models that govern the WorshipFlow Design System and its 8 core application views.

---

## 1. Domain Entities & Value Objects (Pure TypeScript)

These entities reside in `src/core/domain/` with zero external dependencies, adhering strictly to Constitution Principle I.

### 1.1 `ChordProSheet` Entity (`src/core/domain/chordpro.ts`)

Represents a parsed worship song chart structured into semantic song sections, lines, chords, and lyric syllables.

```typescript
export interface ChordPair {
  readonly chord: string | null; // e.g. "G", "D/F#", "Em7", or null for lyric-only segments
  readonly lyrics: string; // Syllable segment anchored to the chord
}

export interface ChordProLine {
  readonly lineNumber: number;
  readonly isComment: boolean; // true for section labels like "[Verso 1]", "{comment: Coro}"
  readonly commentText?: string;
  readonly pairs: readonly ChordPair[];
}

export interface ChordProSection {
  readonly sectionId: string; // e.g. "intro", "verse-1", "chorus", "bridge", "outro"
  readonly title: string; // e.g. "Verso 1", "Coro", "Puente"
  readonly timestampSeconds?: number; // Linked timestamp from song arrangement metadata
  readonly lines: readonly ChordProLine[];
}

export interface ChordProSheet {
  readonly title: string;
  readonly artist: string;
  readonly originalKey: string; // Canonical key, e.g. "G"
  readonly sections: readonly ChordProSection[];
  readonly rawText: string; // Original unparsed ChordPro text
}
```

### 1.2 `TranspositionState` Value Object

Represents musical key transposition calculations.

```typescript
export interface TranspositionState {
  readonly originalKey: string; // e.g. "G"
  readonly currentKey: string; // e.g. "A"
  readonly semitoneDelta: number; // e.g. +2 (bounded -11 to +11)
}

export type AccidentalPreference = "sharp" | "flat" | "canonical";
```

### 1.3 `StageRehearsalState` Value Object

Represents the active live rehearsal studio runtime state.

```typescript
export interface StageRehearsalState {
  readonly songId: string;
  readonly transposition: TranspositionState;
  readonly isFullscreen: boolean;
  readonly wakeLockActive: boolean;
  readonly wakeLockSupported: boolean;
  readonly isAutoScrolling: boolean;
  readonly autoScrollSpeed: number; // Pixels per second (range: 10 to 80, default: 28)
  readonly isTemporarilyPaused: boolean; // 3-second pause after touch/wheel event
  readonly stageFontSize: number; // In pixels (range: 16 to 28, default: 20)
  readonly activeSectionId: string | null;
  readonly practiceStatus: "READY" | "PRACTICING" | "PENDING";
}
```

---

## 2. Design System Tokens Model (`src/presentation/theme/tokens.ts`)

Type-safe representations of the CSS custom properties defined in `globals.css`.

### 2.1 `ThemeMode`

```typescript
export type ThemeMode = "dark" | "light";

export interface ThemeContextState {
  readonly theme: ThemeMode;
  readonly isSystem: boolean;
  readonly toggleTheme: () => void;
  readonly setTheme: (theme: ThemeMode) => void;
}
```

### 2.2 Semantic CSS Variable Tokens Schema

```typescript
export interface SemanticColorTokens {
  // Surfaces
  readonly background: string; // Page background
  readonly foreground: string; // High-contrast body text
  readonly card: string; // Card container background
  readonly cardForeground: string; // Card text
  readonly popover: string; // Dropdowns and dialogs background
  readonly popoverForeground: string; // Dropdown text

  // Brand Actions
  readonly primary: string; // Indigo primary action button
  readonly primaryForeground: string; // Pure white text on primary
  readonly secondary: string; // Subdued action surface
  readonly secondaryForeground: string;
  readonly accent: string; // Highlighted element background
  readonly accentForeground: string;

  // Music Stand Specific Tokens
  readonly chordAccent: string; // Luminous Amber in Dark (#fbbf24), Deep Amber in Light (#92400e)
  readonly chordAccentBg: string; // Pill background for light mode legibility
  readonly chordAccentBorder: string; // Subtle border for chord pills

  // Feedback & Form Tokens
  readonly muted: string; // Secondary container background
  readonly mutedForeground: string; // Subtle secondary copy (60% opacity)
  readonly destructive: string; // Red error / delete actions
  readonly destructiveForeground: string;
  readonly border: string; // Container borders
  readonly input: string; // Form field borders
  readonly ring: string; // Focus outline ring
}

export interface GeometryTokens {
  readonly radiusSm: string; // 4px
  readonly radiusMd: string; // 8px
  readonly radiusLg: string; // 12px
  readonly radiusXl: string; // 16px
  readonly radiusFull: string; // 9999px
}

export interface MicroInteractionTokens {
  readonly spotlightColor: string; // Radial gradient color for SpotlightCard
  readonly glowColor: string; // Luminous perimeter color for AnimatedGlow
  readonly auroraIndigo: string; // Primary aurora mesh blob
  readonly auroraPurple: string; // Secondary aurora mesh blob
  readonly auroraSky: string; // Accent aurora mesh blob
}
```

---

## 3. UI Component Primitives Models (`src/presentation/components/ui/`)

### 3.1 Button Primitive

```typescript
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "icon";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly isLoading?: boolean;
  readonly leftIcon?: React.ReactNode;
  readonly rightIcon?: React.ReactNode;
}
```

### 3.2 Badge Primitive

```typescript
export type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "keyOriginal"
  | "keyPractice"
  | "statusReady"
  | "statusPracticing"
  | "statusPending"
  | "roleAdmin"
  | "roleMember"
  | "tierP1"
  | "tierP2"
  | "tierP3"
  | "tierP4";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly variant?: BadgeVariant;
  readonly customColor?: string; // Hex color for user-created repertoire labels
}
```

### 3.3 Modal Dialog Primitive

```typescript
export interface ModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly description?: string;
  readonly children: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly size?: "sm" | "md" | "lg" | "full";
}
```

---

## 4. React Bits Component Specifications (`src/presentation/components/reactbits/`)

### 4.1 `SpotlightCard`

```typescript
export interface SpotlightCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  readonly spotlightColor?: string; // Defaults to "rgba(99, 102, 241, 0.15)" in dark, "rgba(99, 102, 241, 0.08)" in light
  readonly spotlightRadius?: number; // In pixels (default: 300)
  readonly children: React.ReactNode;
}
```

### 4.2 `AuroraBackground`

```typescript
export interface AuroraBackgroundProps
  extends React.HTMLAttributes<HTMLDivElement> {
  readonly children: React.ReactNode;
  readonly showRadialGradient?: boolean;
}
```

### 4.3 `AnimatedGlow`

```typescript
export interface AnimatedGlowProps
  extends React.HTMLAttributes<HTMLDivElement> {
  readonly glowColor?: string;
  readonly spread?: number; // Blur spread in pixels (default: 16)
  readonly children: React.ReactNode;
}
```

---

## 5. App Shell & Navigation Model (`src/presentation/components/layout/`)

### 5.1 Route Configuration

```typescript
export interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly iconName: string;
  readonly requiredRole?: "ADMIN" | "MEMBER";
  readonly showInMobileDock: boolean;
}

export const APP_ROUTES: readonly NavItem[] = [
  { label: "Catálogo", href: "/", iconName: "Music", showInMobileDock: true },
  {
    label: "Ensayo",
    href: "/songs/practice",
    iconName: "PlayCircle",
    showInMobileDock: true,
  },
  {
    label: "Roadmap",
    href: "/roadmap",
    iconName: "Map",
    showInMobileDock: true,
  },
  {
    label: "Nueva Canción",
    href: "/songs/new",
    iconName: "PlusCircle",
    requiredRole: "ADMIN",
    showInMobileDock: false,
  },
  {
    label: "Usuarios",
    href: "/admin/users",
    iconName: "Users",
    requiredRole: "ADMIN",
    showInMobileDock: false,
  },
  {
    label: "Etiquetas",
    href: "/admin/labels",
    iconName: "Tag",
    requiredRole: "ADMIN",
    showInMobileDock: false,
  },
];
```

---

## 6. State Transitions & Validation Rules

### 6.1 Theme Transitions

```text
State: [Dark Mode (Default)]
  ──(User clicks theme toggle)──> [Light Mode]
  Sets cookie: worshipflow_theme=light; Max-Age=31536000
  Toggles DOM class: document.documentElement.classList.add("light")

State: [Light Mode]
  ──(User clicks theme toggle)──> [Dark Mode]
  Sets cookie: worshipflow_theme=dark; Max-Age=31536000
  Toggles DOM class: document.documentElement.classList.remove("light")
```

### 6.2 Practice Readiness State Transitions

```text
[PENDING] (Grey)
  │
  └── User clicks toggle ──> [PRACTICING] (Amber)
                                │
                                └── User clicks toggle ──> [READY] (Emerald)
                                                             │
                                                             └── User clicks toggle ──> [PENDING] (Grey)
```

### 6.3 Rehearsal Auto-Scroll Lifecycle

```text
[IDLE] (auto-scroll disabled)
  │
  ├── User clicks Play Auto-Scroll ──> [SCROLLING] (requestAnimationFrame at N px/s)
  │                                       │
  │                                       ├── User touches screen/scrolls ──> [PAUSED] (3s cooldown timer)
  │                                       │                                      │
  │                                       │                                      └── Timer expires ──> [SCROLLING]
  │                                       │
  │                                       └── User clicks Pause / Reaches bottom ──> [IDLE]
```
