import { describe, expect, test } from "bun:test";
import { ValidationError } from "@/core/domain/errors";
import { createMusicalKey, MUSICAL_KEYS } from "@/core/domain/keys";

describe("musical keys", () => {
  test("24 canonical keys", () => {
    expect(MUSICAL_KEYS).toHaveLength(24);
    expect(MUSICAL_KEYS).toContain("G major");
    expect(MUSICAL_KEYS).toContain("Bb minor");
  });

  test("accepts canonical, rejects sharps and junk", () => {
    expect(createMusicalKey("Db major")).toBe("Db major");
    for (const bad of [
      "C# major",
      "H major",
      "C",
      "major",
      "",
      "G maj",
      4,
      null,
    ]) {
      expect(() => createMusicalKey(bad)).toThrow(ValidationError);
    }
  });
});
