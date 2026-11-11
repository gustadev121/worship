# Quickstart Validation Guide: WorshipFlow Design System & UI Architecture

**Feature Branch**: `002-design-system-ui` | **Date**: 2026-11-10

This guide documents runnable validation scenarios and verification procedures to prove the design system, React Bits micro-interactions, and 8 application views work correctly end-to-end.

---

## 1. Prerequisites & Environment Setup

Ensure dependencies are installed and test database state is initialized:

```bash
# Verify Bun runtime and packages
bun --version
bun install

# Verify architecture boundaries and pure domain constraints
bun run check:arch

# Verify Biome linting and formatting
bun run check

# Execute existing test suite
bun test
```

Expected Outcome: All architecture checks pass (`[arch] OK: core layers are pure`), zero linter warnings, and 100% of tests pass.

---

## 2. Automated Validation Scenarios

### Scenario 1: Architecture Boundary & Core Purity Gate

Verifies that all new design tokens, UI components, and React Bits primitives live strictly in Presentation and App layers, while ChordPro logic remains 100% pure TypeScript.

```bash
bun scripts/check-architecture.ts
```

- **Expected Outcome**: Exit code 0. Zero imports of framework or presentation packages inside `src/core/domain/chordpro.ts` or `src/core/application/`.

---

### Scenario 2: Pure Domain ChordPro Parser & Transposition Unit Tests

Verifies that ChordPro bracket syntax is parsed accurately and transposed across chromatic semitone deltas.

```bash
bun test tests/unit/domain/chordpro.test.ts
```

- **Validation Checklist**:
  - [x] Correctly parses `{comment: Coro}` and `[G]Sub[D]lime [Em]gracia`.
  - [x] Generates aligned `ChordPair` tokens with precise lyric syllables.
  - [x] Transposes key of G by +2 semitones to key of A (`G -> A`, `D -> E`, `Em -> F#m`).
  - [x] Correctly transposes slash chords (e.g. `D/F#` +2 semitones -> `E/G#`).
  - [x] Preserves clean lyric-only lines when no chords are present.

---

### Scenario 3: Zero-FOUC Edge SSR Theme Resolution

Verifies that initial HTML response streams with pre-tagged theme classes from Cloudflare Workers edge runtime without white flashes.

```bash
# Start local development server with Miniflare / workerd bindings
bun run dev:vinext
```

1. **Dark Theme Default (No Cookie)**:
   - Request `curl -I http://localhost:3000/`
   - Inspect response: `Set-Cookie` defaults to dark or HTML payload starts with `<html class="" data-theme="dark">`.
   - Page background renders in Deep Slate (`#090d16`) with zero white flash.
2. **Light Theme Toggle**:
   - In browser, click the theme switch in the header.
   - Verify `document.documentElement` gains `.light`.
   - Inspect cookie: `worshipflow_theme=light; Path=/; Max-Age=31536000`.
   - Reload page (`Cmd+R` / `F5`): page reloads instantly in light theme with zero flash.

---

### Scenario 4: App Shell & Responsive Mobile Dock Navigation

Verifies responsive navigation adaptation between desktop and mobile viewport sizes.

1. **Desktop Viewport (`>=768px`)**:
   - Header is fixed at top (`h-16`).
   - Insignia displays subtle breathing glow.
   - Navigation links (`Catálogo`, `Roadmap`, `Admin`) display active route indicator.
   - Mobile dock is hidden (`display: none`).
2. **Mobile Viewport (`<768px`)**:
   - Header collapses to compact brand mark and theme toggle.
   - Fixed Bottom Navigation Dock appears anchored to bottom with `env(safe-area-inset-bottom)`.
   - 4 thumb touch targets (`>=48x48px`): `Catálogo`, `Ensayo`, `Roadmap`, `Más`.
   - Tapping `Más` smoothly slides up the bottom sheet drawer displaying user profile, role badge (`ADMIN`/`MEMBER`), and admin links.

---

### Scenario 5: React Bits Micro-Interactions & Reduced-Motion Accessibility

1. **SpotlightCard on Catalog (`/`)**:
   - Move cursor over any song card on the catalog grid.
   - Verify a subtle radial spotlight gradient tracks cursor position at 60fps without layout jitter.
2. **Touchscreen Device Fallback**:
   - Emulate touch device in DevTools (`pointer: coarse`).
   - Verify mouse event listeners are disabled and card renders with a clean static border.
3. **`prefers-reduced-motion` Enforcement**:
   - In Chrome DevTools: `Rendering` > `Emulate CSS media feature prefers-reduced-motion: reduce`.
   - Verify `AuroraBackground` on `/login` stops all keyframe drift and renders a static, calm gradient.
   - Verify `AnimatedGlow` in App Shell freezes breathing pulses.

---

### Scenario 6: Rehearsal Studio Stage Ergonomics (`/songs/[id]/practice`)

1. **Chord Sheet Readability**:
   - Chords render in luminous Amber (`#fbbf24` in dark, `#92400e` in light) positioned vertically above corresponding lyric syllables.
   - Contrast ratio exceeds WCAG AAA (11.23:1 in dark mode, 7.34:1 in light mode).
2. **Stage Utility Controls**:
   - Click `+1` / `-1` transposition buttons: all chords transpose instantly in memory without video interruption.
   - Click `A+` / `A-` font scaling buttons: chord and lyric font size scales smoothly between `16px` and `28px`.
   - Click **Pantalla Completa** (Fullscreen): hides header and browser chrome to maximize vertical sheet reading lines.
   - Verify Screen Wake Lock indicator shows "Activo" (preventing device auto-sleep).
3. **Auto-Scroll Engine**:
   - Click "Iniciar Desplazamiento" (Play Auto-Scroll): page scrolls downward smoothly at configured speed.
   - Touch screen or swipe trackpad: auto-scroll immediately pauses for 3 seconds, displays amber pause badge, and resumes smoothly.

---

### Scenario 7: Full 8-Route Visual Walkthrough

| Route                  | View Name          | Verification Key Points                                                                            |
| ---------------------- | ------------------ | -------------------------------------------------------------------------------------------------- |
| `/`                    | Repertoire Catalog | Sticky search bar, key selector pills, spotlight song cards, empty search state.                   |
| `/songs/[id]`          | Song Detail        | Arrangement hero, interactive vocal matrix (`ADMIN` vs `MEMBER` permissions), chord chart preview. |
| `/songs/[id]/practice` | Rehearsal Studio   | Video synchronization, section timestamp jumping, stage utility bar, Wake Lock, Fullscreen.        |
| `/songs/new`           | Song New           | Accordion cards, live YouTube thumbnail preview, ChordPro syntax-highlighted editor.               |
| `/songs/[id]/edit`     | Song Edit          | Pre-populated metadata, ChordPro editor with real-time parsed preview.                             |
| `/roadmap`             | Strategic Roadmap  | 4-phase animated progress bars, milestone expandable drawers, volunteer interest button.           |
| `/admin/users`         | Admin Users        | Styled data table, sortable columns, user role badges (`ADMIN`/`MEMBER`), edit modal.              |
| `/admin/labels`        | Admin Labels       | Repertoire tag badges, hex color swatch picker modal.                                              |
| `/login`               | Authentication     | Centered glassmorphism card, Aurora background gradient, floating validation rings.                |

---

## 3. Related Design Contracts

- [Design Tokens Contract](file:///home/gustadev121/Workspace/Non-Profit/cjn/worship/specs/002-design-system-ui/contracts/design-tokens.md)
- [Component Primitives Contract](file:///home/gustadev121/Workspace/Non-Profit/cjn/worship/specs/002-design-system-ui/contracts/components.md)
- [App Shell Contract](file:///home/gustadev121/Workspace/Non-Profit/cjn/worship/specs/002-design-system-ui/contracts/app-shell.md)
- [Route UI Layouts Contract](file:///home/gustadev121/Workspace/Non-Profit/cjn/worship/specs/002-design-system-ui/contracts/routes-ui.md)
- [Data Model & Entities](file:///home/gustadev121/Workspace/Non-Profit/cjn/worship/specs/002-design-system-ui/data-model.md)
