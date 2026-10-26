import { and, eq, type SQL, sql } from "drizzle-orm";
import type { ISongRepository, SongFilter } from "@/core/application/ports";
import type { Song } from "@/core/domain/song";
import type { Db } from "../db/client";
import { roleAssignments, songLabels, songs } from "../db/schema";

interface SongRow {
  id: string;
  title: string;
  artist: string;
  originalKey: string;
  practiceKey: string | null;
  bpm: number | null;
  timeSignature: string | null;
  lyricsAndChords: string;
  youtubeVideoId: string | null;
  sectionTimestamps: string;
  createdAt: string;
  updatedAt: string;
}

function parseSections(raw: string): Song["sectionTimestamps"] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as Song["sectionTimestamps"];
  } catch {
    return [];
  }
}

function toDomain(row: SongRow): Song {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    originalKey: row.originalKey as Song["originalKey"],
    practiceKey: (row.practiceKey ?? null) as Song["practiceKey"],
    bpm: row.bpm ?? undefined,
    timeSignature: row.timeSignature ?? null,
    lyricsAndChords: row.lyricsAndChords,
    youtubeVideoId: row.youtubeVideoId ?? null,
    sectionTimestamps: parseSections(row.sectionTimestamps),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleSongRepository implements ISongRepository {
  constructor(private readonly db: Db) {}

  async findById(id: string): Promise<Song | null> {
    const rows = await this.db.select().from(songs).where(eq(songs.id, id));
    const row = rows[0];
    return row ? toDomain(row) : null;
  }

  async list(filter: SongFilter): Promise<Song[]> {
    const conditions: SQL[] = [];
    if (filter.query) {
      const pattern = `%${filter.query}%`;
      conditions.push(
        sql`(${songs.title} LIKE ${pattern} OR ${songs.artist} LIKE ${pattern})`,
      );
    }
    if (filter.practiceKey) {
      conditions.push(eq(songs.practiceKey, filter.practiceKey));
    }
    if (filter.labelIds && filter.labelIds.length > 0) {
      const ids = filter.labelIds.map((id) => sql`${id}`);
      conditions.push(
        sql`exists (select 1 from ${songLabels} where ${songLabels.songId} = ${songs.id} and ${songLabels.labelId} in (${sql.join(ids, sql`, `)}))`,
      );
    }
    if (filter.memberId || filter.roleType) {
      const roleConditions: SQL[] = [
        sql`${roleAssignments.songId} = ${songs.id}`,
      ];
      if (filter.memberId) {
        roleConditions.push(
          sql`${roleAssignments.userId} = ${filter.memberId}`,
        );
      }
      if (filter.roleType) {
        roleConditions.push(
          sql`${roleAssignments.roleType} = ${filter.roleType}`,
        );
      }
      conditions.push(
        sql`exists (select 1 from ${roleAssignments} where ${sql.join(roleConditions, sql` and `)})`,
      );
    }
    const rows =
      conditions.length > 0
        ? await this.db
            .select()
            .from(songs)
            .where(and(...conditions))
        : await this.db.select().from(songs);
    return rows.map(toDomain);
  }

  async create(song: Song): Promise<Song> {
    await this.db.insert(songs).values({
      id: song.id,
      title: song.title,
      artist: song.artist,
      originalKey: song.originalKey,
      practiceKey: song.practiceKey,
      bpm: song.bpm ?? null,
      timeSignature: song.timeSignature,
      lyricsAndChords: song.lyricsAndChords,
      youtubeVideoId: song.youtubeVideoId,
      sectionTimestamps: JSON.stringify(song.sectionTimestamps),
      createdAt: song.createdAt,
      updatedAt: song.updatedAt,
    });
    return song;
  }

  async update(song: Song): Promise<Song> {
    await this.db
      .update(songs)
      .set({
        title: song.title,
        artist: song.artist,
        originalKey: song.originalKey,
        practiceKey: song.practiceKey,
        bpm: song.bpm ?? null,
        timeSignature: song.timeSignature,
        lyricsAndChords: song.lyricsAndChords,
        youtubeVideoId: song.youtubeVideoId,
        sectionTimestamps: JSON.stringify(song.sectionTimestamps),
        updatedAt: song.updatedAt,
      })
      .where(eq(songs.id, song.id));
    return song;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(songs).where(eq(songs.id, id));
  }
}
