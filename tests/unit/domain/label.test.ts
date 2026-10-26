import { describe, expect, test } from "bun:test";
import { ValidationError } from "@/core/domain/errors";
import { createColorHex, createLabel, createSlug } from "@/core/domain/label";

describe("labels", () => {
  test("slug kebab-normalizes", () => {
    expect(createSlug("Sunday Set")).toBe("sunday-set");
    expect(createSlug("  Youth__Night  ")).toBe("youth-night");
    expect(createSlug("Communion!")).toBe("communion");
    expect(() => createSlug("!!!")).toThrow(ValidationError);
  });

  test("color hex strict", () => {
    expect(createColorHex("#4F46E5")).toBe("#4F46E5");
    for (const bad of ["red", "#fff", "#GGGGGG", "4F46E5", ""]) {
      expect(() => createColorHex(bad)).toThrow(ValidationError);
    }
  });

  test("createLabel derives slug from name", () => {
    const label = createLabel({
      id: "l1",
      name: "Sunday Set",
      colorHex: "#4F46E5",
    });
    expect(label.slug).toBe("sunday-set");
    expect(() => createLabel({ id: "l2", name: "X", colorHex: "red" })).toThrow(
      ValidationError,
    );
  });
});
