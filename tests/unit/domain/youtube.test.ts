import { describe, expect, test } from "bun:test";
import { ValidationError } from "@/core/domain/errors";
import { normalizeYoutubeVideoId } from "@/core/domain/youtube";

describe("normalizeYoutubeVideoId", () => {
  test("passes raw 11-char ids through", () => {
    expect(normalizeYoutubeVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  test("extracts from all supported URL forms", () => {
    const id = "dQw4w9WgXcQ";
    const urls = [
      `https://www.youtube.com/watch?v=${id}`,
      `https://youtube.com/watch?v=${id}&t=10s`,
      `https://youtu.be/${id}`,
      `https://www.youtube.com/embed/${id}`,
      `https://www.youtube.com/shorts/${id}`,
      `https://www.youtube.com/live/${id}`,
      `https://www.youtube.com/v/${id}`,
    ];
    for (const url of urls) {
      expect(normalizeYoutubeVideoId(url)).toBe(id);
    }
  });

  test("rejects junk", () => {
    for (const bad of [
      "short",
      "toolong-id-here!",
      "https://example.com/x",
      "",
      42,
      null,
    ]) {
      expect(() => normalizeYoutubeVideoId(bad)).toThrow(ValidationError);
    }
  });
});
