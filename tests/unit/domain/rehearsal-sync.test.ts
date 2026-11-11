import { describe, expect, it } from "bun:test";
import {
  findActiveSection,
  formatTimestamp,
  type RehearsalSection,
} from "@/core/domain/rehearsal-sync";

describe("Rehearsal Domain: findActiveSection", () => {
  const sections: RehearsalSection[] = [
    { label: "Intro", startSeconds: 0 },
    { label: "Verse 1", startSeconds: 15 },
    { label: "Chorus", startSeconds: 45 },
    { label: "Bridge", startSeconds: 90, endSeconds: 120 },
    { label: "Outro", startSeconds: 130 },
  ];

  it("returns null when section list is empty", () => {
    expect(findActiveSection([], 10)).toBeNull();
  });

  it("returns null when playback time is before the first section", () => {
    const delayedSections: RehearsalSection[] = [
      { label: "Verse 1", startSeconds: 20 },
      { label: "Chorus", startSeconds: 60 },
    ];
    expect(findActiveSection(delayedSections, 10)).toBeNull();
    expect(findActiveSection(delayedSections, -5)).toBeNull();
  });

  it("matches exact section start timestamps", () => {
    expect(findActiveSection(sections, 0)?.label).toBe("Intro");
    expect(findActiveSection(sections, 15)?.label).toBe("Verse 1");
    expect(findActiveSection(sections, 45)?.label).toBe("Chorus");
    expect(findActiveSection(sections, 90)?.label).toBe("Bridge");
    expect(findActiveSection(sections, 130)?.label).toBe("Outro");
  });

  it("matches intermediate times within section windows", () => {
    expect(findActiveSection(sections, 7.5)?.label).toBe("Intro");
    expect(findActiveSection(sections, 25)?.label).toBe("Verse 1");
    expect(findActiveSection(sections, 60)?.label).toBe("Chorus");
    expect(findActiveSection(sections, 105)?.label).toBe("Bridge");
  });

  it("correctly resolves sections defined out-of-order", () => {
    const unorderedSections: RehearsalSection[] = [
      { label: "Outro", startSeconds: 130 },
      { label: "Intro", startSeconds: 0 },
      { label: "Chorus", startSeconds: 45 },
      { label: "Verse 1", startSeconds: 15 },
    ];
    expect(findActiveSection(unorderedSections, 20)?.label).toBe("Verse 1");
    expect(findActiveSection(unorderedSections, 50)?.label).toBe("Chorus");
    expect(findActiveSection(unorderedSections, 140)?.label).toBe("Outro");
  });

  it("returns the final section when playback passes the final timestamp", () => {
    expect(findActiveSection(sections, 200)?.label).toBe("Outro");
    expect(findActiveSection(sections, 999)?.label).toBe("Outro");
  });

  it("respects explicit endSeconds when gap exists before next section", () => {
    const sectionsWithGap: RehearsalSection[] = [
      { label: "Verse 1", startSeconds: 10, endSeconds: 30 },
      { label: "Chorus", startSeconds: 40 },
    ];
    expect(findActiveSection(sectionsWithGap, 20)?.label).toBe("Verse 1");
    // At 35s, Verse 1 ended and Chorus not yet started
    expect(findActiveSection(sectionsWithGap, 45)?.label).toBe("Chorus");
  });
});

describe("Rehearsal Domain: formatTimestamp", () => {
  it("formats seconds into MM:SS correctly", () => {
    expect(formatTimestamp(0)).toBe("0:00");
    expect(formatTimestamp(9)).toBe("0:09");
    expect(formatTimestamp(45)).toBe("0:45");
    expect(formatTimestamp(60)).toBe("1:00");
    expect(formatTimestamp(75)).toBe("1:15");
    expect(formatTimestamp(125)).toBe("2:05");
    expect(formatTimestamp(3605)).toBe("60:05");
  });

  it("handles negative and float seconds gracefully", () => {
    expect(formatTimestamp(-10)).toBe("0:00");
    expect(formatTimestamp(45.75)).toBe("0:45");
  });
});
