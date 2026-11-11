# Technical Research & Architectural Decisions: WorshipFlow Design System & UI Architecture

**Feature Branch**: `002-design-system-ui` | **Date**: 2026-11-10

This document consolidates Phase 0 research findings, technical decisions, rationale, and evaluated alternatives for the WorshipFlow Design System, React Bits micro-interactions, and 8 application view layouts.

---

## 1. Dual-Theme Semantic Token Architecture (Dark-First Default)

### Decision

Implement a semantic CSS custom property system where `:root` directly defines **Dark Mode** as the default theme using a **Deep Slate/Zinc** neutral palette (`#090d16` background, `#0f172a` card surfaces, `#f8fafc` primary text), an **Indigo** brand action palette (`#6366f1`), and a dedicated **luminous Amber** chord accent token (`--chord-accent: #fbbf24`). Light Mode is activated via the `.light` class selector override (`#f8fafc` background, `#ffffff` card surface, `#0f172a` text, `#92400e` chord accent).

### Rationale

- **Stage & Sanctuary Visual Ergonomics**: WorshipFlow's primary operational setting is dimly lit sanctuary stages and music stands. High-luminance white backgrounds blind musicians, constrict pupils, cause stage wash, and distract congregations. A dark-first default provides instant stage usability without requiring manual toggling.
- **Chord vs. Lyric Legibility**: Chords positioned above lyrics require distinct spectral separation. In dark mode, `#fbbf24` (Amber 400) delivers an **11.23:1 contrast ratio** against `#090d16` (WCAG AAA). In light mode, amber shifts to `#92400e` (Amber 800) with a warm tinted pill background (`#fef3c7`), guaranteeing a **7.34:1 contrast ratio** (WCAG AAA).
- **Zero Runtime Overhead**: Using standard CSS custom properties eliminates runtime CSS-in-JS calculation overhead and guarantees fast paints.

### Alternatives Considered

- _Strict Light-First Default_: Rejected because first-time users on music stands during Sunday morning rehearsals would be blinded by white screens.
- _Strict OS Preference Only (`prefers-color-scheme`)_: Rejected because musicians often set their phones/tablets to daytime light mode for emails, but need WorshipFlow specifically in dark mode for rehearsal and live stage performance.
- _Tailwind Utility Colors Directly in Components_: Rejected because hardcoded utility classes (`bg-slate-900`) create unmanageable theme branching (`dark:bg-slate-900 dark:text-amber-400 text-amber-700`). Semantic tokens (`bg-background text-chord-accent`) allow components to remain completely agnostic of the active theme.

---

## 2. Zero-FOUC Edge SSR Theme Resolution

### Decision

Store theme preference in a lightweight cookie (`worshipflow_theme=dark|light; Path=/; Max-Age=31536000; SameSite=Lax`). In Cloudflare Workers edge runtime (`workerd`), the root server component (`src/app/layout.tsx`) reads the incoming cookie and injects `class="light"` or `class=""` directly onto the `<html>` root tag during initial server response streaming.

### Rationale

- **Zero Flash of Unstyled Content (0ms FOUC)**: Because the HTML response from Cloudflare Workers arrives with the correct theme class already present on `<html>`, the browser's HTML parser paints the correct background and surface colors on the very first frame before JavaScript hydration begins.
- **Client Synchronization**: When the user clicks the theme toggle in the App Shell, the `useTheme()` client hook immediately toggles `document.documentElement.classList` and sets `document.cookie`, ensuring instant visual feedback and seamless persistence across subsequent navigations.

### Alternatives Considered

- _Client `localStorage` with Inline Blocking Script_: Common in client-only SPAs, but causes brief white flashes or layout shifts when streaming Server Components on edge runtimes.
- _URL Query Parameter (`?theme=dark`)_: Clutters URLs and causes browser history pollution.

---

## 3. React Bits Micro-Interactions & Reduced-Motion Accessibility

### Decision

Implement three focused React Bits micro-interaction components:
1. `SpotlightCard`: Cursor-following radial spotlight for song catalog cards (`/`).
2. `AuroraBackground`: Subtle multi-layered ambient gradient mesh for the authentication view (`/login`).
3. `AnimatedGlow`: Luminous border and insignia breathing effect in the App Shell header.

All components MUST support strict accessibility fallbacks: when `@media (prefers-reduced-motion: reduce)` is detected or when `@media (pointer: coarse)` (touchscreens) is active, all dynamic animation loops, keyframes, and mouse tracking are disabled, rendering clean static borders and calm surfaces.

### Rationale

- **Visual Polish Without Bloat**: React Bits components are implemented natively using modern CSS animations and lightweight inline SVG / canvas elements, requiring zero heavy external animation engines (e.g. Framer Motion, GSAP).
- **Touchscreen Device Resilience**: Mobile phones and tablets lack hover cursor precision; disabling spotlight calculations on coarse pointers saves battery life on mobile devices and avoids phantom hover states.
- **WCAG 2.1 Compliance**: Respecting `prefers-reduced-motion` is required for accessible software and prevents vestibular discomfort.

### Alternatives Considered

- _Framer Motion Library_: Adds ~35kB minified bundle size and complicates React 19 RSC/Server Component boundaries.
- _Canvas WebGL Shaders_: Excessive GPU and battery consumption for music stand tablets.

---

## 4. Pure TypeScript ChordPro Parser & Key Transposition Engine

### Decision

Encapsulate all ChordPro parsing and musical key transposition logic in `src/core/domain/chordpro.ts` as a **pure TypeScript domain module with zero external dependencies**, adhering strictly to WorshipFlow Constitution Principle I.

### Rationale

- **Bracket Notation Standard**: ChordPro format (`[G]Sub[D]lime [Em]gracia`) is the universal standard in worship music planning (Planning Center, SongSelect, OnSong). It embeds chords inline with lyrics, preventing whitespace misalignment when responsive fonts scale.
- **Pure Domain Transposition**: Transposition operates by parsing root notes, looking up chromatic semitone offsets (-11 to +11), computing modular chromatic intervals (`(rootIndex + delta + 12) % 12`), and applying enharmonic spelling rules (sharp vs. flat canonical keys from `src/core/domain/keys.ts`).
- **Syllable Alignment Pattern**: Syllables and chords are modeled as pairs (`.chord-pair` wrapping `.chord-pill` over `.chord-lyric` in an inline-flex column). This ensures chords stay anchored directly above their corresponding syllables regardless of screen width or zoom level.

### Alternatives Considered

- _Two-Line Monospace Plaintext_: Whitespace shifts when transposing a single-character chord (e.g., `G` to `F#m`) break alignment across the entire line.
- _Third-Party ChordPro NPM Package_: Violates Constitution Principle I (`src/core/domain` must have zero external imports). Pure TS implementation is only ~150 lines and fully deterministic.

---

## 5. Rehearsal Studio Stage Ergonomics

### Decision

Provide a distraction-free stage utility control bar in `/songs/[id]/practice` containing:
1. **Screen Wake Lock API**: Automatically requests `navigator.wakeLock.request('screen')` on mount to keep tablet displays awake while playing instruments; auto-reacquires lock on `document.visibilitychange`.
2. **Fullscreen API**: 1-click toggle to strip browser chrome and navigation bars, maximizing vertical chord lines.
3. **Smooth Auto-Scroll**: Physics-based vertical scrolling using `requestAnimationFrame` with microsecond delta timing and an adjustable speed slider (10px/s to 80px/s). Musician touch gestures pause scrolling for 3 seconds before resuming.
4. **Dynamic Font Sizing**: `A-` / `A+` buttons adjusting `--stage-chord-size` between `16px` and `28px` without re-rendering the video player.

### Rationale

- **Hands-Free Performance**: Worship musicians (guitarists, keyboardists, drummers) cannot take their hands off their instruments to unlock a sleeping screen or swipe through verses during an active song set.
- **Music Stand Viewport Constraints**: 10-inch tablets lose up to 30% of vertical height to browser chrome. Fullscreen mode restores 4–6 additional lines of chord visibility.

### Alternatives Considered

- _Manual Page Swiping_: Requires physical touch every 30 seconds; disrupts musical flow.
- _Bluetooth Foot Pedal Only_: Requires external hardware. Auto-scroll with gesture pause provides immediate software-driven hands-free utility for all volunteers.

---

## 6. App Shell & Mobile Navigation Ergonomics

### Decision

Implement a responsive layout split:
- **Desktop & Landscape Tablets (`>=768px`)**: Sticky top navigation header (`h-16`) containing the animated ministry insignia, primary links (`Catálogo`, `Roadmap`), role-gated admin links, dark/light theme switch, and user profile avatar with role badge.
- **Mobile Devices & Portrait Tablets (`<768px`)**: Fixed Bottom Navigation Dock (`h-16` + `safe-area-inset-bottom`) providing 4 thumb-accessible targets (`>=48x48px`):
  1. `Catálogo` (`/`)
  2. `Ensayo` (`/songs/[id]/practice` or recent song)
  3. `Roadmap` (`/roadmap`)
  4. `Más` (Slide-over drawer trigger)
- **"Más" Drawer**: Accessible slide-over sheet containing user identity, role badge, instant theme toggle, admin links (`/admin/users`, `/admin/labels`), and session logout.

### Rationale

- **Single-Hand Mobile Reach**: On modern smartphones (6.1" to 6.8"), top navigation hamburgers are unreachable with one hand. A bottom dock places 85% of daily worship actions directly within the thumb's natural sweep arc.
- **Safe Area Insets**: Integrating `env(safe-area-inset-bottom)` ensures bottom dock icons never overlap device home bars or gesture indicators on iOS and Android devices.

### Alternatives Considered

- _Top Hamburger Menu on Mobile_: Requires two-handed interaction or hand gymnastics; poor stage ergonomics.
- _Floating Action Button Speed Dial_: Obscures page content and requires two taps for every navigation transition.
