# Feature Specification: Smart ChordPro Importer & Two-Line Chord Text Converter

**Feature Branch**: `004-chord-smart-importer`

**Created**: 2026-11-11

**Status**: Draft

**Input**: User description: "y para el editor de acordes, es un poco complicado ahora escribir toda la letra, hay alguna archivo quizá o alguna integración que se pueda hacer para no escribir toda la letra a mano? Conversor Smart Paste de acordes sobre la letra e importador de archivos ChordPro/texto."

## User Scenarios & Testing

### User Story 1 - Smart Paste: Two-Line Chord Text Converter (Priority: P1) 🎯 MVP

Worship leaders and musicians frequently copy song charts from popular chord websites (LaCuerda.net, Ultimate Guitar, chord blogs) or documents where chord names sit on a line directly above the lyrics line. Today, typing brackets `[G]` manually around every syllable is tedious and error-prone. With Smart Paste, the user pastes plain two-line text into a modal converter, inspects an instant real-time ChordPro preview, and applies it to the song editor in a single click.

**Why this priority**: Solves the core user friction immediately without requiring external files or third-party paid subscriptions. 90% of songs added to church catalogs originate from copy-pasting from existing websites.

**Independent Test**: Paste a classic two-line snippet (chords above lyrics) into the Smart Paste converter modal; verify that chords are accurately intercalated into brackets at exact syllable positions, section headers are formatted, and clicking "Aplicar al editor" populates the song's lyrics editor.

**Acceptance Scenarios**:

1. **Given** a user is on the New Song or Edit Song page, **When** they click "Pegar texto clásico (acordes sobre letra)", **Then** a clean modal appears with an input area and a live ChordPro preview.
2. **Given** text where a line consists solely of musical chord tokens (e.g. `G        D/F#     Em7        C`) followed by a lyric line (e.g. `En tu presencia hay plenitud`), **When** the converter processes it, **Then** it produces `[G]En tu presencia [D/F#]hay [Em7]plenitud[C]`.
3. **Given** section indicators in plain text (e.g. `CORO:`, `[Verso 1]`, `Intro`, `Puente:`), **When** processed, **Then** they are recognized as section directives (e.g. `[Coro]`, `[Verso 1]`, `[Intro]`, `[Puente]`).
4. **Given** lines containing only chords without lyrics (e.g. intro progressions `G  D  Em  C`), **When** converted, **Then** chords are formatted as `[G] [D] [Em] [C]`.

---

### User Story 2 - File Drag & Drop Importer (`.chordpro`, `.cho`, `.pro`, `.txt`) (Priority: P2)

Worship teams often maintain existing archives of songs exported from other software (such as OnSong, Planning Center, OpenSong, or ChordPro tools). Instead of manually copying and pasting or re-entering song properties, the user can upload or drag-and-drop a chord file directly onto the song form.

**Why this priority**: Eliminates repetitive metadata entry (title, artist, original key, tempo/BPM, time signature) by auto-populating form fields directly from standard ChordPro directives.

**Independent Test**: Drag a standard `.chordpro` file containing `{title: Tu Fidelidad}`, `{artist: Marcos Witt}`, `{key: D}`, `{tempo: 70}` onto the dropzone; verify that all corresponding form inputs are automatically filled and the lyrics editor contains the chord sheet.

**Acceptance Scenarios**:

1. **Given** a user on the song creation or edition page, **When** they drag-and-drop or select a `.chordpro`, `.cho`, `.pro`, or `.txt` file, **Then** the file content is parsed without page reloads.
2. **Given** the file contains standard ChordPro metadata directives (`{title: ...}`, `{artist: ...}`, `{key: ...}`, `{tempo: ...}`, `{time: ...}`), **When** imported, **Then** the song form fields for Título, Artista, Tono Original, BPM y Compás are populated.
3. **Given** the file contains lyrics and chord content, **When** imported, **Then** the editor is populated and an alert shows a summary of extracted metadata.
4. **Given** a file larger than 500KB or of an unsupported binary format (e.g., `.pdf`, `.mp3`), **When** selected, **Then** the system rejects the file gracefully with a friendly explanatory message.

---

### User Story 3 - Automatic Section Timestamp Extraction (Priority: P3)

When importing chord charts or using smart paste, songs often include section titles with timestamp hints (e.g., `[Verso 1 - 0:35]`, `[Coro] (1:15)`, or `{comment: Puente 2:40}`). The system automatically detects these timestamps and offers to populate the song's Rehearsal Section Timestamps table.

**Why this priority**: Connects chord sheet preparation seamlessly with the live rehearsal playback synchronization feature (`003-rehearsal-live-sync`) without requiring manual re-typing in the timestamps table.

**Independent Test**: Import a chord sheet with section lines like `[Verso 1 - 0:45]` and `[Coro - 1:30]`; verify that the section timestamps table is automatically populated with labels "Verso 1" (45s) and "Coro" (90s).

**Acceptance Scenarios**:

1. **Given** imported chord text containing timestamp patterns within section lines (e.g. `mm:ss` or `m:ss`), **When** processed, **Then** the timestamps and section names are extracted into candidate rehearsal timestamps.
2. **Given** detected section timestamps, **When** the user confirms import, **Then** the song's `sectionTimestamps` list is updated with sorted seconds and clean section labels (with the timestamp text stripped from the section title).

---

### Edge Cases

- **Chords with Bass Notes / Inversions**: Complex chords like `C/E`, `D/F#`, `F#m7b5`, `Bbmaj7`, `G#dim` must be recognized as valid chords, not plain words.
- **Words that Look Like Chords**: Short Spanish words like `A`, `Y`, `De`, `El`, `Al` on a lyrics line must not be erroneously converted into chords when they appear in normal sentences.
- **Accidental Spacing Shifts**: Proportional vs. monospaced fonts when copying from websites: character index mapping must remain resilient to tabs and multiple spaces.
- **Consecutive Chord Lines**: Songs with instrumental solos or bridges having multiple consecutive lines of chords without lyrics must preserve all chords without swallowing lines.
- **Existing Content Protection**: When importing a file or smart paste over an editor that already has content, the system must prompt the user before overwriting existing work.

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide an interactive "Smart Paste" modal accessible from the ChordPro editor in both `/songs/new` and `/songs/[id]/edit`.
- **FR-002**: The two-line chord converter MUST identify chord lines using deterministic music theory chord validation (root notes A-G with flats/sharps, qualities maj, min, dim, aug, 7, 9, sus, and optional slash bass).
- **FR-003**: The two-line chord converter MUST map chord character positions to the corresponding syllable on the lyrics line directly below and insert `[Chord]` bracket tokens.
- **FR-004**: The system MUST detect common section headers (`Verso`, `Coro`, `Puente`, `Intro`, `Outro`, `Estribillo`, `Solo`, `Final`) and normalize them into `[Nombre]` or `{comment: Nombre}` directives.
- **FR-005**: System MUST provide a File Upload dropzone accepting `.chordpro`, `.cho`, `.pro`, and `.txt` files up to 500KB.
- **FR-006**: The file importer MUST parse ChordPro metadata tags (`{title}`, `{artist}`, `{key}`, `{tempo}`, `{time}`) and populate corresponding form fields.
- **FR-007**: The system MUST detect timestamp annotations in section titles and extract them into the song's `sectionTimestamps` collection.
- **FR-008**: System MUST display an interactive side-by-side or live preview before committing imported/converted text into the main editor.

### Key Entities

- **TwoLineConversionResult**: Pure domain structure representing converted ChordPro text, detected section timestamps, detected key, and warnings for unrecognized lines.
- **ChordProMetadata**: Extracted song metadata (title, artist, originalKey, bpm, timeSignature, sectionTimestamps).

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can convert a standard two-line chord song of 40 lines into accurate ChordPro format in under 5 seconds.
- **SC-002**: 95% or higher chord identification accuracy for standard worship song progressions (including slash chords and 7th extensions).
- **SC-003**: Dropping a valid `.chordpro` file populates all metadata and chord text in a single interaction without manual copy-pasting.
- **SC-004**: Zero data loss: user is prompted with confirmation before overwriting non-empty editor content.

## Assumptions

- Users copy plain text or upload UTF-8 encoded text files.
- Chords adhere to standard Western notation (C, D, E, F, G, A, B) or Latin solfège (Do, Re, Mi, Fa, Sol, La, Si).
- File operations run entirely client-side via Web APIs (`FileReader`, `Drag and Drop API`) without uploading temporary files to the server.
