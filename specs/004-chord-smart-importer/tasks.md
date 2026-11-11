# Tasks: Smart ChordPro Importer & Two-Line Chord Text Converter

**Input**: Design documents from `specs/004-chord-smart-importer/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/chord-converter.md`, `quickstart.md`)

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/chord-converter.md`

**Tests**: Unit tests for pure domain conversion algorithms, chord line detection heuristics, and metadata extraction are included.

**Organization**: Tasks are grouped by user story (P1 through P3) to enable independent implementation, verification, and MVP delivery.

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Belongs to user story phase (`[US1]`, `[US2]`, `[US3]`)
- Clear descriptions with exact file paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Define pure domain entities, value objects, and shared contracts for chord conversion and file importing.

- [ ] T001 Define pure domain interfaces (`ChordToken`, `TwoLineConversionResult`, `ImportedSongMetadata`) in `src/core/domain/chord-converter.ts` per `specs/004-chord-smart-importer/data-model.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core pure domain chord recognition logic that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until the deterministic chord validation and line classification functions are in place.

- [ ] T002 Implement `isValidChordToken(token)` and `isChordLine(line)` functions supporting Western (`A-G`) and Latin solfège (`Do-Si`) notations, slash chords (`D/F#`), extensions (`maj7`, `sus4`, `add9`), and Spanish prose disambiguation in `src/core/domain/chord-converter.ts` per `specs/004-chord-smart-importer/contracts/chord-converter.md`
- [ ] T003 [P] Write unit tests for chord token validation and line classification covering valid chords, slash chords, solfège chords, Spanish prose words, and empty lines in `tests/unit/domain/chord-converter.test.ts`

**Checkpoint**: Foundation ready — pure domain chord classification is fully tested and ready for converter algorithms.

---

## Phase 3: User Story 1 - Smart Paste: Two-Line Chord Text Converter (Priority: P1) 🎯 MVP

**Goal**: Allow users to paste plain text with chords situated above lyrics (e.g. from LaCuerda or Ultimate Guitar), automatically intercalating chords into bracket notation `[G]` based on character column position, with live interactive preview.

**Independent Test**: Paste a two-line snippet into the Smart Paste converter modal; verify chords align with exact syllables, section titles are formatted, and clicking "Aplicar al editor" populates the song form.

### Tests for User Story 1

- [ ] T004 [P] [US1] Write unit tests for `convertTwoLineToChordPro` covering single verses, chorus alignment, consecutive chord lines (instrumental/intro), section headers, and column positioning in `tests/unit/domain/chord-converter.test.ts`

### Implementation for User Story 1

- [ ] T005 [US1] Implement `convertTwoLineToChordPro(rawText)` algorithm with column character tracking, syllable interleaving, and section header normalization in `src/core/domain/chord-converter.ts` per `specs/004-chord-smart-importer/contracts/chord-converter.md`
- [ ] T006 [P] [US1] Create interactive modal component `SmartPasteModal` with raw text textarea, live ChordPro preview pane, statistics badges, and apply action in `src/presentation/components/rehearsal/smart-paste-modal.tsx`
- [ ] T007 [US1] Integrate `SmartPasteModal` trigger button and state handler into `SongForm` in `src/app/songs/new/form.tsx`

**Checkpoint**: User Story 1 complete — musicians can paste classic two-line chord charts and convert them to ChordPro in 1 click (MVP ready).

---

## Phase 4: User Story 2 - File Drag & Drop Importer (`.chordpro`, `.cho`, `.txt`) (Priority: P2)

**Goal**: Allow users to drag and drop or select `.chordpro`, `.cho`, `.pro`, and `.txt` files, automatically populating song metadata (title, artist, key, bpm, time signature) and chord sheet contents.

**Independent Test**: Drag a valid `.chordpro` file containing `{title: Tu Fidelidad}`, `{artist: Marcos Witt}`, `{key: D}` onto the form dropzone; verify that all corresponding fields are auto-filled and chords are rendered.

### Tests for User Story 2

- [ ] T008 [P] [US2] Write unit tests for `extractChordProMetadata` covering standard directives (`{title}`, `{t}`, `{artist}`, `{a}`, `{key}`, `{tempo}`, `{time}`) and fallback plain text detection in `tests/unit/domain/chord-converter.test.ts`

### Implementation for User Story 2

- [ ] T009 [US2] Implement `extractChordProMetadata(fileContent)` in `src/core/domain/chord-converter.ts` per `specs/004-chord-smart-importer/contracts/chord-converter.md`
- [ ] T010 [P] [US2] Create `FileDropzone` component with HTML5 drag-and-drop, native file input trigger, 500KB file size limit, and overwrite confirmation in `src/presentation/components/rehearsal/file-dropzone.tsx`
- [ ] T011 [US2] Integrate `FileDropzone` into `SongForm` in `src/app/songs/new/form.tsx` to populate title, artist, originalKey, bpm, timeSignature, and lyricsAndChords

**Checkpoint**: User Stories 1 and 2 complete — both copy-pasting two-line chords and importing native ChordPro files work seamlessly.

---

## Phase 5: User Story 3 - Automatic Section Timestamp Extraction (Priority: P3)

**Goal**: Automatically extract timestamps embedded in section lines (e.g. `[Verso 1 - 0:45]`, `[Coro - 1:30]`) and populate the song's rehearsal section timestamps list.

**Independent Test**: Paste or import a chart with section timestamps; verify that the section timestamps table is automatically populated with sorted seconds (45s, 90s) and clean labels.

### Implementation for User Story 3

- [ ] T012 [P] [US3] Implement timestamp pattern recognition (`mm:ss`, `m:ss`) inside section headers, calculating total seconds and stripping timestamps from clean titles in `src/core/domain/chord-converter.ts`
- [ ] T013 [US3] Connect extracted section timestamps from `SmartPasteModal` and `FileDropzone` into `SongForm` state in `src/app/songs/new/form.tsx`

**Checkpoint**: All user stories complete — full intelligent chord importing with automatic metadata and rehearsal timestamp synchronization.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Architecture validation, code formatting, comprehensive test execution, and production build verification.

- [ ] T014 [P] Run architecture check `bun run check:arch` and verify zero boundary violations
- [ ] T015 [P] Run linter and formatting check `bun run check` across all modified files
- [ ] T016 Run full automated test suite `bun test` verifying 100% tests passing including new unit tests
- [ ] T017 Execute quickstart scenarios in `specs/004-chord-smart-importer/quickstart.md` and verify production build with `bun run build`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories.
- **User Stories (Phase 3+)**: Depend on Foundational phase completion.
  - Phase 3 (US1 - MVP): Two-line converter & Smart Paste modal.
  - Phase 4 (US2): File Drag & Drop importer (builds on chord-converter module).
  - Phase 5 (US3): Timestamp extraction (enhances both US1 and US2).
- **Polish (Phase 6)**: Runs after all user stories are complete.

### Parallel Opportunities

- Within Phase 2: T003 (unit tests) can be written in parallel with T002.
- Within Phase 3: T004 (tests) and T006 (UI modal component) can run in parallel with T005 (domain converter).
- Within Phase 4: T008 (tests) and T010 (UI dropzone component) can run in parallel with T009 (domain extractor).
- Within Phase 6: T014 and T015 can run in parallel.
