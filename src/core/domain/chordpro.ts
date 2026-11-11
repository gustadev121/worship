/**
 * WorshipFlow Pure Domain: ChordPro Parser & Musical Key Transposition Engine
 * Adheres strictly to Constitution Principle I (Zero external dependencies, pure TypeScript).
 */

export interface ChordPair {
  readonly chord: string | null;
  readonly lyrics: string;
}

export interface ChordProLine {
  readonly lineNumber: number;
  readonly isComment: boolean;
  readonly commentText?: string;
  readonly pairs: readonly ChordPair[];
}

export interface ChordProSection {
  readonly sectionId: string;
  readonly title: string;
  readonly timestampSeconds?: number;
  readonly lines: readonly ChordProLine[];
}

export interface ChordProSheet {
  readonly title: string;
  readonly artist: string;
  readonly originalKey: string;
  readonly currentKey: string;
  readonly semitoneDelta: number;
  readonly sections: readonly ChordProSection[];
  readonly rawText: string;
}

export interface TranspositionState {
  readonly originalKey: string;
  readonly currentKey: string;
  readonly semitoneDelta: number;
}

export type AccidentalPreference = "sharp" | "flat" | "canonical";

const CHROMATIC_FLATS: readonly string[] = [
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
];

const CHROMATIC_SHARPS: readonly string[] = [
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
];

const SEMITONE_INDEX: Readonly<Record<string, number>> = {
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

const FLAT_KEY_PREFERENCES: ReadonlySet<string> = new Set([
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
  "F major",
  "Bb major",
  "Eb major",
  "Ab major",
  "Db major",
  "Gb major",
  "D minor",
  "G minor",
  "C minor",
  "F minor",
  "Bb minor",
  "Eb minor",
]);

/**
 * Extracts root note from a key string like "G major", "C# minor", or "Eb"
 */
export function extractRootNote(keyStr: string): string {
  const match = keyStr.trim().match(/^([A-G][b#]?)/i);
  if (!match) return keyStr.trim();
  const root = match[1];
  return root.charAt(0).toUpperCase() + root.slice(1);
}

/**
 * Checks if a string inside brackets is a musical chord rather than a section tag.
 */
export function isChordToken(token: string): boolean {
  const trimmed = token.trim();
  if (trimmed.length === 0 || trimmed.length > 14) return false;

  // Words that indicate sections rather than chords
  const sectionKeywords = [
    "verso",
    "verse",
    "coro",
    "chorus",
    "puente",
    "bridge",
    "intro",
    "outro",
    "pre-coro",
    "pre-chorus",
    "interludio",
    "interlude",
    "solo",
    "coda",
    "instrumental",
    "estrofa",
    "final",
  ];
  const lower = trimmed.toLowerCase();
  if (sectionKeywords.some((keyword) => lower.startsWith(keyword))) {
    return false;
  }

  // Musical chord regex: Root note (A-G with optional # or b), optional quality/modifier, optional /bass
  const chordRegex =
    /^[A-G][b#]?(?:m|maj|min|dim|aug|sus[24]?|add[29]?|2|4|5|6|7|9|11|13|M7|\+|°|ø)*(?:[-+b#][0-9]+)*(?:\/[A-G][b#]?)?$/;
  return chordRegex.test(trimmed);
}

/**
 * Transposes a single note by semitones delta.
 */
export function transposeNote(
  note: string,
  semitones: number,
  preference: AccidentalPreference = "canonical",
): string {
  const normalizedNote =
    note.trim().charAt(0).toUpperCase() + note.trim().slice(1);
  const currentIdx = SEMITONE_INDEX[normalizedNote];
  if (currentIdx === undefined) {
    return note;
  }

  const targetIdx = (((currentIdx + semitones) % 12) + 12) % 12;

  if (preference === "sharp") {
    return CHROMATIC_SHARPS[targetIdx];
  }
  if (preference === "flat") {
    return CHROMATIC_FLATS[targetIdx];
  }

  // "canonical" preference: default to standard worship chart conventions
  // Prefer flats for Db, Eb, Ab, Bb; prefer F# over Gb unless flat preference
  return CHROMATIC_FLATS[targetIdx];
}

/**
 * Transposes an entire chord token (including bass notes and modifiers).
 */
export function transposeChord(
  chord: string,
  semitones: number,
  preference: AccidentalPreference = "canonical",
): string {
  const normalizedDelta = ((semitones % 12) + 12) % 12;
  if (normalizedDelta === 0) {
    return chord;
  }

  const chordRegex = /^([A-G][b#]?)([^/]*)(?:\/([A-G][b#]?))?$/;
  const match = chord.trim().match(chordRegex);
  if (!match) {
    return chord;
  }

  const [, root, modifier, slash] = match;
  const newRoot = transposeNote(root, semitones, preference);
  const newSlash = slash
    ? `/${transposeNote(slash, semitones, preference)}`
    : "";

  return `${newRoot}${modifier}${newSlash}`;
}

/**
 * Helper to parse a single line into ChordPair segments.
 */
export function parseLinePairs(rawLine: string): readonly ChordPair[] {
  const pairs: ChordPair[] = [];
  const regex = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let currentChord: string | null = null;
  let match: RegExpExecArray | null;

  while (true) {
    match = regex.exec(rawLine);
    if (!match) break;

    const lyricsChunk = rawLine.substring(lastIndex, match.index);
    if (lyricsChunk.length > 0 || currentChord !== null) {
      pairs.push({
        chord: currentChord,
        lyrics: lyricsChunk,
      });
      currentChord = null;
    }

    const token = match[1].trim();
    if (isChordToken(token)) {
      currentChord = token;
    } else {
      // Bracketed text was not a chord; preserve it as literal lyrics
      currentChord = null;
      pairs.push({
        chord: null,
        lyrics: `[${token}]`,
      });
    }

    lastIndex = regex.lastIndex;
  }

  // Trailing lyric segment
  const remainingLyrics = rawLine.substring(lastIndex);
  if (remainingLyrics.length > 0 || currentChord !== null) {
    pairs.push({
      chord: currentChord,
      lyrics: remainingLyrics,
    });
  }

  return pairs;
}

/**
 * Parses raw ChordPro text into a structured, type-safe ChordProSheet.
 */
export function parseChordPro(
  rawText: string,
  metadata?: {
    title?: string;
    artist?: string;
    originalKey?: string;
  },
): ChordProSheet {
  const lines = rawText.split(/\r?\n/);
  const sections: ChordProSection[] = [];
  let currentSectionTitle = "General";
  let currentLines: ChordProLine[] = [];
  let detectedTitle = metadata?.title ?? "";
  let detectedArtist = metadata?.artist ?? "";
  let detectedKey = metadata?.originalKey ?? "C";

  function flushSection() {
    if (currentLines.length > 0) {
      const sectionId = currentSectionTitle
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      sections.push({
        sectionId: sectionId || `section-${sections.length + 1}`,
        title: currentSectionTitle,
        lines: currentLines,
      });
      currentLines = [];
    }
  }

  let lineCounter = 1;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    // 1. Directives: {title: ...}, {key: ...}, {c: ...}
    const directiveMatch = trimmed.match(/^\{([^:]+)(?::\s*([^}]+))?\}$/);
    if (directiveMatch) {
      const name = directiveMatch[1].trim().toLowerCase();
      const value = directiveMatch[2]?.trim() ?? "";

      if (name === "title" || name === "t") {
        detectedTitle = value;
      } else if (name === "artist" || name === "a") {
        detectedArtist = value;
      } else if (name === "key" || name === "k") {
        detectedKey = value;
      } else if (
        name === "comment" ||
        name === "c" ||
        name === "section" ||
        name === "soc" ||
        name === "start_of_chorus"
      ) {
        flushSection();
        currentSectionTitle =
          value || (name.includes("chorus") ? "Coro" : "Sección");
      }
      lineCounter++;
      continue;
    }

    // 2. Standalone bracket section header: e.g. [Verso 1], [Coro], [Puente]
    const headerMatch = trimmed.match(/^\[([A-Za-zÁ-ú0-9\s-]+)\]$/);
    if (headerMatch && !isChordToken(headerMatch[1])) {
      flushSection();
      currentSectionTitle = headerMatch[1];
      lineCounter++;
      continue;
    }

    // 3. Empty line
    if (trimmed.length === 0) {
      // Don't add leading empty lines if no content has been parsed yet
      if (currentLines.length > 0) {
        currentLines.push({
          lineNumber: lineCounter++,
          isComment: false,
          pairs: [{ chord: null, lyrics: "" }],
        });
      }
      continue;
    }

    // 4. Syllable-aligned chord/lyric line
    const pairs = parseLinePairs(rawLine);
    currentLines.push({
      lineNumber: lineCounter++,
      isComment: false,
      pairs,
    });
  }

  flushSection();

  return {
    title: detectedTitle,
    artist: detectedArtist,
    originalKey: detectedKey,
    currentKey: detectedKey,
    semitoneDelta: 0,
    sections,
    rawText,
  };
}

/**
 * Transposes an entire parsed ChordProSheet by semitone delta.
 */
export function transposeChordSheet(
  sheet: ChordProSheet,
  semitoneDelta: number,
  explicitPreference?: AccidentalPreference,
): ChordProSheet {
  const normalizedDelta = ((semitoneDelta % 12) + 12) % 12;

  // Determine accidental preference based on target key if not explicitly given
  const root = extractRootNote(sheet.originalKey);
  const targetRoot = transposeNote(root, semitoneDelta, "canonical");
  const preference: AccidentalPreference =
    explicitPreference ??
    (FLAT_KEY_PREFERENCES.has(targetRoot) ? "flat" : "sharp");

  const transposedKey = transposeChord(
    sheet.originalKey,
    semitoneDelta,
    preference,
  );

  if (normalizedDelta === 0) {
    return {
      ...sheet,
      currentKey: sheet.originalKey,
      semitoneDelta: 0,
    };
  }

  const transposedSections: ChordProSection[] = sheet.sections.map(
    (section) => ({
      ...section,
      lines: section.lines.map((line) => {
        if (line.isComment) {
          return line;
        }
        return {
          ...line,
          pairs: line.pairs.map((pair) => ({
            ...pair,
            chord: pair.chord
              ? transposeChord(pair.chord, semitoneDelta, preference)
              : null,
          })),
        };
      }),
    }),
  );

  return {
    ...sheet,
    currentKey: transposedKey,
    semitoneDelta,
    sections: transposedSections,
  };
}

/**
 * Calculates semitone distance between two canonical keys.
 */
export function calculateSemitoneDelta(fromKey: string, toKey: string): number {
  const rootFrom = extractRootNote(fromKey);
  const rootTo = extractRootNote(toKey);

  const idxFrom = SEMITONE_INDEX[rootFrom];
  const idxTo = SEMITONE_INDEX[rootTo];

  if (idxFrom === undefined || idxTo === undefined) {
    return 0;
  }

  let delta = (idxTo - idxFrom) % 12;
  if (delta > 6) {
    delta -= 12;
  } else if (delta < -5) {
    delta += 12;
  }

  return delta;
}
