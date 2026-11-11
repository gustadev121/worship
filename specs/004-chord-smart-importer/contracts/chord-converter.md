# Contracts: Chord Converter & Importer Domain Interface

**Feature**: `004-chord-smart-importer`
**Date**: 2026-11-11
**Module**: `src/core/domain/chord-converter.ts`

## 1. Pure Domain API

### `isValidChordToken(token: string): boolean`
Evaluates whether an individual string token represents a valid musical chord.

- **Inputs**:
  - `token`: String token with punctuation stripped (e.g. `"G"`, `"D/F#"`, `"Em7"`, `"Cadd9"`, `"Sol"`, `"Lam"`, `"Bbm"`)
- **Returns**: `true` if matching chord pattern, `false` otherwise.
- **Rules**:
  - Root note: `[A-G][#b]?` or `(Do|Re|Mi|Fa|Sol|La|Si)[#b]?` (case-insensitive for solfège, uppercase for letters).
  - Modifier: `(m|maj|min|dim|aug|sus[24]?|add[29]?|[245679]|11|13|M7)*`.
  - Slash bass: `(\/[A-G][#b]?)?` or `(\/(Do|Re|Mi|Fa|Sol|La|Si)[#b]?)?`.
  - Common Spanish words (`de`, `el`, `la`, `en`, `un`, `es`, `por`, `con`) MUST explicitly return `false`.

### `isChordLine(line: string): boolean`
Determines if a plain text line contains only chords and whitespace.

- **Inputs**:
  - `line`: Single line of text.
- **Returns**: `true` if line is determined to be a chord line, `false` if it is a lyric, header, or directive line.
- **Rules**:
  - Empty lines return `false`.
  - Lines containing known prose words return `false`.
  - If >= 70% of non-empty whitespace-split tokens are valid chords, returns `true`.

### `convertTwoLineToChordPro(rawText: string): TwoLineConversionResult`
Converts two-line formatted text (chords on top, lyrics underneath) into unified ChordPro bracket notation.

- **Inputs**:
  - `rawText`: Multi-line text string.
- **Returns**: `TwoLineConversionResult` containing `chordProText`, `extractedTimestamps`, `detectedKey`, `lineCount`, `chordsCount`, `warnings`.
- **Behavior**:
  - Scans line by line.
  - Detects section titles (e.g. `Coro:`, `[Verso 1]`, `Intro`) and formats as ChordPro section headers.
  - When a chord line is followed by a lyric line, aligns each chord to the lyric line based on character column index.
  - When consecutive chord lines appear (e.g. intro or instrumental), formats them as bracketed chords on one line `[G] [D] [Em] [C]`.

### `extractChordProMetadata(fileContent: string): ImportedSongMetadata`
Extracts directives and body content from an uploaded `.chordpro`, `.cho`, or `.txt` file.

- **Inputs**:
  - `fileContent`: Raw text content read from a file.
- **Returns**: `ImportedSongMetadata`.
- **Directives Extracted**:
  - `{title: ...}` / `{t: ...}`
  - `{artist: ...}` / `{a: ...}`
  - `{key: ...}` / `{k: ...}`
  - `{tempo: ...}` / `{bpm: ...}`
  - `{time: ...}`
  - `{comment: ...}` with embedded timestamps
- **Fallback**:
  - If no `{...}` directives are found and lines appear as two-line chords, automatically runs `convertTwoLineToChordPro(fileContent)`.
