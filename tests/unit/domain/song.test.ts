import { describe, expect, test } from "bun:test";
import { ValidationError } from "@/core/domain/errors";
import {
  createBpm,
  createSectionTimestamp,
  createSectionTimestamps,
  createSong,
  updateSong,
} from "@/core/domain/song";

const base = {
  id: "s1",
  title: "Amazing Grace",
  artist: "John Newton",
  originalKey: "G major",
};

describe("song factories", () => {
  test("bpm integer 30-300 or undefined", () => {
    expect(createBpm(undefined)).toBeUndefined();
    expect(createBpm(72)).toBe(72);
    for (const bad of [29, 301, 72.5, "72", null, Number.NaN]) {
      expect(() => createBpm(bad)).toThrow(ValidationError);
    }
  });

  test("section timestamps need start >= 0 and end > start", () => {
    expect(createSectionTimestamp({ label: "Verse", startSeconds: 0 })).toEqual(
      {
        label: "Verse",
        startSeconds: 0,
      },
    );
    expect(
      createSectionTimestamp({
        label: "Chorus",
        startSeconds: 10,
        endSeconds: 40,
      }).endSeconds,
    ).toBe(40);
    for (const bad of [
      { label: "X", startSeconds: -1 },
      { label: "X", startSeconds: 10, endSeconds: 10 },
      { label: "X", startSeconds: 10, endSeconds: 5 },
      { label: "", startSeconds: 1 },
    ]) {
      expect(() => createSectionTimestamp(bad)).toThrow(ValidationError);
    }
    expect(() => createSectionTimestamps("nope")).toThrow(ValidationError);
  });

  test("createSong normalizes youtube URL and refreshes updatedAt on update", () => {
    const song = createSong({
      ...base,
      youtubeVideoId: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      bpm: 72,
    });
    expect(song.youtubeVideoId).toBe("dQw4w9WgXcQ");
    expect(song.practiceKey).toBeNull();
    const updated = updateSong(song, { bpm: 500 - 428 });
    expect(updated.bpm).toBe(72);
    expect(updated.updatedAt >= song.updatedAt).toBe(true);
    expect(() => createSong({ ...base, bpm: 500 })).toThrow(ValidationError);
    expect(() => updateSong(song, { originalKey: "H major" })).toThrow(
      ValidationError,
    );
  });
});
