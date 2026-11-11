import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import {
  CreateSong,
  ListSongs,
  UpdateSong,
} from "@/core/application/use-cases/songs";
import { ForbiddenError } from "@/core/domain/errors";
import { getAuth } from "@/infrastructure/auth/better-auth";
import { type Db, getDb } from "@/infrastructure/db/client";
import { organization } from "@/infrastructure/db/schema";
import { DrizzleSongRepository } from "@/infrastructure/repositories/DrizzleSongRepository";

interface Fixture {
  db: Db;
  mf: Miniflare;
  songs: DrizzleSongRepository;
  auth: ReturnType<typeof getAuth>;
}

async function setup(): Promise<Fixture> {
  const mf = new Miniflare(
    convertV4MiniflareOptions({
      workers: [
        {
          name: "test",
          compatibilityDate: "2026-10-26",
          modules: true,
          script: "export default { fetch() { return new Response('ok'); } }",
          d1Databases: ["DB"],
        },
      ],
    }),
  );
  const db = await getDb(await mf.getD1Database("DB"));
  const songs = new DrizzleSongRepository(db);
  const auth = getAuth(db);
  return { db, mf, songs, auth };
}

let fx: Fixture;

beforeEach(async () => {
  fx = await setup();
});

afterEach(async () => {
  await fx.mf.dispose();
});

describe("Multi-Tenant Organization Song Isolation", () => {
  test("Songs are strictly isolated between organizations", async () => {
    // 1. Create two test organizations
    await fx.db.insert(organization).values([
      {
        id: "org-alpha",
        name: "Iglesia Alpha",
        slug: "iglesia-alpha",
        createdAt: new Date().toISOString(),
      },
      {
        id: "org-beta",
        name: "Ministerio Beta",
        slug: "ministerio-beta",
        createdAt: new Date().toISOString(),
      },
    ]);

    const createSong = new CreateSong(fx.songs);
    const listSongs = new ListSongs(fx.songs);

    // 2. Add Song 1 to Org Alpha
    await createSong.execute({
      actor: {
        sub: "user-1",
        username: "admin-alpha",
        role: "ADMIN",
        activeOrganizationId: "org-alpha",
      },
      title: "Cuerdas de Amor",
      artist: "Julio Melgar",
      originalKey: "G major",
    });

    // 3. Add Song 2 to Org Beta
    await createSong.execute({
      actor: {
        sub: "user-2",
        username: "admin-beta",
        role: "ADMIN",
        activeOrganizationId: "org-beta",
      },
      title: "La Bondad de Dios",
      artist: "Bethel Music",
      originalKey: "C major",
    });

    // 4. Query for Org Alpha - should only return Song 1
    const alphaList = await listSongs.execute({
      filter: { organizationId: "org-alpha" },
    });
    expect(alphaList.songs.length).toBe(1);
    expect(alphaList.songs[0].title).toBe("Cuerdas de Amor");
    expect(alphaList.songs[0].organizationId).toBe("org-alpha");

    // 5. Query for Org Beta - should only return Song 2
    const betaList = await listSongs.execute({
      filter: { organizationId: "org-beta" },
    });
    expect(betaList.songs.length).toBe(1);
    expect(betaList.songs[0].title).toBe("La Bondad de Dios");
    expect(betaList.songs[0].organizationId).toBe("org-beta");
  });

  test("Cross-organization song editing is forbidden", async () => {
    await fx.db.insert(organization).values([
      {
        id: "org-1",
        name: "Org One",
        slug: "org-one",
        createdAt: new Date().toISOString(),
      },
      {
        id: "org-2",
        name: "Org Two",
        slug: "org-two",
        createdAt: new Date().toISOString(),
      },
    ]);

    const createSong = new CreateSong(fx.songs);
    const updateSong = new UpdateSong(fx.songs);

    const { song } = await createSong.execute({
      actor: {
        sub: "u1",
        username: "admin1",
        role: "ADMIN",
        activeOrganizationId: "org-1",
      },
      title: "Canción Org 1",
      artist: "Artista 1",
      originalKey: "D major",
    });

    // Actor active in org-2 attempts to modify song in org-1
    await expect(
      updateSong.execute({
        actor: {
          sub: "u2",
          username: "admin2",
          role: "ADMIN",
          activeOrganizationId: "org-2",
        },
        id: song.id,
        patch: { title: "Hacked Title" },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
