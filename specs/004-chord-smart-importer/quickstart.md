# Quickstart Validation Guide: Smart ChordPro Importer & Converter

**Feature**: `004-chord-smart-importer`
**Date**: 2026-11-11

This guide provides testable end-to-end validation steps for the Smart Paste converter and ChordPro file importer.

---

## 1. Unit Test Verification (Pure Domain)

Run automated unit tests for the two-line chord converter:
```bash
bun test tests/unit/domain/chord-converter.test.ts
```

Expected output:
- 100% tests passing in < 50ms.
- Verified test cases:
  1. Standard verse and chorus alignment (`G`, `D`, `Em`, `C`).
  2. Slash chords and extensions (`D/F#`, `Cadd9`, `Bm7`, `F#m7b5`).
  3. Latin solfège chords (`Do`, `Sol`, `Lam`, `Fa#m`).
  4. Instrumental / intro chord progressions without lyrics.
  5. Distinction between chords and Spanish prose words (`A`, `Y`, `El`, `De`).
  6. Timestamp extraction from headers (`[Coro - 1:30]`).
  7. File directive extraction (`{title}`, `{artist}`, `{key}`, `{tempo}`, `{time}`).

---

## 2. Interactive UI Validation: Smart Paste

1. Start development server:
   ```bash
   bun run dev
   ```
2. Navigate to `http://localhost:5173/songs/new` (or edit an existing song).
3. In Section **4. Letras y Acordes ChordPro**, locate the new toolbar button:
   `[⚡ Pegar texto clásico (acordes sobre letra)]`.
4. Click the button to open the **Smart Paste Converter** modal.
5. Paste the following test snippet into the raw text area:
   ```text
   [Intro]
   G  D/F#  Em7  Cadd9

   [Verso 1 - 0:30]
   G                D/F#
   En tu presencia hay plenitud
   Em7              Cadd9
   En tu mirada paz y quietud

   [Coro - 1:15]
   Cadd9            G
   Aleluya al Rey eterno
   D/F#             Em7
   Santo es tu gran nombre
   ```
6. **Verify Live Preview**:
   - The preview updates instantly in real time.
   - Chords are intercalated into the lyrics: `[G]En tu presencia [D/F#]hay plenitud`.
   - The intro line renders as `[G] [D/F#] [Em7] [Cadd9]`.
   - Extracted timestamps badge displays: `Verso 1 (0:30)` and `Coro (1:15)`.
7. Click **"Aplicar al Editor"**:
   - The ChordPro editor textarea is populated with the clean result.
   - The section timestamps table automatically contains the two detected sections with 30s and 75s.

---

## 3. Interactive UI Validation: Drag & Drop File Importer

1. In the same form, locate the **Subir archivo de acordes** dropzone button.
2. Prepare a test file named `amazing-grace.chordpro`:
   ```chordpro
   {title: Gracia Sublime}
   {artist: Phil Wickham}
   {key: G major}
   {tempo: 104}
   {time: 4/4}

   [Verso 1]
   [G]Quién rompe el poder [C]del pecado
   [Em]Su amor es fuerte y [D]poderoso
   ```
3. Drag and drop the file onto the dropzone or click to select it.
4. **Verify Auto-Population**:
   - Título becomes `Gracia Sublime`.
   - Artista becomes `Phil Wickham`.
   - Tono Original becomes `G major`.
   - BPM becomes `104`.
   - Compás becomes `4/4`.
   - Editor contains the ChordPro body.

---

## 4. Architecture & Quality Gates

Verify zero architectural regressions:
```bash
bun run check:arch
bun run check
bun test
bun run build
```
All four checks must exit with code 0.
