# Interface Contracts: Rehearsal Live Playback Synchronization

**Feature Branch**: `003-rehearsal-live-sync` | **Date**: 2026-11-11

---

## 1. Domain Service Contract: `rehearsal-sync.ts`

Location: `src/core/domain/rehearsal-sync.ts`

```typescript
export interface RehearsalSection {
  label: string;
  startSeconds: number;
  endSeconds?: number;
}

/**
 * Pure deterministic resolution of active musical section based on playback timestamp.
 *
 * @param sections - Array of section timestamp markers for the song.
 * @param currentTimeSeconds - Current audio/video playback offset in seconds.
 * @returns The active section, or null if timestamp is before the first section or no sections exist.
 */
export function findActiveSection(
  sections: readonly RehearsalSection[],
  currentTimeSeconds: number,
): RehearsalSection | null;

/**
 * Formats a second counter into MM:SS display format.
 */
export function formatTimestamp(seconds: number): string;
```

---

## 2. Presentation Hook Contract: `use-playback-sync.ts`

Location: `src/presentation/hooks/use-playback-sync.ts`

```typescript
export interface UsePlaybackSyncOptions {
  sections: RehearsalSection[];
  player: {
    getCurrentTime: () => number;
    seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  } | null;
  isPlaying?: boolean;
  pollIntervalMs?: number; // Default: 250ms
  userOverrideBufferMs?: number; // Default: 3000ms
  initialAutoFollow?: boolean; // Default: true
}

export interface UsePlaybackSyncReturn {
  /** Current playback position in seconds (polled) */
  currentTime: number;
  /** Currently active section based on time */
  activeSection: RehearsalSection | null;
  /** Active section label for easy prop passing */
  activeSectionLabel: string | null;
  /** Whether auto-follow viewport scrolling is currently active */
  autoFollow: boolean;
  /** Toggle auto-follow on or off */
  setAutoFollow: (enabled: boolean | ((prev: boolean) => boolean)) => void;
  /** Whether user is currently overriding auto-scroll with manual gestures */
  isUserOverriding: boolean;
  /** Call this when user scrolls or touches the container */
  notifyUserGesture: () => void;
  /** Seek player to section and set as active */
  seekToSection: (section: RehearsalSection) => void;
}

export function usePlaybackSync(
  options: UsePlaybackSyncOptions,
): UsePlaybackSyncReturn;
```

---

## 3. UI Component Contract: `ChordSheet.tsx`

Location: `src/presentation/components/rehearsal/chord-sheet.tsx`

```typescript
export interface ChordSheetProps {
  sheet: ChordProSheet;
  fontSizeRem?: number;
  className?: string;
  onSectionClick?: (sectionTitle: string) => void;
  activeSectionTitle?: string | null;
  /** Ref to the active section HTML element for auto-scroll positioning */
  onActiveSectionElementChange?: (el: HTMLElement | null) => void;
}
```

---

## 4. Stage Utility Bar Contract: `StageUtilityBar.tsx`

Location: `src/presentation/components/rehearsal/stage-utility-bar.tsx`

Addition to `StageUtilityBarProps`:

```typescript
export interface StageUtilityBarProps {
  // Existing transposition & font scaling props...

  /** Auto-Follow Active Section feature */
  autoFollowActive?: boolean;
  onToggleAutoFollow?: () => void;
  hasSections?: boolean;
}
```
