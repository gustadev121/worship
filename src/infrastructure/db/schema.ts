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

// 1. Better Auth Core User Table
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  role: text("role").notNull().default("MEMBER"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// 2. Active Sessions Table (with activeOrganizationId)
export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  activeOrganizationId: text("active_organization_id"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// 3. Accounts (Credentials & OAuth)
export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: text("access_token_expires_at"),
  refreshTokenExpiresAt: text("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// 4. Verifications
export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// 5. Organizations (Churches, Campuses, Ministries)
export const organization = sqliteTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  createdAt: text("created_at").notNull(),
  metadata: text("metadata"),
});

// 6. Organization Members (User Membership & Org Roles)
export const member = sqliteTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"),
  createdAt: text("created_at").notNull(),
});

// 7. Organization Invitations
export const invitation = sqliteTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull().default("member"),
  status: text("status").notNull().default("pending"),
  expiresAt: text("expires_at").notNull(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull(),
});

export const songs = sqliteTable("songs", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .default("worshipflow-central")
    .references(() => organization.id, { onDelete: "cascade" }),
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
  organizationId: text("organization_id")
    .notNull()
    .default("worshipflow-central")
    .references(() => organization.id, { onDelete: "cascade" }),
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
  user,
  session,
  account,
  verification,
  organization,
  member,
  invitation,
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
