# UI Contract: Route Layouts, Component Composition & Stage Interactions

**Feature**: WorshipFlow Design System & Page UI Architecture  
**Branch**: `002-design-system-ui`  
**Date**: 2026-11-10  
**Architect**: Rehearsal & Navigation Architect  
**Status**: Draft

---

## Table of Contents

1. [Route 1: Repertoire Catalog (`/`)](#1-repertoire-catalog-)
2. [Route 2: Song Detail (`/songs/[id]`)](#2-song-detail-songsid)
3. [Route 3: Rehearsal Studio (`/songs/[id]/practice`)](#3-rehearsal-studio-songsidpractice)
4. [Route 4: Song New & Edit (`/songs/new`, `/songs/[id]/edit`)](#4-song-new--edit-songsnew-songsidedit)
5. [Route 5: Strategic Roadmap (`/roadmap`)](#5-strategic-roadmap-roadmap)
6. [Route 6: Admin Users (`/admin/users`)](#6-admin-users-adminusers)
7. [Route 7: Admin Labels (`/admin/labels`)](#7-admin-labels-adminlabels)
8. [Route 8: Authentication Login (`/login`)](#8-authentication-login-login)
9. [ChordPro Domain Parser & Pure Transposition Engine](#9-chordpro-domain-parser--pure-transposition-engine)
10. [Rehearsal Studio Stage Ergonomics Specification](#10-rehearsal-studio-stage-ergonomics-specification)

---

## 1. Repertoire Catalog (`/`)

The primary entry point for worship leaders, band members, and vocalists to browse, filter, search, and discover songs in the ministry repertoire.

### 1.1 Layout Structure & Responsive Grid

- **Container**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6`.
- **Header Section**: Sticky top banner with headline, song count badge, and "Nueva Canción" CTA button (visible for `ADMIN`).
- **Filter Bar Container**: Sticky surface (`sticky top-16 z-30 bg-background/95 backdrop-blur-md py-3 border-b border-border/40`).
- **Catalog Grid**:
  - Mobile (`<640px`): 1 column (`grid-cols-1 gap-4`).
  - Tablet (`640px-1024px`): 2 columns (`grid-cols-2 gap-5`).
  - Desktop (`>1024px`): 3 columns (`grid-cols-3 gap-6`).

### 1.2 Component Composition

```
CatalogPage (Server Component)
├── CatalogHeader
│   ├── TitleCluster (H1: "Repertorio de Alabanza", CountBadge: "28 canciones")
│   └── CreateSongButton (Primary action, links to /songs/new, role-gated)
├── SongFilters (Client Component)
│   ├── SearchInput (Debounced 250ms, clear button, icon)
│   ├── KeySelector (Canonical key pill selector, 24 musical keys)
│   ├── LabelFilterBar (Multi-select pill tags with count indicators)
│   └── ActiveFiltersRow (Clear all filters chip)
├── SongGrid (Layout Container)
│   └── SpotlightCard (React Bits micro-interaction wrapping each SongCard)
│       ├── CardHeader (Title, Artist, BPM badge, Time signature pill)
│       ├── KeyMetricBadges (Original Key pill, Practice Key badge)
│       ├── TagCluster (Repertoire Label badges with custom colors)
│       └── CardFooter (Assigned roles count, "Ver ensayo" quick link)
└── CatalogPagination / InfiniteScrollObserver
```

### 1.3 Interactive States

- **Hover State**: As the cursor moves over each `SpotlightCard`, a radial glow follows the cursor position using CSS custom properties (`--mouse-x`, `--mouse-y`), illuminating the border and elevating the card (`translate-y-[-2px] shadow-md`).
- **Loading State**: A responsive 6-card skeleton grid (`SkeletonCard`) with pulsating shimmer (`animate-pulse bg-muted rounded-xl h-48`).
- **Empty State**:
  - Triggered when text search or key/label filters return 0 results.
  - Surface: Centered card with musical note illustration, title: _"No encontramos canciones con esos filtros"_, subtitle: _"Prueba seleccionando otro tono o limpiando los términos de búsqueda"_, and primary button: _"Restablecer Filtros"_.
- **Error State**: Non-blocking toast/banner with retry button if data fetch fails.

---

## 2. Song Detail (`/songs/[id]`)

Comprehensive arrangement hub displaying song metadata, practice keys, team vocal/instrument role assignments, and a chord/lyric preview.

### 2.1 Layout Structure

- **Container**: `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8`.
- **Layout Split**:
  - Desktop (`≥1024px`): Two-column layout (Left: 60% Arrangement & Role Matrix; Right: 40% Media & Chord Preview).
  - Tablet & Mobile (`<1024px`): Stacked vertical layout.

### 2.2 Component Composition

```
SongDetailPage (Server Component)
├── SongHeroBanner
│   ├── BreadcrumbNavigation (Catálogo > {Song Title})
│   ├── MetadataRow (Title, Artist, Original Key, Practice Key, BPM, Compás)
│   └── ActionToolbar
│       ├── RehearseButton (Primary CTA, links to /songs/[id]/practice, IconPlay)
│       ├── EditSongButton (Outline CTA, links to /songs/[id]/edit, role-gated)
│       └── DeleteSongButton (Destructive icon, role-gated to ADMIN)
├── MainContentGrid (Desktop 2-col / Mobile 1-col)
│   ├── RoleMatrixSection (Left Column)
│   │   ├── SectionHeader ("Matriz de Asignaciones y Partes")
│   │   ├── VocalRolesTable (1ª Voz, 2ª Voz, 3ª Voz, Voces Guía)
│   │   │   └── Row: Member Avatar, Role Type, Practice Status Pill, Part Notes
│   │   ├── InstrumentRolesTable (Guitarra, Bajo, Batería, Teclado)
│   │   │   └── Row: Member Avatar, Role Type, Practice Status Pill, Instrument Notes
│   │   └── AddAssignmentButton (ADMIN modal to assign user to role)
│   └── MediaAndPreviewSection (Right Column)
│       ├── VideoThumbnailCard (Embedded YouTube preview or poster)
│       ├── TimestampsCard (Clickable sections: Intro, Verso, Coro, Puente)
│       └── ChordLyricsPreviewCard (Monospace formatted excerpt with syntax preview)
```

### 2.3 Interactive States

- **Hover State**: Role matrix rows highlight with `hover:bg-accent/40`; practice status badges display interactive hover states.
- **Loading State**: Dual-column skeleton with banner placeholder and table skeleton rows.
- **Empty State (Roles)**: _"No hay miembros asignados a esta canción aún"_ with an _"Asignar miembro"_ action for leaders.
- **Error State**: `404 Song Not Found` banner with link returning to Repertoire Catalog.

---

## 3. Rehearsal Studio (`/songs/[id]/practice`)

An immersive, stage-ready rehearsal environment designed for music stands, tablets, and live sanctuary rehearsal. Maximizes chord visibility and eliminates physical interaction barriers.

### 3.1 Ergonomic Architecture & Stage Layout

- **Container**: Full-width canvas (`w-full min-h-screen bg-background text-foreground`).
- **Responsive Split Modes**:
  - **Landscape Tablet / Desktop (`≥1024px`)**: Split 40/60 view:
    - Left (40%, sticky): Video rehearsal player, section timestamp markers, A-B loop controls.
    - Right (60%, scrollable): Stage Utility Bar + Syllable-aligned ChordPro reader.
  - **Portrait Tablet / Mobile (`<1024px`)**: Stacked view with collapsible video player drawer at top and maximized chord sheet below.
  - **Fullscreen Stage Mode**: Hides top navbar, bottom dock, and video player, giving 100% viewport to the chord sheet with a floating, auto-hiding stage utility bar.

### 3.2 Component Composition

```
PracticePage (Server + Client Rehearsal Engine)
├── StageHeaderBar (Compact / Hideable)
│   ├── SongTitleDisplay (Title, Artist, Original Key)
│   ├── MyRolePill (Logged-in user's role: e.g. "2ª Voz - Armonía Alta")
│   └── PracticeStatusToggle (PENDING -> PRACTICING -> READY with instant optimistic UI)
├── StageUtilityControlBar (Sticky / Floating)
│   ├── TranspositionStepper
│   │   ├── StepDownButton ("-1")
│   │   ├── CurrentTranspositionBadge (e.g. "+2 semitonos (Tono: E major)")
│   │   ├── StepUpButton ("+1")
│   │   └── ResetKeyButton ("Arr")
│   ├── FontSizeScaler
│   │   ├── ScaleDownButton ("A-", decreases base chord size 14px -> 12px)
│   │   ├── CurrentScaleDisplay ("100%")
│   │   └── ScaleUpButton ("A+", increases base chord size up to 24px)
│   ├── AutoScrollControl
│   │   ├── PlayPauseToggle (IconPlay / IconPause, spacebar shortcut)
│   │   ├── SpeedSlider (10px/s to 80px/s, labeled "Velocidad")
│   │   └── ResetToTopButton (IconArrowUp)
│   ├── WakeLockIndicator (Status badge: "Wake Lock Activo" in Emerald)
│   └── FullscreenToggle (IconMaximize2 / IconMinimize2)
├── StageWorkspace (Responsive Grid)
│   ├── VideoPlayerPanel (YouTube Iframe API + Speed + A-B Loop Points + Timestamps)
│   └── ChordSheetViewer (High-contrast Syllable-Aligned ChordPro Reader)
```

### 3.3 Stage Controls & Interactive States

- **Key Transposition Stepper**:
  - Clicking `-` or `+` adjusts semitone delta (`-11` to `+11`).
  - Calls pure domain `transposeChordSheet(sheet, delta, targetMode)`.
  - Transposition is real-time without reloading; target key indicator displays new canonical key.
- **Auto-Scroll Engine (`requestAnimationFrame`)**:
  - Starts scrolling smoothly down the chord sheet container.
  - Musician manual touch/wheel temporarily pauses auto-scroll for 3 seconds (`isPausedByUser = true`), showing an amber _"Pausado temporalmente"_ pill, then resumes.
- **Screen Wake Lock API**:
  - On mount or entering stage mode: calls `navigator.wakeLock.request('screen')`.
  - Re-acquires automatically on `visibilitychange` when returning to the tab.
- **Fullscreen Stage Mode**:
  - Calls `containerRef.requestFullscreen()`.
  - When active, background switches to pure matte black (`#09090b`), chord pills glow in high-contrast Amber (`#f59e0b`), and lyric text renders in crisp white (`#fafafa`).

---

## 4. Song New & Edit (`/songs/new`, `/songs/[id]/edit`)

Form interface for creating and updating songs, structuring metadata, validating keys, authoring ChordPro text with live preview, and setting section timestamps.

### 4.1 Layout Structure

- **Container**: `max-w-4xl mx-auto px-4 py-8 space-y-8`.
- **Card Accordion Sections**:
  1. **Información General** (Title, Artist)
  2. **Atributos Musicales** (Canonical Key, BPM, Compás)
  3. **Video y Multimedia** (YouTube URL + Live Thumbnail Preview)
  4. **Letras y Acordes ChordPro** (Editor + Live Syllable-Aligned Preview)
  5. **Secciones y Tiempos** (Interactive Timestamp Builder)

### 4.2 Component Composition

```
SongFormPage (Client Form with Server Action / API)
├── FormHeader (H1: "Nueva Canción" or "Editar: {Title}")
├── FormSection: GeneralInfoCard
│   ├── TitleInput (Required, 1-200 chars, floating label, error ring)
│   └── ArtistInput (Required, 1-200 chars, floating label)
├── FormSection: MusicalAttributesCard
│   ├── OriginalKeySelect (Dropdown with all 24 canonical keys)
│   ├── PracticeKeySelect (Optional override key)
│   ├── BpmInput (Number input, 30-300 range with tap steppers)
│   └── TimeSignatureSelect (Combobox: "4/4", "6/8", "3/4", "2/4", etc.)
├── FormSection: MediaCard
│   ├── YoutubeUrlInput (Validates standard and short YouTube links)
│   └── YoutubePreviewCard (Renders thumbnail, title, and duration instantly)
├── FormSection: ChordProEditorCard
│   ├── EditorHeader (Tabs: "Editor de Texto" / "Vista Previa en Vivo" / "Dividido")
│   ├── QuickInsertToolbar (Buttons: "[G]", "[D]", "[Em]", "[C]", "[Verso]", "[Coro]")
│   ├── ChordProTextarea (Monospace font, tab key support, auto-pairing brackets)
│   └── LiveChordSheetPreview (Real-time syllable alignment preview)
├── FormSection: SectionTimestampsCard
│   ├── TimestampList (Table: Label e.g. "Intro", Start Seconds, Actions)
│   └── AddTimestampRow (Label input, start seconds, "Verificar en video" button)
└── FormActionsBar (Sticky bottom on mobile)
    ├── CancelButton (Returns to catalog / detail)
    └── SubmitButton (Primary CTA, loading spinner during edge mutation)
```

### 4.3 Interactive States

- **Live YouTube Preview**: Upon typing or pasting a valid YouTube URL, the component debounces 300ms, extracts the 11-character video ID via `normalizeYoutubeVideoId()`, and renders the video thumbnail card with title.
- **Validation Errors**: If fields violate domain constraints (e.g., empty title, invalid key), input borders highlight in `destructive` ring with clear message: _"El título de la canción debe tener 1-200 caracteres"_.
- **Submitting State**: Submit button displays spinning loader and disables form controls to prevent duplicate submissions.

---

## 5. Strategic Roadmap (`/roadmap`)

Interactive visualization of the 4 sequential ministry delivery phases, milestones, capabilities, and volunteer voting.

### 5.1 Layout Structure

- **Container**: `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8`.
- **Top Metrics Row**: Progress summary card, total capabilities count, user votes cast count.
- **Filter Bar**: Track filters (`REPERTOIRE`, `PLANNING`, `ROSTERING`, `REHEARSAL`, `STAGE`) and Priority filters (`P1`, `P2`, `P3`, `P4`).
- **Phase Timeline**: Vertical connected timeline containing 4 collapsible Phase cards.

### 5.2 Component Composition

```
RoadmapPage (Client Component with Edge Data)
├── RoadmapHeader
│   ├── TitleCluster (H1: "Roadmap Estratégico de WorshipFlow")
│   └── Description ("Visualiza el progreso de las 4 fases de desarrollo y vota por las herramientas prioritarias.")
├── RoadmapFilterBar
│   ├── TrackPills (All, Repertorio, Planificación, Voluntarios, Ensayos, En Vivo)
│   └── PriorityPills (All, P1 Crítico, P2 Alto, P3 Medio, P4 Deseable)
├── PhaseTimeline (Container)
│   ├── PhaseCard (Phase 1: Repertoire & Rehearsal Foundation - 100% Completed)
│   ├── PhaseCard (Phase 2: Service Planning & Setlist Management - Active)
│   ├── PhaseCard (Phase 3: Volunteer Scheduling & Availability - Planned)
│   └── PhaseCard (Phase 4: Live Stage Mode & Real-time Sync - Future)
│       └── MilestoneAccordion (Collapsible list within Phase)
│           └── CapabilityCard
│               ├── CapabilityHeader (Title, Target Persona, Priority Badge, Track Pill)
│               ├── AcceptanceCriteria (Brief bullet points)
│               └── VoteButtonCluster
│                   ├── VoteCountPill (e.g. "28 interesados")
│                   ├── VoteToggleAction (Thumbs up / checkmark, optimistic update)
│                   └── FeedbackNoteButton (Opens interest note dialog)
└── FeedbackNoteDialog (Modal for volunteer input)
```

### 5.3 Interactive States

- **Phase Progress Animation**: When phases come into view, progress bar fills from 0% to target percentage with smooth CSS transition (`transition: width 800ms cubic-bezier(0.4, 0, 0.2, 1)`).
- **Vote Toggle (Optimistic UI)**: Clicking vote immediately increments vote count by +1, illuminates the vote pill in Indigo, and syncs via `POST /api/roadmap/capabilities/[id]/vote`.
- **Filtering**: Selecting a track instantly filters visible capability cards across all 4 phases with subtle fade transition.

---

## 6. Admin Users (`/admin/users`)

Administrative console for managing team member accounts, roles, and access credentials.

### 6.1 Layout Structure

- **Container**: `max-w-6xl mx-auto px-4 py-8 space-y-6`.
- **Header**: Title, Member counter, "Invitar Usuario" CTA button.
- **Table Container**: `bg-card border border-border rounded-xl shadow-xs overflow-hidden`.

### 6.2 Component Composition

```
AdminUsersPage (Server + Client Table)
├── HeaderCluster (H1: "Gestión de Usuarios", InviteUserButton)
├── SearchAndRoleFilter (Search input + Role dropdown: Todos / ADMIN / MEMBER)
├── UsersDataTable
│   ├── TableHead (Usuario, Correo, Rol, Creado, Acciones)
│   └── TableBody
│       └── TableRow
│           ├── UserCell (Avatar with initials, Full Name)
│           ├── EmailCell (Email address with copy icon)
│           ├── RoleBadgeCell (ADMIN in Indigo / MEMBER in Slate)
│           ├── CreatedAtCell (Formatted date)
│           └── ActionsCell (Edit Role dialog trigger, Reset Password)
├── RoleChangeDialog (Modal to elevate or demote user role)
└── InviteUserModal (Modal with Name, Email, Password, Role picker)
```

### 6.3 Interactive States

- **Hover State**: Table rows highlight with `hover:bg-muted/40 transition-colors`.
- **Empty State**: _"No se encontraron usuarios que coincidan con la búsqueda"_.
- **Role Elevation Guard**: Confirmation dialog appears when changing a user to `ADMIN`, warning about administrative privileges.

---

## 7. Admin Labels (`/admin/labels`)

Repertoire taxonomy console for organizing tags (e.g., "Alabanza", "Adoración", "Navidad", "Comunión") with custom color swatches.

### 7.1 Layout Structure

- **Container**: `max-w-5xl mx-auto px-4 py-8 space-y-6`.
- **Header**: Title, Tag count, "Nueva Etiqueta" CTA button.
- **Label Grid**: Responsive cards displaying label name, hex color swatch preview, associated songs count, and edit/delete actions.

### 7.2 Component Composition

```
AdminLabelsPage (Client Component)
├── HeaderCluster (H1: "Etiquetas de Repertorio", CreateLabelButton)
├── LabelGrid (grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4)
│   └── LabelCard
│       ├── LabelBadgePreview (Rendered with custom hex color and contrast calculation)
│       ├── SongsCountBadge ("12 canciones asignadas")
│       └── ActionsGroup (EditButton, DeleteButton with confirmation modal)
├── LabelFormModal (Create / Edit Modal)
│   ├── NameInput (1-50 chars)
│   ├── ColorPickerSection
│   │   ├── PresetSwatches (8 curated stage-friendly hex colors)
│   │   ├── CustomHexInput (Regex validation `^#[0-9a-fA-F]{6}$`)
│   │   └── ContrastIndicator (WCAG 4.5:1 preview against dark and light surfaces)
│   └── ModalActions (Cancelar, Guardar Etiqueta)
└── DeleteConfirmationDialog
```

### 7.3 Interactive States

- **Preset Swatch Selection**: Clicking a color swatch instantly updates the preview pill and the custom hex input field.
- **Delete Warning**: If a label is currently attached to songs, the deletion dialog informs: _"Esta etiqueta está en uso en 5 canciones. Quitarla no eliminará las canciones."_

---

## 8. Authentication Login (`/login`)

First-impression authentication portal featuring ambient background atmosphere, centered glassmorphism card, and clear validation feedback.

### 8.1 Layout Structure

- **Container**: Full-viewport centered flex container (`min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-background`).
- **Background**: Ambient animated gradient surface (React Bits Aurora effect: subtle moving radial color meshes in indigo and slate).
- **Authentication Card**: `w-full max-w-md bg-card/85 backdrop-blur-xl border border-border/60 rounded-2xl p-8 shadow-2xl relative z-10`.

### 8.2 Component Composition

```
LoginPage (Client Form)
├── AmbientBackground (Subtle animated color mesh, disabled if prefers-reduced-motion)
├── LoginCardContainer
│   ├── BrandHeader
│   │   ├── InsigniaIcon (36x36px with subtle glow ring)
│   │   ├── Title ("WorshipFlow")
│   │   └── Subtitle ("Inicia sesión para acceder al repertorio y ensayos")
│   ├── LoginForm
│   │   ├── EmailField (Type="email", floating label, autoFocus, required)
│   │   ├── PasswordField
│   │   │   ├── PasswordInput (Type="password" | "text")
│   │   │   └── VisibilityToggle (Eye / EyeOff icon button)
│   │   ├── RememberMeRow (Checkbox: "Mantener sesión iniciada")
│   │   ├── SubmitButton (Full width, "Iniciar Sesión", loading spinner)
│   │   └── ErrorAlert (High-visibility destructive banner if credentials invalid)
│   └── LoginFooter
│       └── SupportNotice ("¿Problemas para acceder? Contacta al director de alabanza.")
```

### 8.3 Interactive States

- **Submit Loading**: The submit button displays a spinning spinner, disables the input fields, and softens the card opacity to 0.9.
- **Validation Failure**: The form card performs a subtle horizontal shake animation (if motion is enabled), and form inputs display a red error ring with text: _"Credenciales incorrectas. Verifica tu correo y contraseña."_

---

## 9. ChordPro Domain Parser & Pure Transposition Engine

The ChordPro domain utility is implemented in `src/core/domain/chordpro.ts` as pure TypeScript with **zero external dependencies**, adhering strictly to Constitution Principle I.

### 9.1 Pure TypeScript Domain Types

```typescript
export interface ChordSegment {
  chord: string | null;
  lyrics: string;
}

export type ChordLineType = "chord-lyric" | "directive" | "comment" | "empty";

export interface ChordLine {
  type: ChordLineType;
  rawText: string;
  directiveName?: string;
  directiveValue?: string;
  segments?: ChordSegment[];
}

export interface ChordSection {
  name: string; // e.g. "Verso 1", "Coro", "Puente", "Intro"
  lines: ChordLine[];
}

export interface ParsedChordPro {
  title?: string;
  artist?: string;
  originalKey?: string;
  sections: ChordSection[];
}
```

### 9.2 Parsing Algorithm (`parseChordPro`)

```typescript
export function parseChordPro(sourceText: string): ParsedChordPro {
  const lines = sourceText.split(/\r?\n/);
  const sections: ChordSection[] = [];
  let currentSection: ChordSection = { name: "General", lines: [] };
  let title: string | undefined;
  let artist: string | undefined;
  let originalKey: string | undefined;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    // 1. Directives: {title: ...}, {key: ...}, {c: Verse 1}
    const directiveMatch = trimmed.match(/^\{([^:]+)(?::\s*([^}]+))?\}$/);
    if (directiveMatch) {
      const name = directiveMatch[1].trim().toLowerCase();
      const value = directiveMatch[2]?.trim() ?? "";

      if (name === "title" || name === "t") {
        title = value;
      } else if (name === "artist" || name === "a") {
        artist = value;
      } else if (name === "key") {
        originalKey = value;
      } else if (name === "comment" || name === "c" || name === "section") {
        if (currentSection.lines.length > 0) {
          sections.push(currentSection);
        }
        currentSection = { name: value || "Sección", lines: [] };
      }
      continue;
    }

    // 2. Empty Lines
    if (trimmed.length === 0) {
      currentSection.lines.push({ type: "empty", rawText: "" });
      continue;
    }

    // 3. Section Headers via brackets on dedicated line: [Verso 1], [Coro]
    const headerMatch = trimmed.match(/^\[([A-Za-zÁ-ú0-9\s]+)\]$/);
    if (headerMatch && !isChordToken(headerMatch[1])) {
      if (currentSection.lines.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { name: headerMatch[1], lines: [] };
      continue;
    }

    // 4. Syllable-Aligned Chord/Lyric line
    const segments = parseLineSegments(rawLine);
    currentSection.lines.push({
      type: "chord-lyric",
      rawText: rawLine,
      segments,
    });
  }

  if (currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  return { title, artist, originalKey, sections };
}
```

### 9.3 Pure Transposition Algorithm (`transposeChord`)

Transposes chords by semitone delta `Δ` (-11 to +11) and preserves slash chords:

```typescript
const CHROMATIC_FLATS = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
] as const;
const CHROMATIC_SHARPS = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

const SEMITONE_INDEX: Record<string, number> = {
  "B#": 0,
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  "E#": 5,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};

// Heuristic: Flat keys prefer flat spellings; Sharp keys prefer sharp spellings
const FLAT_PREFERENCE_KEYS = new Set([
  "F",
  "Bb",
  "Eb",
  "Ab",
  "Db",
  "Gb",
  "Dm",
  "Gm",
  "Cm",
  "Fm",
  "Bbm",
  "Ebm",
]);

export function transposeNote(
  note: string,
  semitones: number,
  preferFlats = false,
): string {
  const currentIdx = SEMITONE_INDEX[note];
  if (currentIdx === undefined) return note;
  const targetIdx = (((currentIdx + semitones) % 12) + 12) % 12;
  return preferFlats ? CHROMATIC_FLATS[targetIdx] : CHROMATIC_SHARPS[targetIdx];
}

export function transposeChord(
  chord: string,
  semitones: number,
  preferFlats = false,
): string {
  if (semitones % 12 === 0) return chord;

  // Regex captures: Root (group 1), Modifiers (group 2), Slash Note (group 3)
  const chordRegex = /^([A-G][b#]?)([^/]*)(?:\/([A-G][b#]?))?$/;
  const match = chord.match(chordRegex);
  if (!match) return chord;

  const [, root, modifier, slash] = match;
  const newRoot = transposeNote(root, semitones, preferFlats);
  const newSlash = slash
    ? `/${transposeNote(slash, semitones, preferFlats)}`
    : "";

  return `${newRoot}${modifier}${newSlash}`;
}
```

### 9.4 Syllable Alignment CSS & HTML Architecture

To ensure chords are positioned cleanly over the exact lyric syllable on responsive screens and during font scaling:

```html
<div class="chord-line">
  <!-- Chord + Syllable Pair -->
  <span class="chord-pair">
    <span class="chord-pill">G</span>
    <span class="chord-lyric">Sub</span>
  </span>
  <span class="chord-pair">
    <span class="chord-pill">D</span>
    <span class="chord-lyric">li</span>
  </span>
  <span class="chord-pair">
    <span class="chord-lyric">me </span>
  </span>
  <span class="chord-pair">
    <span class="chord-pill">Em</span>
    <span class="chord-lyric">gra</span>
  </span>
  <span class="chord-pair">
    <span class="chord-lyric">cia</span>
  </span>
</div>
```

```css
.chord-line {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  row-gap: 0.85rem;
  line-height: 1.2;
  margin-bottom: 0.75rem;
}

.chord-pair {
  display: inline-flex;
  flex-direction: column;
  vertical-align: bottom;
  min-width: fit-content;
}

.chord-pill {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-weight: 700;
  font-size: 0.875em;
  color: var(--chord-accent); /* Vibrant Amber: #f59e0b */
  line-height: 1;
  padding-bottom: 0.25rem;
  user-select: none;
  pointer-events: none;
}

.chord-lyric {
  font-family: inherit;
  font-size: 1em;
  color: var(--foreground);
  white-space: pre; /* Preserves exact word spacing */
}
```

---

## 10. Rehearsal Studio Stage Ergonomics Specification

### 10.1 Screen Wake Lock API Contract

During live rehearsals and stage use, devices must not sleep or dim.

```typescript
export interface UseScreenWakeLockReturn {
  isSupported: boolean;
  isActive: boolean;
  error: Error | null;
  request: () => Promise<void>;
  release: () => Promise<void>;
}
```

1. **Auto-Request on Stage Mode**:
   When entering `/songs/[id]/practice`, if `navigator.wakeLock` exists, `request()` is executed automatically.
2. **Visibility State Re-Acquisition**:
   Browsers release the wake lock when the user switches tabs or backgrounds the browser. When the page visibility transitions back to `visible`, the hook automatically re-acquires the lock:

   ```typescript
   document.addEventListener("visibilitychange", async () => {
     if (document.visibilityState === "visible" && shouldBeActive) {
       await request();
     }
   });
   ```
3. **Graceful Fallback**: If permissions are denied or the browser does not support the API, an informational badge indicates _"Wake Lock no disponible"_ without interrupting the rehearsal sheet.

### 10.2 Fullscreen API & Tablet Orientation Handling

1. **Fullscreen Toggle**:
   - Element target: Root rehearsal container (`document.getElementById('rehearsal-canvas')`).
   - Standard API with webkit fallback:

     ```typescript
     if (!document.fullscreenElement) {
       await container.requestFullscreen?.() ?? container.webkitRequestFullscreen?.();
     } else {
       await document.exitFullscreen?.() ?? document.webkitExitFullscreen?.();
     }
     ```

2. **Orientation Adaptation**:
   - **Portrait** (Music stand vertical): Chord sheet takes 100% viewport height with sticky bottom stage utility controls.
   - **Landscape** (Tablet wide): 2-column split with left-anchored video and right-anchored chord sheet.
   - Listens to `window.screen.orientation.addEventListener('change', ...)` to adjust layout dimensions without jumping scroll positions.

### 10.3 Smooth Hands-Free Auto-Scrolling Engine (`requestAnimationFrame`)

```typescript
export interface UseAutoScrollOptions {
  speedPxPerSec: number; // 10 to 80 px/sec
  scrollContainerRef: React.RefObject<HTMLElement | null>;
  pauseOnUserTouchDurationMs?: number; // default: 3000ms
}
```

1. **Precision Time Delta**:

   ```typescript
   let lastTime: number | null = null;
   let accumulatedScroll = 0;

   function tick(currentTime: number) {
     if (!lastTime) lastTime = currentTime;
     const deltaSeconds = (currentTime - lastTime) / 1000;
     lastTime = currentTime;

     if (isRunning && !isUserPaused && container) {
       accumulatedScroll += speedPxPerSec * deltaSeconds;
       if (accumulatedScroll >= 1) {
         const px = Math.floor(accumulatedScroll);
         container.scrollTop += px;
         accumulatedScroll -= px;
       }
     }
     rafId = requestAnimationFrame(tick);
   }
   ```
2. **Touch-to-Pause Ergonomics**:
   - When a musician touches or wheels the screen to adjust their position, `onTouchStart` / `onWheel` sets `isUserPaused = true`.
   - A 3-second timer resets upon the last user touch. After 3 seconds of inactivity, auto-scroll smoothly resumes from the user's new position.
