/**
 * Idempotent local seed: clears and re-inserts in FK order.
 * Run with: bun run seed
 * Env: JWT_SECRET (required), SEED_ADMIN_PASSWORD (optional),
 * YOUTUBE_API_KEY (optional, unused by seed).
 *
 * Writes straight into the SAME local D1 database the dev worker reads
 * (miniflare stored at .wrangler/state). No sqlite, no second database.
 */
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import { getContainer } from "@/infrastructure/container";
import type { AppEnv } from "@/infrastructure/env";

const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

const mf = new Miniflare(
  convertV4MiniflareOptions({
    resourcePersistencePath: "./.wrangler/state/v3",
    workers: [
      {
        name: "seed",
        compatibilityDate: "2026-10-26",
        modules: true,
        script: "export default { fetch() { return new Response('ok'); } }",
        d1Databases: {
          DB: { id: "00000000-0000-0000-0000-000000000000" },
        },
      },
    ],
  }),
);
const DB = await mf.getD1Database("DB");

const env: AppEnv = {
  JWT_SECRET,
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || undefined,
  DB,
};
const c = await getContainer(env);

interface SeedUser {
  username: string;
  email: string;
  password: string;
  role: "ADMIN" | "MEMBER";
}

const ADMIN_SEED: SeedUser = {
  username: "admin",
  email: "admin@worship.local",
  password: ADMIN_PASSWORD,
  role: "ADMIN",
};

const MEMBER_SEEDS: SeedUser[] = [
  {
    username: "sarah.lead",
    email: "sarah@worship.local",
    password: "Rehearse123!",
    role: "MEMBER",
  },
  {
    username: "mike.harmony",
    email: "mike@worship.local",
    password: "Rehearse123!",
    role: "MEMBER",
  },
  {
    username: "ana.harmony",
    email: "ana@worship.local",
    password: "Rehearse123!",
    role: "MEMBER",
  },
  {
    username: "joao.keys",
    email: "joao@worship.local",
    password: "Rehearse123!",
    role: "MEMBER",
  },
];

const LABELS = [
  { name: "Sunday Set", slug: "sunday-set", colorHex: "#4F46E5" },
  { name: "Communion", slug: "communion", colorHex: "#0EA5E9" },
  { name: "Youth", slug: "youth", colorHex: "#22C55E" },
  { name: "Christmas", slug: "christmas", colorHex: "#EF4444" },
] as const;

const SONGS = [
  {
    title: "Amazing Grace",
    artist: "John Newton",
    originalKey: "G major",
    practiceKey: "G major",
    bpm: 72,
    timeSignature: "3/4",
    youtubeVideoId: "dQw4w9WgXcQ",
    sectionTimestamps: [
      { label: "Verse 1", startSeconds: 0, endSeconds: 45 },
      { label: "Chorus", startSeconds: 45, endSeconds: 90 },
    ],
    lyricsAndChords: "G               C\nAmazing grace how sweet the sound",
    labels: ["sunday-set", "communion"],
  },
  {
    title: "10,000 Reasons",
    artist: "Matt Redman",
    originalKey: "C major",
    practiceKey: "D major",
    bpm: 96,
    timeSignature: "4/4",
    youtubeVideoId: "DXDGE_lRI0E",
    sectionTimestamps: [
      { label: "Verse", startSeconds: 0, endSeconds: 40 },
      { label: "Chorus", startSeconds: 40, endSeconds: 100 },
    ],
    lyricsAndChords: "C               G\nBless the Lord O my soul",
    labels: ["sunday-set", "youth"],
  },
  {
    title: "Holy Holy Holy",
    artist: "Reginald Heber",
    originalKey: "Eb major",
    practiceKey: null,
    bpm: 88,
    timeSignature: "4/4",
    youtubeVideoId: "9tT5bq8uN4c",
    sectionTimestamps: [{ label: "Verse 1", startSeconds: 0 }],
    lyricsAndChords: "Eb              Bb\nHoly holy holy Lord God almighty",
    labels: ["sunday-set", "christmas"],
  },
] as const;

interface SeedAssignment {
  song: number;
  user: string;
  roleType: "FIRST_VOICE" | "SECOND_VOICE" | "THIRD_VOICE" | "INSTRUMENT";
  instrumentName?: string;
  practiceStatus: "PENDING" | "PRACTICING" | "READY";
  harmonyOrPartNotes?: string;
}

const ASSIGNMENTS: SeedAssignment[] = [
  {
    song: 0,
    user: "sarah.lead",
    roleType: "FIRST_VOICE",
    practiceStatus: "READY",
    harmonyOrPartNotes: "Lead melody, watch verse 2 entrance",
  },
  {
    song: 0,
    user: "mike.harmony",
    roleType: "SECOND_VOICE",
    practiceStatus: "PRACTICING",
  },
  {
    song: 1,
    user: "sarah.lead",
    roleType: "FIRST_VOICE",
    practiceStatus: "PRACTICING",
  },
  {
    song: 1,
    user: "ana.harmony",
    roleType: "THIRD_VOICE",
    practiceStatus: "PENDING",
  },
  {
    song: 2,
    user: "mike.harmony",
    roleType: "SECOND_VOICE",
    practiceStatus: "READY",
  },
  {
    song: 2,
    user: "joao.keys",
    roleType: "INSTRUMENT",
    instrumentName: "Keys",
    practiceStatus: "READY",
  },
];

const bootstrapActor = {
  sub: "seed-admin",
  username: "admin",
  role: "ADMIN" as const,
};

// Clear in FK order: role assignments first, then songs/labels/users.
for (const song of await c.songs.list({})) {
  const { assignments } = await c.listSongRoles.execute({
    songId: song.id,
  });
  for (const a of assignments) {
    await c.roles.delete(a.id);
  }
  await c.deleteSong.execute({ actor: bootstrapActor, id: song.id });
}
for (const label of await c.listLabels.execute().then((r) => r.labels)) {
  await c.deleteLabel.execute({ actor: bootstrapActor, id: label.id });
}
for (const user of await c.listUsers
  .execute({ actor: bootstrapActor })
  .then((r) => r.users)) {
  await c.deleteUser.execute({ actor: bootstrapActor, id: user.id });
}

// Users.
const { user: firstAdmin } = await c.createUser.execute({
  actor: bootstrapActor,
  username: ADMIN_SEED.username,
  email: ADMIN_SEED.email,
  password: ADMIN_SEED.password,
  role: ADMIN_SEED.role,
});
const actor = {
  sub: firstAdmin.id,
  username: firstAdmin.username,
  role: "ADMIN" as const,
};
const byUsername = new Map([[firstAdmin.username, firstAdmin]]);
for (const u of MEMBER_SEEDS) {
  const { user } = await c.createUser.execute({
    actor,
    username: u.username,
    email: u.email,
    password: u.password,
    role: u.role,
  });
  byUsername.set(user.username, user);
}

// Labels.
const bySlug = new Map<string, string>();
for (const l of LABELS) {
  const { label } = await c.createLabel.execute({ actor, ...l });
  bySlug.set(label.slug, label.id);
}

// Songs + label links.
const songIds: string[] = [];
for (const s of SONGS) {
  const { song } = await c.createSong.execute({
    actor,
    title: s.title,
    artist: s.artist,
    originalKey: s.originalKey,
    practiceKey: s.practiceKey,
    bpm: s.bpm,
    timeSignature: s.timeSignature,
    youtubeVideoId: s.youtubeVideoId,
    sectionTimestamps: [...s.sectionTimestamps],
    lyricsAndChords: s.lyricsAndChords,
  });
  songIds.push(song.id);
  const labelIds = s.labels
    .map((slug) => bySlug.get(slug))
    .filter((id) => id !== undefined);
  await c.setSongLabels.execute({ actor, songId: song.id, labelIds });
}

// Assignments.
let assignmentCount = 0;
for (const a of ASSIGNMENTS) {
  const songId = songIds[a.song];
  const user = byUsername.get(a.user);
  if (songId === undefined || user === undefined) {
    throw new Error(
      `Seed reference missing for assignment ${a.user} on song index ${a.song}`,
    );
  }
  await c.assignRole.execute({
    actor,
    songId,
    userId: user.id,
    roleType: a.roleType,
    instrumentName: a.instrumentName ?? null,
    practiceStatus: a.practiceStatus,
    harmonyOrPartNotes: a.harmonyOrPartNotes ?? null,
  });
  assignmentCount++;
}

await mf.dispose();

console.log(
  `users=${byUsername.size} labels=${bySlug.size} songs=${songIds.length} assignments=${assignmentCount}`,
);
