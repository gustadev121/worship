import { describe, expect, it } from "bun:test";
import {
  convertTwoLineToChordPro,
  extractChordProMetadata,
  isChordLine,
  isValidChordToken,
  parseTimestampSeconds,
} from "@/core/domain/chord-converter";

describe("Chord Converter Domain Unit Tests", () => {
  describe("isValidChordToken (T002)", () => {
    it("recognizes standard Western major and minor chords", () => {
      expect(isValidChordToken("G")).toBe(true);
      expect(isValidChordToken("C")).toBe(true);
      expect(isValidChordToken("D")).toBe(true);
      expect(isValidChordToken("Em")).toBe(true);
      expect(isValidChordToken("Am")).toBe(true);
      expect(isValidChordToken("F#m")).toBe(true);
      expect(isValidChordToken("Bb")).toBe(true);
    });

    it("recognizes complex extensions, altered chords, and slash chords", () => {
      expect(isValidChordToken("D/F#")).toBe(true);
      expect(isValidChordToken("Cadd9")).toBe(true);
      expect(isValidChordToken("Asus4")).toBe(true);
      expect(isValidChordToken("Bm7b5")).toBe(true);
      expect(isValidChordToken("Fmaj7")).toBe(true);
      expect(isValidChordToken("G#dim")).toBe(true);
      expect(isValidChordToken("E7#9")).toBe(true);
    });

    it("recognizes Latin solfège chords", () => {
      expect(isValidChordToken("Do")).toBe(true);
      expect(isValidChordToken("Sol")).toBe(true);
      expect(isValidChordToken("Lam")).toBe(true);
      expect(isValidChordToken("Fa#m")).toBe(true);
      expect(isValidChordToken("Sol/Si")).toBe(true);
      expect(isValidChordToken("Re7")).toBe(true);
    });

    it("strictly rejects common Spanish prose words that resemble notes/chords", () => {
      expect(isValidChordToken("de")).toBe(false);
      expect(isValidChordToken("el")).toBe(false);
      expect(isValidChordToken("la")).toBe(false);
      expect(isValidChordToken("en")).toBe(false);
      expect(isValidChordToken("un")).toBe(false);
      expect(isValidChordToken("es")).toBe(false);
      expect(isValidChordToken("dios")).toBe(false);
      expect(isValidChordToken("amor")).toBe(false);
      expect(isValidChordToken("paz")).toBe(false);
      expect(isValidChordToken("rey")).toBe(false);
    });

    it("rejects non-musical words and random strings", () => {
      expect(isValidChordToken("palabra")).toBe(false);
      expect(isValidChordToken("guitarra")).toBe(false);
      expect(isValidChordToken("12345")).toBe(false);
    });
  });

  describe("isChordLine (T002)", () => {
    it("identifies lines containing only musical chords", () => {
      expect(isChordLine("G    D/F#    Em7    Cadd9")).toBe(true);
      expect(isChordLine("A   E/G#   F#m   D")).toBe(true);
      expect(isChordLine("Do   Sol   Lam   Fa")).toBe(true);
    });

    it("identifies chord progressions with bar dividers and slashes", () => {
      expect(isChordLine("| G | D | Em | C |")).toBe(true);
      expect(isChordLine("G / / / | C / / /")).toBe(true);
    });

    it("rejects plain lyrics lines", () => {
      expect(isChordLine("En tu presencia hay plenitud de gozo")).toBe(false);
      expect(isChordLine("Santo es el Señor digno de alabanza")).toBe(false);
    });

    it("rejects empty or whitespace lines", () => {
      expect(isChordLine("")).toBe(false);
      expect(isChordLine("   \t  ")).toBe(false);
    });

    it("rejects section titles like Coro: or [Verso 1]", () => {
      expect(isChordLine("[Verso 1]")).toBe(false);
      expect(isChordLine("Coro:")).toBe(false);
      expect(isChordLine("Intro:")).toBe(false);
    });
  });

  describe("convertTwoLineToChordPro (T005 & US1)", () => {
    it("interlaces chords into lyric lines at the correct column positions", () => {
      const input = `[Verso 1]
G                D/F#
En tu presencia hay plenitud
Em7              C
En tu mirada paz y quietud`;

      const result = convertTwoLineToChordPro(input);

      expect(result.chordProText).toContain("[Verso 1]");
      expect(result.chordProText).toContain(
        "[G]En tu presencia [D/F#]hay plenitud",
      );
      expect(result.chordProText).toContain(
        "[Em7]En tu mirada paz [C]y quietud",
      );
      expect(result.chordsCount).toBeGreaterThanOrEqual(4);
    });

    it("formats consecutive chord lines as standalone bracketed chords (intro/instrumental)", () => {
      const input = `[Intro]
G   D/F#   Em7   C`;

      const result = convertTwoLineToChordPro(input);
      expect(result.chordProText).toContain("[Intro]");
      expect(result.chordProText).toContain("[G] [D/F#] [Em7] [C]");
    });

    it("normalizes diverse section header conventions into standard [Section]", () => {
      const input = `Verso 1:
G   C
Canto hoy

Coro:
D   G
Aleluya

Puente:
Em  C
Santo`;

      const result = convertTwoLineToChordPro(input);
      expect(result.chordProText).toContain("[Verso 1]");
      expect(result.chordProText).toContain("[Coro]");
      expect(result.chordProText).toContain("[Puente]");
    });

    it("detects and extracts section timestamps into SectionTimestamp list (US3)", () => {
      const input = `[Verso 1 - 0:45]
G        C
Mi Dios es bueno

[Coro - 1:30]
D        G
Santo por siempre`;

      const result = convertTwoLineToChordPro(input);
      expect(result.extractedTimestamps.length).toBe(2);
      expect(result.extractedTimestamps[0]).toEqual({
        label: "Verso 1",
        startSeconds: 45,
      });
      expect(result.extractedTimestamps[1]).toEqual({
        label: "Coro",
        startSeconds: 90,
      });
      // Section header in text should have the timestamp stripped
      expect(result.chordProText).toContain("[Verso 1]");
      expect(result.chordProText).toContain("[Coro]");
    });
  });

  describe("extractChordProMetadata (T009 & US2)", () => {
    it("extracts standard ChordPro directives from file content", () => {
      const fileContent = `{title: Tu Fidelidad}
{artist: Marcos Witt}
{key: D major}
{tempo: 68}
{time: 4/4}

[Verso 1]
[D]Tu fidelidad es [G]grande
[A]Tu fidelidad in[D]comparable es`;

      const meta = extractChordProMetadata(fileContent);

      expect(meta.title).toBe("Tu Fidelidad");
      expect(meta.artist).toBe("Marcos Witt");
      expect(meta.originalKey).toBe("D major");
      expect(meta.bpm).toBe(68);
      expect(meta.timeSignature).toBe("4/4");
      expect(meta.lyricsAndChords).toContain("[D]Tu fidelidad es [G]grande");
    });

    it("automatically converts plain two-line text file when no directives are present", () => {
      const fileContent = `G             D
Grande es Tu amor
C             D
Por la eternidad`;

      const meta = extractChordProMetadata(fileContent);

      expect(meta.lyricsAndChords).toContain("[G]Grande es Tu [D]amor");
      expect(meta.lyricsAndChords).toContain("[C]Por la eternid[D]ad");
    });
  });

  describe("parseTimestampSeconds (T012 & US3)", () => {
    it("parses mm:ss and m:ss strings to total seconds", () => {
      expect(parseTimestampSeconds("0:45")).toBe(45);
      expect(parseTimestampSeconds("1:30")).toBe(90);
      expect(parseTimestampSeconds("02:15")).toBe(135);
      expect(parseTimestampSeconds("10:00")).toBe(600);
      expect(parseTimestampSeconds("no timestamp here")).toBeNull();
    });
  });
});
