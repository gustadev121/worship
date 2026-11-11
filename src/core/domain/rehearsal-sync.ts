/**
 * WorshipFlow Pure Domain: Rehearsal Playback Synchronization
 * Strict Clean Architecture: Zero external dependencies.
 */

export interface RehearsalSection {
  label: string;
  startSeconds: number;
  endSeconds?: number;
}

export interface ActiveSectionMatch {
  section: RehearsalSection | null;
  sectionLabel: string | null;
  startSeconds: number | null;
  isExplicitSeek?: boolean;
}

export interface PlaybackSyncState {
  currentTimeSeconds: number;
  activeSectionLabel: string | null;
  isPlaying: boolean;
  autoFollowEnabled: boolean;
  isUserOverriding: boolean;
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
): RehearsalSection | null {
  if (!sections || sections.length === 0) {
    return null;
  }

  // Treat negative timestamps as 0
  const normalizedTime = Math.max(0, currentTimeSeconds);

  // Sort canonically by startSeconds ascending
  const sorted = [...sections].sort((a, b) => a.startSeconds - b.startSeconds);

  // If time is before the first section start time, no section is active
  if (normalizedTime < sorted[0].startSeconds) {
    return null;
  }

  let active: RehearsalSection | null = null;

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    // If explicit endSeconds is provided and we exceeded it
    if (
      current.endSeconds !== undefined &&
      normalizedTime >= current.endSeconds
    ) {
      continue;
    }

    // Check if within current segment start and next segment start
    if (normalizedTime >= current.startSeconds) {
      if (!next || normalizedTime < next.startSeconds) {
        active = current;
        break;
      }
    }
  }

  return active ?? sorted[sorted.length - 1];
}

/**
 * Formats a second counter into MM:SS display format.
 */
export function formatTimestamp(seconds: number): string {
  const normalized = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(normalized / 60);
  const secs = normalized % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}
