import type { SectionTimestamp } from "./song";

/**
 * Isolated musical chord token with its 0-based column start position in the original line.
 */
export interface ChordToken {
  readonly chord: string;
  readonly columnIndex: number;
}

/**
 * Deterministic result of converting two-line chord text into ChordPro format.
 */
export interface TwoLineConversionResult {
  readonly chordProText: string;
  readonly extractedTimestamps: SectionTimestamp[];
  readonly detectedKey: string | null;
  readonly lineCount: number;
  readonly chordsCount: number;
  readonly warnings: string[];
}

/**
 * Extracted metadata from ChordPro or imported chord sheet files.
 */
export interface ImportedSongMetadata {
  readonly title?: string;
  readonly artist?: string;
  readonly originalKey?: string;
  readonly bpm?: number;
  readonly timeSignature?: string;
  readonly lyricsAndChords: string;
  readonly sectionTimestamps: SectionTimestamp[];
}

/**
 * Spanish words that frequently appear in worship songs and must NEVER be treated as chords,
 * even when capitalized.
 */
const SPANISH_PROSE_STOPWORDS = new Set([
  "al",
  "algo",
  "ante",
  "aqui",
  "bajo",
  "bien",
  "cada",
  "como",
  "con",
  "contra",
  "cual",
  "cuando",
  "de",
  "del",
  "desde",
  "donde",
  "el",
  "ella",
  "ellos",
  "en",
  "entre",
  "era",
  "eres",
  "es",
  "esta",
  "este",
  "fue",
  "ha",
  "hacia",
  "hasta",
  "hay",
  "hoy",
  "las",
  "le",
  "les",
  "lo",
  "los",
  "mas",
  "me",
  "mi",
  "mis",
  "mucho",
  "muy",
  "nada",
  "ni",
  "no",
  "nos",
  "o",
  "otra",
  "otro",
  "para",
  "pero",
  "por",
  "porque",
  "que",
  "quien",
  "se",
  "sea",
  "ser",
  "si",
  "sin",
  "sobre",
  "solo",
  "somos",
  "son",
  "soy",
  "su",
  "sus",
  "tan",
  "te",
  "ti",
  "tiene",
  "todo",
  "tras",
  "tu",
  "tus",
  "un",
  "una",
  "unas",
  "uno",
  "unos",
  "va",
  "vamos",
  "veo",
  "vida",
  "voy",
  "y",
  "ya",
  "yo",
  // Common religious words in lyrics that must not be parsed as chords
  "amor",
  "cielo",
  "cristo",
  "cruz",
  "dios",
  "fe",
  "gloria",
  "gracia",
  "jesus",
  "luz",
  "paz",
  "rey",
  "santo",
  "senor",
]);

/**
 * Standard Western musical chord regex:
 * - Root: A-G followed by optional accidental (#, b)
 * - Quality / Extensions: maj, min, m, dim, aug, sus, add, numbers 2-13, etc.
 * - Optional slash bass note: /A-G[#b]?
 */
const WESTERN_CHORD_REGEX =
  /^[A-G](?:#|b)?(?:maj|min|m|dim|aug|sus|add|[0-9]{1,2}|M7|b5|#5|b9|#9|b13|#11)*(?:\/[A-G](?:#|b)?)?$/;

/**
 * Latin solfège chord regex:
 * - Root: Do, Re, Mi, Fa, Sol, La, Si followed by optional accidental (#, b)
 * - Quality / Extensions: m, maj, 7, sus4, etc.
 * - Optional slash bass note: /(Do|Re|Mi|Fa|Sol|La|Si|[A-G])[#b]?
 */
const LATIN_SOLFEGE_CHORD_REGEX =
  /^(?:Do|Re|Mi|Fa|Sol|La|Si)(?:#|b)?(?:maj|min|m|dim|aug|sus|add|[0-9]{1,2}|M7|b5|#5)*(?:\/(?:Do|Re|Mi|Fa|Sol|La|Si|[A-G])(?:#|b)?)?$/i;

/**
 * Section title keywords for normalization.
 */
const SECTION_KEYWORDS: Record<string, string> = {
  verso: "Verso",
  verse: "Verso",
  estrofa: "Verso",
  coro: "Coro",
  chorus: "Coro",
  estribillo: "Coro",
  puente: "Puente",
  bridge: "Puente",
  intro: "Intro",
  introduccion: "Intro",
  instrumental: "Instrumental",
  outro: "Outro",
  final: "Final",
  precoro: "Pre-Coro",
  "pre-coro": "Pre-Coro",
  "pre-chorus": "Pre-Coro",
  solo: "Solo",
  interludio: "Interludio",
  coda: "Coda",
};

/**
 * Strips boundary punctuation from a token for chord testing.
 */
function cleanChordToken(raw: string): string {
  return raw.replace(/^[([{<|]+|[)\]}>|,:;]+$/g, "").trim();
}

/**
 * Checks whether an individual token is a valid musical chord representation.
 */
export function isValidChordToken(token: string): boolean {
  const cleaned = cleanChordToken(token);
  if (!cleaned || cleaned.length > 15) return false;

  // Single-letter lowercase "a" or lowercase "la" are Spanish prose words, not chords
  if (cleaned === "a" || cleaned === "la") {
    return false;
  }

  const lower = cleaned.toLowerCase();
  if (SPANISH_PROSE_STOPWORDS.has(lower)) {
    return false;
  }

  // Western notation (strict uppercase root: A-G)
  if (WESTERN_CHORD_REGEX.test(cleaned)) {
    return true;
  }

  // Latin solfège notation
  if (LATIN_SOLFEGE_CHORD_REGEX.test(cleaned)) {
    return true;
  }

  return false;
}

/**
 * Determines if a line is a chord line (i.e. contains predominantly chords and whitespace).
 */
export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Don't treat section headers as chord lines
  if (/^(\[.*\]|\{.*\}|[A-Za-z0-9\s]+:)$/.test(trimmed)) {
    // If it looks like a section header keyword (e.g. "Coro:", "[Verso 1]"), it's not a chord line
    const firstWord = trimmed
      .replace(/[[\]{}:]/g, "")
      .trim()
      .split(/\s+/)[0]
      ?.toLowerCase();
    if (firstWord && SECTION_KEYWORDS[firstWord]) {
      return false;
    }
  }

  // Split line by whitespace
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;

  // Filter out musical bar dividers or rhythm marks when calculating chord percentage
  const evaluatedTokens = tokens.filter((t) => !/^[|/%-]+$/.test(t.trim()));
  if (evaluatedTokens.length === 0) return false;

  let chordCount = 0;
  let proseWordCount = 0;

  for (const token of evaluatedTokens) {
    const cleaned = cleanChordToken(token);
    if (!cleaned) continue;

    if (
      cleaned === "a" ||
      cleaned === "la" ||
      SPANISH_PROSE_STOPWORDS.has(cleaned.toLowerCase())
    ) {
      proseWordCount++;
    } else if (isValidChordToken(cleaned)) {
      chordCount++;
    }
  }

  // If line contains known prose words, it's definitely lyrics, not a chord line
  if (proseWordCount > 0) {
    return false;
  }

  // At least 70% of evaluated tokens must be valid chords, with at least 1 chord
  return chordCount > 0 && chordCount / evaluatedTokens.length >= 0.7;
}

/**
 * Parses timestamp string (mm:ss or m:ss) into total integer seconds.
 */
export function parseTimestampSeconds(timeStr: string): number | null {
  const match = timeStr.match(/\b(\d{1,2}):(\d{2})\b/);
  if (!match) return null;
  const minutes = Number.parseInt(match[1], 10);
  const seconds = Number.parseInt(match[2], 10);
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) return null;
  return minutes * 60 + seconds;
}

/**
 * Extracts section header details: normalized label and optional timestamp.
 */
function parseSectionHeader(line: string): {
  normalizedHeader: string;
  timestamp: SectionTimestamp | null;
} | null {
  const trimmed = line.trim();

  // Pattern 1: Bracketed [Verso 1 - 0:45] or [Coro]
  // Pattern 2: Colon suffix Verso 1: or Coro: (1:15)
  // Pattern 3: Standalone keyword like INTRO or PUENTE
  const isBracketed = trimmed.startsWith("[") && trimmed.endsWith("]");
  const hasColon = trimmed.endsWith(":");
  const innerText = isBracketed
    ? trimmed.slice(1, -1).trim()
    : trimmed.replace(/:$/, "").trim();

  // Check if starts with a known section keyword
  const words = innerText.split(/\s+/);
  const firstWord = words[0]?.toLowerCase().replace(/[^a-z-]/g, "");

  const matchedKeyword = firstWord ? SECTION_KEYWORDS[firstWord] : undefined;
  if (!matchedKeyword && !isBracketed && !hasColon) {
    return null;
  }

  // Look for timestamp pattern (e.g. 1:30 or 0:45)
  const seconds = parseTimestampSeconds(innerText);

  // Clean the title by removing timestamps and dashes
  let cleanTitle = innerText
    .replace(/\b\d{1,2}:\d{2}\b/g, "")
    .replace(/[-–()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanTitle && matchedKeyword) {
    cleanTitle = matchedKeyword;
  }

  // Capitalize first letter of each word if not already capitalized
  if (cleanTitle) {
    cleanTitle = cleanTitle
      .split(" ")
      .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ");
  }

  const normalizedHeader = `[${cleanTitle || matchedKeyword || "Sección"}]`;

  const timestamp: SectionTimestamp | null =
    seconds !== null && cleanTitle
      ? {
          label: cleanTitle,
          startSeconds: seconds,
        }
      : null;

  return { normalizedHeader, timestamp };
}

/**
 * Extracts all chord tokens with their character column start indices from a chord line.
 */
function extractChordTokensWithPositions(line: string): ChordToken[] {
  const results: ChordToken[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null = regex.exec(line);

  while (match !== null) {
    const rawToken = match[0];
    const cleaned = cleanChordToken(rawToken);

    if (isValidChordToken(cleaned)) {
      // Find where cleaned chord starts inside rawToken
      const offsetInToken = rawToken.indexOf(cleaned);
      const colIndex = match.index + Math.max(offsetInToken, 0);
      results.push({
        chord: cleaned,
        columnIndex: colIndex,
      });
    }

    match = regex.exec(line);
  }

  return results;
}

/**
 * Interlaces chord tokens into a lyric line based on their column positions.
 */
function interlaceChordsIntoLyricLine(
  chords: ChordToken[],
  lyricLine: string,
): string {
  if (chords.length === 0) return lyricLine;

  // Sort chords by column ascending
  const sorted = [...chords].sort((a, b) => a.columnIndex - b.columnIndex);

  let result = "";
  let lastLyricIndex = 0;

  for (const item of sorted) {
    let targetCol = item.columnIndex;

    // Smart snap: if targetCol lands 1 character into a word (e.g. index 17 when word started at 16 after a space),
    // snap to the word start at index 16 so chord precedes the word [D]hay instead of h[D]ay
    if (
      targetCol > 0 &&
      targetCol < lyricLine.length &&
      lyricLine[targetCol] !== " " &&
      lyricLine[targetCol - 1] !== " " &&
      (targetCol === 1 || lyricLine[targetCol - 2] === " ")
    ) {
      targetCol -= 1;
    }

    // Ensure we don't jump backward past the last inserted point
    if (targetCol < lastLyricIndex) {
      targetCol = lastLyricIndex;
    }

    if (targetCol <= lyricLine.length) {
      // Append lyrics up to this column
      result += lyricLine.slice(lastLyricIndex, targetCol);
      // Insert bracketed chord
      result += `[${item.chord}]`;
      lastLyricIndex = targetCol;
    } else {
      // Chord is beyond the current lyrics length (trailing chords)
      result += lyricLine.slice(lastLyricIndex);
      // Add spaces if needed
      const padding = " ".repeat(Math.max(1, targetCol - lyricLine.length));
      result += `${padding}[${item.chord}]`;
      lastLyricIndex = lyricLine.length;
    }
  }

  // Append remaining lyrics
  if (lastLyricIndex < lyricLine.length) {
    result += lyricLine.slice(lastLyricIndex);
  }

  return result;
}

/**
 * Converts traditional two-line text (chords on top, lyrics below) into unified ChordPro bracket format.
 */
export function convertTwoLineToChordPro(
  rawText: string,
): TwoLineConversionResult {
  const lines = rawText.split(/\r?\n/);
  const outputLines: string[] = [];
  const extractedTimestamps: SectionTimestamp[] = [];
  const detectedChordsSet = new Set<string>();
  const warnings: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Check for empty lines
    if (!trimmed) {
      outputLines.push("");
      i++;
      continue;
    }

    // 2. Check for section headers
    const sectionInfo = parseSectionHeader(line);
    if (sectionInfo) {
      outputLines.push(sectionInfo.normalizedHeader);
      if (sectionInfo.timestamp) {
        extractedTimestamps.push(sectionInfo.timestamp);
      }
      i++;
      continue;
    }

    // 3. Check for ChordPro directives already present e.g. {title: ...} or [G]inline chords
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      outputLines.push(line);
      i++;
      continue;
    }

    // 4. Check if current line is a chord line
    if (isChordLine(line)) {
      const chords = extractChordTokensWithPositions(line);
      for (const c of chords) {
        detectedChordsSet.add(c.chord);
      }

      // Look ahead to the next line
      const nextIndex = i + 1;
      const nextLine = nextIndex < lines.length ? lines[nextIndex] : null;

      if (
        nextLine?.trim() &&
        !isChordLine(nextLine) &&
        !parseSectionHeader(nextLine)
      ) {
        // Next line is lyrics! Interlace chords into it
        const mergedLine = interlaceChordsIntoLyricLine(chords, nextLine);
        outputLines.push(mergedLine);
        i += 2; // Consumed both chord line and lyric line
        continue;
      }

      // Next line is empty, another chord line, or a section header (e.g. Intro / Instrumental progression)
      // Format as standalone bracketed chords: [G] [D/F#] [Em7]
      const formattedChords = chords.map((c) => `[${c.chord}]`).join(" ");
      outputLines.push(formattedChords);
      i++;
      continue;
    }

    // 5. Normal line (lyrics without chord line above it)
    outputLines.push(line);
    i++;
  }

  // Deduplicate and sort timestamps
  const uniqueTimestamps = extractedTimestamps
    .filter(
      (ts, idx, arr) =>
        arr.findIndex(
          (x) => x.label === ts.label && x.startSeconds === ts.startSeconds,
        ) === idx,
    )
    .sort((a, b) => a.startSeconds - b.startSeconds);

  // Attempt to infer key from most frequent or first chord
  let detectedKey: string | null = null;
  if (detectedChordsSet.size > 0) {
    const firstChord = Array.from(detectedChordsSet)[0];
    detectedKey = firstChord
      ? `${firstChord.replace(/\/[A-G][#b]?/, "")}`
      : null;
  }

  return {
    chordProText: outputLines.join("\n"),
    extractedTimestamps: uniqueTimestamps,
    detectedKey,
    lineCount: lines.length,
    chordsCount: detectedChordsSet.size,
    warnings,
  };
}

/**
 * Extracts ChordPro directives and body from an uploaded file content.
 */
export function extractChordProMetadata(
  fileContent: string,
): ImportedSongMetadata {
  let title: string | undefined;
  let artist: string | undefined;
  let originalKey: string | undefined;
  let bpm: number | undefined;
  let timeSignature: string | undefined;

  const contentLines: string[] = [];
  const lines = fileContent.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for ChordPro directives: {directive: value} or {directive}
    const directiveMatch = trimmed.match(/^\{([a-zA-Z0-9_]+)(?::\s*(.*?))?\}$/);
    if (directiveMatch) {
      const key = directiveMatch[1].toLowerCase();
      const val = directiveMatch[2]?.trim() || "";

      switch (key) {
        case "title":
        case "t":
          title = val;
          break;
        case "artist":
        case "a":
          artist = val;
          break;
        case "key":
        case "k":
          originalKey = val;
          break;
        case "tempo":
        case "bpm": {
          const parsedBpm = Number.parseInt(val, 10);
          if (!Number.isNaN(parsedBpm)) bpm = parsedBpm;
          break;
        }
        case "time":
          timeSignature = val;
          break;
        default:
          // Keep other directives (like {comment: ...}) in content
          contentLines.push(line);
          break;
      }
    } else {
      contentLines.push(line);
    }
  }

  const remainingBody = contentLines.join("\n");

  // Check if remaining body already has inline [Chord] bracket notation
  const hasInlineChords = /\[[A-G](?:#|b)?[^\]]*\]/.test(remainingBody);

  if (hasInlineChords) {
    // Already ChordPro formatted, extract any section timestamps
    const sectionTimestamps: SectionTimestamp[] = [];
    const sectionLines = remainingBody.split(/\r?\n/);
    for (const sl of sectionLines) {
      const parsed = parseSectionHeader(sl);
      if (parsed?.timestamp) {
        sectionTimestamps.push(parsed.timestamp);
      }
    }

    return {
      title,
      artist,
      originalKey,
      bpm,
      timeSignature,
      lyricsAndChords: remainingBody.trim(),
      sectionTimestamps,
    };
  }

  // Not inline ChordPro: run two-line converter!
  const converted = convertTwoLineToChordPro(remainingBody);

  return {
    title,
    artist,
    originalKey: originalKey || converted.detectedKey || undefined,
    bpm,
    timeSignature,
    lyricsAndChords: converted.chordProText.trim(),
    sectionTimestamps: converted.extractedTimestamps,
  };
}
