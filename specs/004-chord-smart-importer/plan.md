# Implementation Plan: Smart ChordPro Importer & Two-Line Chord Text Converter

**Branch**: `004-chord-smart-importer` | **Date**: 2026-11-11 | **Spec**: [specs/004-chord-smart-importer/spec.md](file:///home/gustadev121/Workspace/Non-Profit/cjn/worship/specs/004-chord-smart-importer/spec.md)

**Input**: Feature specification from `specs/004-chord-smart-importer/spec.md`

## Summary

Implement an automated chord conversion and file importing pipeline into the song creation and edition views (`/songs/new` and `/songs/[id]/edit`).
The core consists of:
1. A pure domain two-line chord converter (`src/core/domain/chord-converter.ts`) that parses traditional chord sheets (chords on top, lyrics below), detects musical chords, extracts section timestamps, and interlaces chords with bracket notation `[G]` based on character column offsets.
2. A client-side file importer accepting `.chordpro`, `.cho`, `.pro`, and `.txt` files via Web `FileReader` and HTML5 Drag & Drop, extracting ChordPro directives (`{title}`, `{artist}`, `{key}`, `{tempo}`, `{time}`) to automatically populate form inputs.
3. An interactive "Smart Paste" modal in the presentation layer allowing live preview and instant application to the editor.

## Technical Context

**Language/Version**: TypeScript 5.8+ on Bun runtime (ESNext)
**Primary Dependencies**: React 19 (Client & Server Components), Vinext, Lucide icons (inline SVGs)
**Storage**: Cloudflare D1 (via existing Drizzle ORM `songs` schema — no database migration needed; all metadata and lyrics persist in existing columns)
**Testing**: Bun test runner (`bun test`) for pure domain unit tests
**Target Platform**: Edge-first Cloudflare Workers runtime (`workerd`) for server, modern evergreen browsers for client
**Project Type**: Next.js/Vinext Full-Stack Web Application (Strict Clean Architecture)
**Performance Goals**: Instantaneous conversion of 100+ line chord sheets in < 10ms entirely client-side
**Constraints**: Zero external dependencies in `src/core/domain` (100% pure TypeScript); maximum 500KB file upload limit; zero network requests for conversion
**Scale/Scope**: 1 new domain module, 2 new presentation components, integration into 2 existing pages (`new` and `edit`)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                            | Compliance Assessment                                                                                                                                                                                     | Status   |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **I. Clean Architecture Purity**     | The converter logic (`convertTwoLineToChordPro`, `extractChordProMetadata`, `isChordLine`) is isolated in `src/core/domain/chord-converter.ts` with 0 external imports. Verified by `bun run check:arch`. | **PASS** |
| **II. Unified D1 Persistence**       | Reuses existing `lyricsAndChords`, `sectionTimestamps`, `originalKey`, `bpm`, `timeSignature` columns. No database drift or new tables needed.                                                            | **PASS** |
| **III. Edge-First Isolation**        | File reading runs client-side via browser `FileReader`. No Node.js built-ins (`node:fs`) used in server code paths.                                                                                       | **PASS** |
| **IV. Automated Architecture Gates** | Automated unit tests in `tests/unit/domain/chord-converter.test.ts`. Quality gates `check:arch`, `check`, `test`, `build` must pass 100%.                                                                 | **PASS** |
| **V. Domain RBAC & Secure Identity** | Only authenticated `ADMIN` users can access `/songs/new` and `/songs/[id]/edit`. RBAC gates remain intact.                                                                                                | **PASS** |

## Project Structure

### Documentation (this feature)

```text
specs/004-chord-smart-importer/
├── spec.md              # Feature specification & requirements
├── checklists/
│   └── requirements.md  # 16/16 requirements completeness checks
├── plan.md              # Implementation plan (this file)
├── research.md          # Technical research & chord detection heuristics
├── data-model.md        # Pure domain interfaces & presentation types
├── quickstart.md        # Step-by-step testable validation scenarios
├── contracts/
│   └── chord-converter.md # Pure domain API signatures & rules
└── tasks.md             # Generated in next phase (/speckit-tasks)
```

### Source Code Impact

```text
src/
├── core/
│   └── domain/
│       └── chord-converter.ts        # Pure domain two-line converter & file metadata extractor (NEW)
├── presentation/
│   └── components/
│       └── rehearsal/
│           ├── smart-paste-modal.tsx  # Interactive conversion modal with live preview (NEW)
│           └── file-dropzone.tsx      # Drag & Drop file importer target (NEW)
└── app/
    ├── songs/
    │   ├── new/
    │   │   └── form.tsx              # Wire Smart Paste & Dropzone into create form (MODIFIED)
    │   └── [id]/
    │       └── edit/
    │           └── page.tsx          # Wire Smart Paste & Dropzone into edit form (MODIFIED)

tests/
└── unit/
    └── domain/
        └── chord-converter.test.ts   # Comprehensive unit test suite (NEW)
```

## Phases

### Phase 0: Outline & Research

- Resolved chord line identification heuristics (>= 70% valid chord tokens, Spanish word disambiguation).
- Documented character column offset syllable alignment algorithm.
- Documented section normalization and timestamp extraction regexes.
- Output: [`specs/004-chord-smart-importer/research.md`](file:///home/gustadev121/Workspace/Non-Profit/cjn/worship/specs/004-chord-smart-importer/research.md)

### Phase 1: Design & Contracts

- Defined domain data structures: `ChordToken`, `TwoLineConversionResult`, `ImportedSongMetadata`.
- Defined interface contracts: [`contracts/chord-converter.md`](file:///home/gustadev121/Workspace/Non-Profit/cjn/worship/specs/004-chord-smart-importer/contracts/chord-converter.md).
- Authored step-by-step validation guide: [`quickstart.md`](file:///home/gustadev121/Workspace/Non-Profit/cjn/worship/specs/004-chord-smart-importer/quickstart.md).
- Verified Clean Architecture compliance.
