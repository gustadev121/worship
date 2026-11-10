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

export const roadmapPhases = sqliteTable("roadmap_phases", {
  id: text("id").primaryKey(),
  phaseNumber: integer("phase_number").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull(),
  targetHorizon: text("target_horizon").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const roadmapMilestones = sqliteTable("roadmap_milestones", {
  id: text("id").primaryKey(),
  phaseId: text("phase_id")
    .notNull()
    .references(() => roadmapPhases.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  targetCompletionDate: text("target_completion_date"),
  releaseNotes: text("release_notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const roadmapCapabilities = sqliteTable("roadmap_capabilities", {
  id: text("id").primaryKey(),
  milestoneId: text("milestone_id")
    .notNull()
    .references(() => roadmapMilestones.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  targetPersona: text("target_persona").notNull(),
  functionalTrack: text("functional_track").notNull(),
  priorityTier: text("priority_tier").notNull(),
  acceptanceCriteria: text("acceptance_criteria").notNull(),
  isCompleted: integer("is_completed", { mode: "boolean" })
    .notNull()
    .default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const roadmapDependencies = sqliteTable(
  "roadmap_dependencies",
  {
    id: text("id").primaryKey(),
    dependentMilestoneId: text("dependent_milestone_id")
      .notNull()
      .references(() => roadmapMilestones.id, { onDelete: "cascade" }),
    prerequisiteMilestoneId: text("prerequisite_milestone_id")
      .notNull()
      .references(() => roadmapMilestones.id, { onDelete: "cascade" }),
    isBlocking: integer("is_blocking", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: text("created_at").notNull(),
  },
  (t) => [unique().on(t.dependentMilestoneId, t.prerequisiteMilestoneId)],
);

export const roadmapCapabilityFeedback = sqliteTable(
  "roadmap_capability_feedback",
  {
    id: text("id").primaryKey(),
    capabilityId: text("capability_id")
      .notNull()
      .references(() => roadmapCapabilities.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    hasInterest: integer("has_interest", { mode: "boolean" })
      .notNull()
      .default(true),
    note: text("note"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [unique().on(t.capabilityId, t.userId)],
);

export const schema = {
  users,
  songs,
  roleAssignments,
  labels,
  songLabels,
  roadmapPhases,
  roadmapMilestones,
  roadmapCapabilities,
  roadmapDependencies,
  roadmapCapabilityFeedback,
};
