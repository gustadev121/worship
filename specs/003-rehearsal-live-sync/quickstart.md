# Quickstart & Verification Guide: Rehearsal Live Playback Synchronization

**Feature Branch**: `003-rehearsal-live-sync` | **Date**: 2026-11-11

---

## Prerequisites

1. Bun installed: `bun --version` (v1.4+)
2. Local database seeded: `bun run seed`
3. Dev server running: `bun run dev` (starts on `http://localhost:5173`)

---

## Verification Scenarios

### Scenario 1: Automated Unit Tests for Time-to-Section Matching

Run the deterministic test suite verifying boundary matching, sorting, and edge cases:

```bash
bun test tests/unit/domain/rehearsal-sync.test.ts
```

**Expected Outcome**:
- All tests pass (0 failures).
- Correctly matches:
  - Exact timestamp matches (e.g., `45.0s` matches Chorus starting at `45s`).
  - Intermediate timestamps (e.g., `62.4s` falls within `45s - 90s`).
  - Edge case: time before first section returns `null`.
  - Edge case: time beyond last section returns the final section.
  - Edge case: out-of-order section definitions are safely resolved.

---

### Scenario 2: Live Playback Synchronization in Rehearsal Studio

1. Open `http://localhost:5173/songs/new` or select existing seeded song (`Amazing Grace` or `10,000 Reasons`) with a YouTube video assigned.
2. Ensure at least 2 section timestamps exist (e.g., `Verse 1: 0:00`, `Chorus: 0:45`).
3. Navigate to `http://localhost:5173/songs/[id]/practice`.
4. Press Play on the YouTube player.

**Expected Outcome**:
- At `0:00 - 0:44`: The "Verse 1" card and its badge are highlighted with an amber glowing border (`--chord-accent`).
- At `0:45`: The highlight automatically transfers smoothly to "Chorus".
- If "Auto-Follow" is enabled in the utility bar, the chord sheet smoothly scrolls downward to keep the Chorus visible without touching the mouse or screen.

---

### Scenario 3: Manual Seeking & Gesture Buffer Verification

1. While the song is playing at `0:15` in Verse 1, click the "Chorus (0:45)" button under **Saltar a Sección** or on the section header.
2. Manually scroll the chord sheet upwards using your finger or mouse wheel.

**Expected Outcome**:
- Media immediately seeks to `0:45` and Chorus highlights.
- When you manually scroll away, the viewport does **not** violently snap back. Auto-follow pauses for 3 seconds of user inactivity before re-engaging.

---

### Scenario 4: A-B Rehearsal Looping Synchronization

1. During playback, set **Marcar A** at `0:45` (Chorus start) and **Marcar B** at `1:15` (Chorus end).
2. Allow playback to reach `1:15`.

**Expected Outcome**:
- Player automatically loops back to `0:45`.
- Active section remains "Chorus" without visual flicker or jumping out of place.

---

## Quality Gate Commands

Run the full verification battery prior to finalizing:

```bash
bun run check:arch   # Verifies pure core layers
bun run check        # Biome linting & formatting
bun test             # 100% test suite passing
bun run build        # Production bundle validation
```
