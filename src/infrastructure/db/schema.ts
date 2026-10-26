import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const songs = sqliteTable("songs", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  originalKey: text("original_key").notNull(),
  practiceKey: text("practice_key"),
  bpm: integer("bpm"),
  timeSignature: text("time_signature"),
  lyricsAndChords: text("lyrics_and_chords").notNull().default(""),
  youtubeVideoId: text("youtube_video_id"),
  sectionTimestamps: text("section_timestamps").notNull().default("[]"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const roleAssignments = sqliteTable(
  "role_assignments",
  {
    id: text("id").primaryKey(),
    songId: text("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleType: text("role_type").notNull(),
    instrumentName: text("instrument_name").notNull().default(""),
    harmonyOrPartNotes: text("harmony_or_part_notes"),
    referenceTimestamps: text("reference_timestamps"),
    practiceStatus: text("practice_status").notNull().default("PENDING"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [unique().on(t.songId, t.userId, t.roleType, t.instrumentName)],
);

export const labels = sqliteTable("labels", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  colorHex: text("color_hex").notNull(),
});

export const songLabels = sqliteTable(
  "song_labels",
  {
    songId: text("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    labelId: text("label_id")
      .notNull()
      .references(() => labels.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.songId, t.labelId] })],
);

export const schema = { users, songs, roleAssignments, labels, songLabels };
