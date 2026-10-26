import { beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ConflictError } from "@/core/domain/errors";
import { createLabel } from "@/core/domain/label";
import { createRoleAssignment } from "@/core/domain/role-assignment";
import { createSong } from "@/core/domain/song";
import { createUser } from "@/core/domain/user";
import { type Db, getDb } from "@/infrastructure/db/client";
import { DrizzleLabelRepository } from "@/infrastructure/repositories/DrizzleLabelRepository";
import { DrizzleRoleAssignmentRepository } from "@/infrastructure/repositories/DrizzleRoleAssignmentRepository";
import { DrizzleSongRepository } from "@/infrastructure/repositories/DrizzleSongRepository";
import { DrizzleUserRepository } from "@/infrastructure/repositories/DrizzleUserRepository";

const now = "2026-01-01T00:00:00.000Z";

interface Fixture {
  db: Db;
  save: () => void;
  users: DrizzleUserRepository;
  songs: DrizzleSongRepository;
  roles: DrizzleRoleAssignmentRepository;
  labels: DrizzleLabelRepository;
}

async function setup(): Promise<Fixture> {
  const dir = mkdtempSync(join(tmpdir(), "wf-repos-"));
  const { db, save } = await getDb({ SQLITE_FILE: join(dir, "test.db") });
  return {
    db,
    save,
    users: new DrizzleUserRepository(db),
    songs: new DrizzleSongRepository(db),
    roles: new DrizzleRoleAssignmentRepository(db),
    labels: new DrizzleLabelRepository(db),
  };
}

let fx: Fixture;
beforeEach(async () => {
  fx = await setup();
});

function seedUser(
  id: string,
  username: string,
  email: string,
  role: "ADMIN" | "MEMBER" = "MEMBER",
) {
  return createUser({
    id,
    username,
    email,
    passwordHash: "hash",
    role,
    createdAt: now,
    updatedAt: now,
  });
}

function seedSong(
  id: string,
  title = "Amazing Grace",
  practiceKey: unknown = null,
) {
  return createSong({
    id,
    title,
    artist: "Newton",
    originalKey: "G major",
    practiceKey,
    bpm: 72,
    timeSignature: "3/4",
    lyricsAndChords: "Amazing grace",
    youtubeVideoId: "dQw4w9WgXcQ",
    sectionTimestamps: [{ label: "Verse", startSeconds: 0 }],
    createdAt: now,
    updatedAt: now,
  });
}

describe("repositories", () => {
  test("user CRUD", async () => {
    const user = seedUser("u1", "sarah.lead", "sarah@example.com");
    await fx.users.create(user);
    expect(await fx.users.findById("u1")).toMatchObject({
      username: "sarah.lead",
    });
    expect(await fx.users.findByUsernameOrEmail("sarah.lead")).toMatchObject({
      id: "u1",
    });
    expect(
      await fx.users.findByUsernameOrEmail("SARAH@EXAMPLE.COM"),
    ).toMatchObject({ id: "u1" });
    const list = await fx.users.list();
    expect(list.length).toBe(1);
    await fx.users.delete("u1");
    expect(await fx.users.findById("u1")).toBeNull();
    fx.save();
  });

  test("label slug uniqueness rejects with ConflictError", async () => {
    const a = createLabel({
      id: "l1",
      name: "Sunday Set",
      colorHex: "#4F46E5",
    });
    const b = createLabel({
      id: "l2",
      name: "Sunday  Set",
      colorHex: "#0EA5E9",
    });
    await fx.labels.create(a);
    await expect(fx.labels.create(b)).rejects.toBeInstanceOf(ConflictError);
    expect(await fx.labels.findBySlug("sunday-set")).toMatchObject({
      id: "l1",
    });
  });

  test("song CRUD + filters", async () => {
    const s1 = seedSong("s1", "Amazing Grace", "A major");
    const s2 = seedSong("s2", "Holy Holy", null);
    await fx.songs.create(s1);
    await fx.songs.create(s2);
    expect(await fx.songs.findById("s1")).toMatchObject({
      title: "Amazing Grace",
    });
    const label = createLabel({
      id: "l1",
      name: "Sunday",
      colorHex: "#4F46E5",
    });
    await fx.labels.create(label);
    await fx.labels.setSongLabels("s1", ["l1"]);
    expect(await fx.labels.getSongLabelIds("s1")).toEqual(["l1"]);
    expect(
      (await fx.songs.list({ query: "amazing" })).map((s) => s.id),
    ).toEqual(["s1"]);
    expect(
      (await fx.songs.list({ labelIds: ["l1"] })).map((s) => s.id),
    ).toEqual(["s1"]);
    expect(
      (await fx.songs.list({ practiceKey: "A major" })).map((s) => s.id),
    ).toEqual(["s1"]);
    const user = seedUser("u1", "sarah.lead", "sarah@example.com");
    await fx.users.create(user);
    const assignment = createRoleAssignment({
      id: "r1",
      songId: "s1",
      userId: "u1",
      roleType: "FIRST_VOICE",
      createdAt: now,
      updatedAt: now,
    });
    await fx.roles.create(assignment);
    expect((await fx.songs.list({ memberId: "u1" })).map((s) => s.id)).toEqual([
      "s1",
    ]);
    expect(
      (await fx.songs.list({ roleType: "FIRST_VOICE" })).map((s) => s.id),
    ).toEqual(["s1"]);
    expect(await fx.songs.list({ roleType: "SECOND_VOICE" })).toEqual([]);
  });

  test("role-tuple uniqueness rejects", async () => {
    await fx.users.create(seedUser("u1", "sarah.lead", "sarah@example.com"));
    await fx.songs.create(seedSong("s1"));
    const a = createRoleAssignment({
      id: "r1",
      songId: "s1",
      userId: "u1",
      roleType: "SECOND_VOICE",
      createdAt: now,
      updatedAt: now,
    });
    await fx.roles.create(a);
    const dup = createRoleAssignment({
      id: "r2",
      songId: "s1",
      userId: "u1",
      roleType: "SECOND_VOICE",
      createdAt: now,
      updatedAt: now,
    });
    await expect(fx.roles.create(dup)).rejects.toBeInstanceOf(ConflictError);
    // INSTRUMENT with same role but different names allowed; same name rejected
    const keys = createRoleAssignment({
      id: "r3",
      songId: "s1",
      userId: "u1",
      roleType: "INSTRUMENT",
      instrumentName: "Keys",
      createdAt: now,
      updatedAt: now,
    });
    await fx.roles.create(keys);
    const keysDup = createRoleAssignment({
      id: "r4",
      songId: "s1",
      userId: "u1",
      roleType: "INSTRUMENT",
      instrumentName: "Keys",
      createdAt: now,
      updatedAt: now,
    });
    await expect(fx.roles.create(keysDup)).rejects.toBeInstanceOf(
      ConflictError,
    );
    // '' maps to null at the domain boundary
    expect((await fx.roles.findById("r1"))?.instrumentName).toBeNull();
  });

  test("cascade deletes remove assignments and song_labels", async () => {
    await fx.users.create(seedUser("u1", "sarah.lead", "sarah@example.com"));
    await fx.songs.create(seedSong("s1"));
    await fx.labels.create(
      createLabel({ id: "l1", name: "Sunday", colorHex: "#4F46E5" }),
    );
    await fx.labels.setSongLabels("s1", ["l1"]);
    await fx.roles.create(
      createRoleAssignment({
        id: "r1",
        songId: "s1",
        userId: "u1",
        roleType: "FIRST_VOICE",
        createdAt: now,
        updatedAt: now,
      }),
    );
    expect(await fx.roles.listBySong("s1")).toHaveLength(1);
    await fx.songs.delete("s1");
    expect(await fx.roles.listBySong("s1")).toEqual([]);
    expect(await fx.labels.getSongLabelIds("s1")).toEqual([]);
    fx.save();
  });

  test("user cascade deletes assignments", async () => {
    await fx.users.create(seedUser("u1", "sarah.lead", "sarah@example.com"));
    await fx.songs.create(seedSong("s1"));
    await fx.roles.create(
      createRoleAssignment({
        id: "r1",
        songId: "s1",
        userId: "u1",
        roleType: "FIRST_VOICE",
        createdAt: now,
        updatedAt: now,
      }),
    );
    await fx.users.delete("u1");
    expect(await fx.roles.listByUser("u1")).toEqual([]);
  });
});
