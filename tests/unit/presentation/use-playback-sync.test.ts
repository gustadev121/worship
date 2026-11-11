import { describe, expect, it } from "bun:test";
import {
  findActiveSection,
  type RehearsalSection,
} from "@/core/domain/rehearsal-sync";

describe("Playback Sync Logic & State Management", () => {
  const sections: RehearsalSection[] = [
    { label: "Intro", startSeconds: 0 },
    { label: "Verse 1", startSeconds: 15 },
    { label: "Chorus", startSeconds: 45 },
    { label: "Bridge", startSeconds: 90 },
  ];

  it("identifies active section transitions across continuous timeline", () => {
    let currentTime = 0;
    let active = findActiveSection(sections, currentTime);
    expect(active?.label).toBe("Intro");

    currentTime = 14.9;
    active = findActiveSection(sections, currentTime);
    expect(active?.label).toBe("Intro");

    currentTime = 15.0;
    active = findActiveSection(sections, currentTime);
    expect(active?.label).toBe("Verse 1");

    currentTime = 44.99;
    active = findActiveSection(sections, currentTime);
    expect(active?.label).toBe("Verse 1");

    currentTime = 45.0;
    active = findActiveSection(sections, currentTime);
    expect(active?.label).toBe("Chorus");

    currentTime = 90.0;
    active = findActiveSection(sections, currentTime);
    expect(active?.label).toBe("Bridge");
  });

  it("handles A-B loop reset seamlessly without desynchronization", () => {
    const loop = { a: 45, b: 75 }; // Looping Chorus
    let currentTime = 45;
    expect(findActiveSection(sections, currentTime)?.label).toBe("Chorus");

    currentTime = 74.9;
    expect(findActiveSection(sections, currentTime)?.label).toBe("Chorus");

    // Loop trigger resets time back to point A
    currentTime = loop.a;
    expect(findActiveSection(sections, currentTime)?.label).toBe("Chorus");
  });

  it("handles seek-to-section by finding the matching start time", () => {
    const targetSection = sections.find((s) => s.label === "Bridge");
    expect(targetSection).toBeDefined();
    if (targetSection) {
      const active = findActiveSection(sections, targetSection.startSeconds);
      expect(active?.label).toBe("Bridge");
    }
  });
});
