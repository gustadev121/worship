import { describe, expect, it } from "bun:test";
import {
  calculateSemitoneDelta,
  extractRootNote,
  isChordToken,
  parseChordPro,
  parseLinePairs,
  transposeChord,
  transposeChordSheet,
  transposeNote,
} from "@/core/domain/chordpro";

describe("ChordPro Domain: Parser & Transposition Engine (T024)", () => {
  describe("isChordToken", () => {
    it("recognizes standard worship chords", () => {
      expect(isChordToken("G")).toBe(true);
      expect(isChordToken("Em")).toBe(true);
      expect(isChordToken("D/F#")).toBe(true);
      expect(isChordToken("Cadd9")).toBe(true);
      expect(isChordToken("Bbmaj7")).toBe(true);
      expect(isChordToken("F#m7b5")).toBe(true);
      expect(isChordToken("Asus4")).toBe(true);
      expect(isChordToken("C2")).toBe(true);
      expect(isChordToken("G/B")).toBe(true);
    });

    it("distinguishes section markers from chords", () => {
      expect(isChordToken("Verso 1")).toBe(false);
      expect(isChordToken("Coro")).toBe(false);
      expect(isChordToken("Puente")).toBe(false);
      expect(isChordToken("Intro")).toBe(false);
      expect(isChordToken("Chorus")).toBe(false);
      expect(isChordToken("Verse 2")).toBe(false);
      expect(isChordToken("Estrofa")).toBe(false);
    });
  });

  describe("extractRootNote", () => {
    it("extracts root note from canonical key names", () => {
      expect(extractRootNote("G major")).toBe("G");
      expect(extractRootNote("C# minor")).toBe("C#");
      expect(extractRootNote("Eb")).toBe("Eb");
      expect(extractRootNote("Bb minor")).toBe("Bb");
      expect(extractRootNote("F# major")).toBe("F#");
    });
  });

  describe("transposeNote & transposeChord", () => {
    it("transposes single notes by positive and negative semitones", () => {
      expect(transposeNote("C", 2, "sharp")).toBe("D");
      expect(transposeNote("G", 2, "sharp")).toBe("A");
      expect(transposeNote("E", 1, "sharp")).toBe("F");
      expect(transposeNote("B", 1, "sharp")).toBe("C");
      expect(transposeNote("A", -2, "sharp")).toBe("G");
    });

    it("respects sharp vs flat preference", () => {
      expect(transposeNote("C", 1, "sharp")).toBe("C#");
      expect(transposeNote("C", 1, "flat")).toBe("Db");
      expect(transposeNote("F", 3, "sharp")).toBe("G#");
      expect(transposeNote("F", 3, "flat")).toBe("Ab");
    });

    it("transposes chords preserving modifiers and extensions", () => {
      expect(transposeChord("Em7", 2, "sharp")).toBe("F#m7");
      expect(transposeChord("Cadd9", 2, "sharp")).toBe("Dadd9");
      expect(transposeChord("Asus4", 2, "sharp")).toBe("Bsus4");
      expect(transposeChord("Gmaj7", -1, "sharp")).toBe("F#maj7");
    });

    it("transposes slash chords including bass note", () => {
      expect(transposeChord("D/F#", 2, "sharp")).toBe("E/G#");
      expect(transposeChord("G/B", 2, "sharp")).toBe("A/C#");
      expect(transposeChord("C/E", 2, "sharp")).toBe("D/F#");
      expect(transposeChord("Bb/D", 2, "flat")).toBe("C/E");
    });

    it("returns unchanged chord when delta is 0 or multiple of 12", () => {
      expect(transposeChord("Gmaj7", 0)).toBe("Gmaj7");
      expect(transposeChord("D/F#", 12)).toBe("D/F#");
      expect(transposeChord("Em", -12)).toBe("Em");
    });
  });

  describe("parseLinePairs", () => {
    it("pairs chords directly to corresponding lyric syllables", () => {
      const line = "[G]Sub[D]lime [Em]gracia";
      const pairs = parseLinePairs(line);

      expect(pairs).toHaveLength(3);
      expect(pairs[0]).toEqual({ chord: "G", lyrics: "Sub" });
      expect(pairs[1]).toEqual({ chord: "D", lyrics: "lime " });
      expect(pairs[2]).toEqual({ chord: "Em", lyrics: "gracia" });
    });

    it("handles lines starting with lyrics before chords", () => {
      const line = "En la [C]cruz, [G]en la cruz";
      const pairs = parseLinePairs(line);

      expect(pairs[0]).toEqual({ chord: null, lyrics: "En la " });
      expect(pairs[1]).toEqual({ chord: "C", lyrics: "cruz, " });
      expect(pairs[2]).toEqual({ chord: "G", lyrics: "en la cruz" });
    });

    it("handles instrumental chord progressions without lyrics", () => {
      const line = "[G] [D/F#] [Em] [C]";
      const pairs = parseLinePairs(line);

      expect(pairs.length).toBeGreaterThanOrEqual(4);
      expect(pairs[0].chord).toBe("G");
      expect(pairs[1].chord).toBe("D/F#");
      expect(pairs[2].chord).toBe("Em");
      expect(pairs[3].chord).toBe("C");
    });
  });

  describe("parseChordPro full sheet", () => {
    it("parses directives, section headers, and chord lines", () => {
      const chordProText = `
{title: Sublime Gracia}
{artist: John Newton}
{key: G}

[Verso 1]
[G]Sublime [D]gracia del [Em]Señor [C]
Que a un [G]infeliz [D]salvó

[Coro]
[C]Gracia que me [G]enseñó a temer
[C]Y mi temor [D]quitó
      `.trim();

      const sheet = parseChordPro(chordProText);

      expect(sheet.title).toBe("Sublime Gracia");
      expect(sheet.artist).toBe("John Newton");
      expect(sheet.originalKey).toBe("G");
      expect(sheet.currentKey).toBe("G");
      expect(sheet.semitoneDelta).toBe(0);

      expect(sheet.sections.length).toBeGreaterThanOrEqual(2);
      expect(sheet.sections[0].title).toBe("Verso 1");
      expect(sheet.sections[1].title).toBe("Coro");

      const verse1Lines = sheet.sections[0].lines.filter(
        (l) => l.pairs.length > 0 && l.pairs.some((p) => p.chord !== null),
      );
      expect(verse1Lines.length).toBe(2);
      expect(verse1Lines[0].pairs[0].chord).toBe("G");
      expect(verse1Lines[0].pairs[0].lyrics).toBe("Sublime ");
    });

    it("handles ChordPro {comment: ...} directives as sections", () => {
      const chordProText = `
{comment: Intro}
[G]  [Em]  [C]  [D]

{c: Coro}
[G]Aleluya [D]al Rey
      `.trim();

      const sheet = parseChordPro(chordProText);
      expect(sheet.sections.length).toBe(2);
      expect(sheet.sections[0].title).toBe("Intro");
      expect(sheet.sections[1].title).toBe("Coro");
    });
  });

  describe("transposeChordSheet", () => {
    it("transposes all chords across all sections by semitone delta", () => {
      const chordProText = `
[Verso 1]
[G]Sublime [D/F#]gracia [Em]del Señor

[Coro]
[C]Aleluya [G]al Rey
      `.trim();

      const sheet = parseChordPro(chordProText, {
        title: "Test Song",
        originalKey: "G",
      });

      // Transpose +2 semitones (G -> A)
      const transposed = transposeChordSheet(sheet, 2);

      expect(transposed.currentKey).toBe("A");
      expect(transposed.semitoneDelta).toBe(2);

      const versePairs = transposed.sections[0].lines[0].pairs;
      expect(versePairs[0].chord).toBe("A");
      expect(versePairs[1].chord).toBe("E/G#");
      expect(versePairs[2].chord).toBe("F#m");

      const chorusPairs = transposed.sections[1].lines[0].pairs;
      expect(chorusPairs[0].chord).toBe("D");
      expect(chorusPairs[1].chord).toBe("A");
    });

    it("preserves lyrics untouched during transposition", () => {
      const chordProText = "[G]Amazing [D]grace";
      const sheet = parseChordPro(chordProText, { originalKey: "G" });
      const transposed = transposeChordSheet(sheet, 3);

      expect(transposed.sections[0].lines[0].pairs[0].lyrics).toBe("Amazing ");
      expect(transposed.sections[0].lines[0].pairs[1].lyrics).toBe("grace");
    });
  });

  describe("calculateSemitoneDelta", () => {
    it("calculates distance between keys within octave bounds", () => {
      expect(calculateSemitoneDelta("G", "A")).toBe(2);
      expect(calculateSemitoneDelta("G", "F")).toBe(-2);
      expect(calculateSemitoneDelta("C", "G")).toBe(-5); // or +7 normalized
      expect(calculateSemitoneDelta("C major", "D major")).toBe(2);
      expect(calculateSemitoneDelta("D minor", "E minor")).toBe(2);
    });
  });
});
