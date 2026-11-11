# Research: Smart ChordPro Importer & Two-Line Chord Text Converter

**Feature**: `004-chord-smart-importer`
**Date**: 2026-11-11
**Status**: Completed

## 1. Two-Line Chord Line Detection & Alignment Algorithm

### Context & Problem
Musicians and worship leaders copy songs from sites like LaCuerda.net, Ultimate Guitar, Christian lyric blogs, or PDFs. In these sources, songs are formatted with chords on one line and lyrics on the line directly below:
```text
G                D/F#            Em7          Cadd9
En tu presencia hay plenitud, en tu mirada encuentro paz
```
Intercalating brackets `[G]` manually around every syllable takes 5–10 minutes per song. We need a deterministic, pure function in `src/core/domain` that converts this into:
```text
[G]En tu presencia [D/F#]hay plenitud, [Em7]en tu mirada [Cadd9]encuentro paz
```

### Research Findings & Decision
- **Chord Line Heuristics**:
  1. A line is considered a **chord line** if >= 70% of its non-whitespace whitespace-separated tokens are valid musical chord representations, OR if all tokens are valid chords and musical symbols (e.g., `|`, `/`, `%`).
  2. A token is a valid chord if it matches Western notation (`A-G` with `#`/`b`, chord qualities `m`, `maj`, `min`, `dim`, `aug`, `sus`, `add`, `2`, `4`, `5`, `6`, `7`, `9`, `11`, `13`, and optional slash bass `/A-G[#b]?`) or Latin solfège (`Do`, `Re`, `Mi`, `Fa`, `Sol`, `La`, `Si`).
  3. Single-letter words in Spanish that look like chords: `A` (preposition) or `Y` (conjunction). If a line contains regular prose words ("de", "el", "que", "amor", "dios"), the line is classified as **lyrics**, never a chord line.
- **Syllable Alignment Algorithm**:
  1. For each chord token on the chord line, record its character start index (`col`).
  2. If the next line is a lyric line:
     - Sort chords by column ascending.
     - Insert `[Chord]` into the lyric line at the corresponding column index.
     - If the chord column exceeds the length of the lyric line (e.g. trailing chords), append trailing spaces or attach `[Chord]` at the end of the line.
     - Adjust string slice offsets as brackets are inserted from left to right or by reconstructing substrings.
  3. If the next line is ALSO a chord line (instrumental section like `[G] [D] [Em] [C]`) or the next line is empty:
     - Output the line formatted as spaced bracketed chords `[G] [D/F#] [Em7] [Cadd9]`.
- **Alternatives Considered**:
  - *Regex-only search/replace*: Inadequate because columns and spaces between chords indicate which syllable the chord falls on.
  - *LLM / AI text conversion*: Unpredictable, introduces latency, requires API keys and network. A deterministic regex + column index algorithm is instantaneous (0ms), runs offline, and is 100% testable.

---

## 2. Section Header & Directive Normalization

### Context & Problem
Plain text charts indicate song sections in various non-standard ways:
- `[Verso 1]`, `Verso 1:`, `VERSE 1`, `V1:`
- `[CORO]`, `Coro:`, `Chorus`, `ESTRIBILLO:`
- `[Puente]`, `Bridge:`, `PUENTE`
- `Intro:`, `INTRO`, `Outro`, `Final`
- `Solo de Guitarra:`, `Instrumental:`

### Decision
- Normalization mapping:
  - If a line is wrapped in brackets `[...]` or ends with `:`, or matches standard section keywords alone on a line, extract the clean section name.
  - Normalize to capitalized standard labels: `[Verso 1]`, `[Coro]`, `[Puente]`, `[Intro]`, `[Instrumental]`, `[Outro]`, `[Final]`.
  - Maintain compatibility with ChordPro `{comment: ...}` and `{c: ...}` directives.

---

## 3. Timestamp Extraction from Section Headers

### Context & Problem
Musicians often note video timestamps in their song notes:
- `[Verso 1 - 0:45]`
- `Coro (1:30)`
- `{comment: Puente 02:15}`

### Decision
- Regular expression: `/\b(\d{1,2}):(\d{2})\b/`
- When detected in a section header line:
  - Calculate `startSeconds = minutes * 60 + seconds`.
  - Strip the timestamp part from the header so the rendered section title remains clean (e.g., `Verso 1`).
  - Return extracted `SectionTimestamp` objects `{ label: "Verso 1", startSeconds: 45 }` to feed directly into the song form's `sectionTimestamps` array.

---

## 4. File Drag & Drop and Client-Side Parsing

### Context & Problem
We want users to drag and drop `.chordpro`, `.cho`, `.pro`, and `.txt` files directly into the browser without uploading files to a server endpoint.

### Decision
- Use standard HTML5 Drag & Drop API (`onDragOver`, `onDragLeave`, `onDrop`) and `<input type="file" accept=".chordpro,.cho,.pro,.txt,.chopro">`.
- Use the Web API `FileReader.readAsText(file, "UTF-8")`.
- Extract directives via standard regex:
  - `{title: (.*?)}` or `{t: (.*?)}` ➔ `title`
  - `{artist: (.*?)}` or `{a: (.*?)}` ➔ `artist`
  - `{key: (.*?)}` or `{k: (.*?)}` ➔ `originalKey`
  - `{tempo: (\d+)}` ➔ `bpm`
  - `{time: (.*?)}` ➔ `timeSignature`
- If the file is plain text (without `{...}` directives), pass it through the Two-Line Chord Text Converter.
- Safety: Enforce 500KB max file size limit to prevent memory spikes in the browser.
- Prompt confirmation if the editor already has content to avoid accidental overwrite.

---

## 5. Architectural Alignment with Constitution

- **Layer I (Clean Architecture Purity)**:
  - `src/core/domain/chord-converter.ts`: Pure TypeScript functions (`convertTwoLineToChordPro`, `extractChordProMetadata`, `isChordLine`, `isValidChordToken`). Zero external dependencies.
- **Layer IV (Automated Architecture Gates & Tests)**:
  - `bun run check:arch` passes with zero boundary violations.
  - Comprehensive unit test suite in `tests/unit/domain/chord-converter.test.ts` covering simple songs, slash chords, solfège chords, instrumental lines, Spanish words, and edge cases.
