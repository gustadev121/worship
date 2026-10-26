import { describe, expect, test } from "bun:test";
import type {
  IPasswordHasherPort,
  IRoleAssignmentRepository,
  ISongRepository,
  IUserRepository,
  SessionPayload,
} from "@/core/application/ports";
import { CreateLabel, UpdateLabel } from "@/core/application/use-cases/labels";
import {
  AssignRole,
  UpdateRoleAssignment,
} from "@/core/application/use-cases/roles";
import {
  CreateUser,
  DeleteUser,
  LoginUser,
  UpdateUser,
} from "@/core/application/use-cases/users";
import { SearchYouTube } from "@/core/application/use-cases/youtube";
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from "@/core/domain/errors";
import type { createRoleAssignment } from "@/core/domain/role-assignment";
import { createSong } from "@/core/domain/song";
import { createUser } from "@/core/domain/user";

const admin: SessionPayload = { sub: "a1", username: "admin", role: "ADMIN" };
const sarah: SessionPayload = {
  sub: "u-sarah",
  username: "sarah.lead",
  role: "MEMBER",
};
const mike: SessionPayload = {
  sub: "u-mike",
  username: "mike.harmony",
  role: "MEMBER",
};

function makeUsers(initial: Parameters<typeof createUser>[0][] = []) {
  const store = new Map(initial.map((u) => [u.id, createUser(u)]));
  const repo: IUserRepository = {
    findById: async (id) => store.get(id) ?? null,
    findByUsernameOrEmail: async (identifier) => {
      const lower = identifier.toLowerCase();
      for (const u of store.values()) {
        if (u.username === identifier || u.email === lower) return u;
      }
      return null;
    },
    list: async () => [...store.values()],
    create: async (u) => {
      store.set(u.id, u);
      return u;
    },
    update: async (u) => {
      store.set(u.id, u);
      return u;
    },
    delete: async (id) => {
      store.delete(id);
    },
  };
  return { store, repo };
}

const hasher: IPasswordHasherPort = {
  hash: async (password) => ({ hash: `hashed:${password}` }),
  verify: async (password, stored) => stored === `hashed:${password}`,
};

const songFixture = createSong({
  id: "s1",
  title: "Amazing Grace",
  artist: "Newton",
  originalKey: "G major",
});

function makeSongs() {
  const store = new Map([[songFixture.id, songFixture]]);
  const repo: ISongRepository = {
    findById: async (id) => store.get(id) ?? null,
    list: async () => [...store.values()],
    create: async (s) => {
      store.set(s.id, s);
      return s;
    },
    update: async (s) => {
      store.set(s.id, s);
      return s;
    },
    delete: async (id) => {
      store.delete(id);
    },
  };
  return { store, repo };
}

function makeRoles() {
  const store = new Map<string, ReturnType<typeof createRoleAssignment>>();
  const repo: IRoleAssignmentRepository = {
    findById: async (id) => store.get(id) ?? null,
    listBySong: async (songId) =>
      [...store.values()].filter((a) => a.songId === songId),
    listByUser: async (userId) =>
      [...store.values()].filter((a) => a.userId === userId),
    create: async (a) => {
      store.set(a.id, a);
      return a;
    },
    update: async (a) => {
      store.set(a.id, a);
      return a;
    },
    delete: async (id) => {
      store.delete(id);
    },
  };
  return { store, repo };
}

describe("user use cases", () => {
  const seed = {
    id: "u-sarah",
    username: "sarah.lead",
    email: "sarah@example.com",
    passwordHash: "hashed:pw12345678",
  };

  test("LoginUser rejects unknown user and bad password", async () => {
    const { repo } = makeUsers([seed]);
    const login = new LoginUser(repo, hasher);
    await expect(
      login.execute({ identifier: "nobody", password: "x" }),
    ).rejects.toThrow(UnauthorizedError);
    await expect(
      login.execute({ identifier: "sarah.lead", password: "wrong-password" }),
    ).rejects.toThrow(UnauthorizedError);
    const { user } = await login.execute({
      identifier: "sarah@example.com",
      password: "pw12345678",
    });
    expect(user.username).toBe("sarah.lead");
    expect("passwordHash" in user).toBe(false);
  });

  test("member cannot create users", async () => {
    const { repo } = makeUsers([seed]);
    const create = new CreateUser(repo, hasher);
    await expect(
      create.execute({
        actor: sarah,
        username: "x.user",
        email: "x@e.com",
        password: "pw12345678",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  test("admin update/delete round trip", async () => {
    const { repo } = makeUsers([seed]);
    const update = new UpdateUser(repo, hasher);
    const { user } = await update.execute({
      actor: admin,
      id: "u-sarah",
      role: "ADMIN",
    });
    expect(user.role).toBe("ADMIN");
    const del = new DeleteUser(repo);
    await expect(del.execute({ actor: sarah, id: "u-sarah" })).rejects.toThrow(
      ForbiddenError,
    );
    await del.execute({ actor: admin, id: "u-sarah" });
    expect(await repo.findById("u-sarah")).toBeNull();
  });
});

describe("role RBAC matrix", () => {
  test("member edits own status OK; other's 403; notes 403; duplicate 409", async () => {
    const { repo: users } = makeUsers([
      {
        id: "u-sarah",
        username: "sarah.lead",
        email: "s@s.io",
        passwordHash: "h",
      },
      {
        id: "u-mike",
        username: "mike.harmony",
        email: "m@m.io",
        passwordHash: "h",
      },
    ]);
    const { repo: songs } = makeSongs();
    const { repo: roles } = makeRoles();
    const assign = new AssignRole(roles, songs, users);
    const update = new UpdateRoleAssignment(roles);

    const { assignment } = await assign.execute({
      actor: admin,
      songId: "s1",
      userId: "u-sarah",
      roleType: "FIRST_VOICE",
    });
    await expect(
      assign.execute({
        actor: admin,
        songId: "s1",
        userId: "u-sarah",
        roleType: "FIRST_VOICE",
      }),
    ).rejects.toThrow(ConflictError);

    // member edits own status
    const own = await update.execute({
      actor: sarah,
      id: assignment.id,
      practiceStatus: "READY",
    });
    expect(own.assignment.practiceStatus).toBe("READY");

    // member edits another member's assignment
    await expect(
      update.execute({
        actor: mike,
        id: assignment.id,
        practiceStatus: "READY",
      }),
    ).rejects.toThrow(ForbiddenError);

    // member edits own notes
    await expect(
      update.execute({
        actor: sarah,
        id: assignment.id,
        harmonyOrPartNotes: "sing high",
      }),
    ).rejects.toThrow(ForbiddenError);

    // member non-admin assign
    await expect(
      assign.execute({
        actor: sarah,
        songId: "s1",
        userId: "u-mike",
        roleType: "SECOND_VOICE",
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});

describe("labels + youtube", () => {
  test("duplicate slug 409; empty youtube query 400", async () => {
    const { repo } = makeUsers();
    void repo;
    const store = new Map<
      string,
      { id: string; name: string; slug: string; colorHex: string }
    >();
    const labelRepo = {
      list: async () => [...store.values()],
      findById: async (id: string) => store.get(id) ?? null,
      findBySlug: async (slug: string) =>
        [...store.values()].find((l) => l.slug === slug) ?? null,
      create: async (l: {
        id: string;
        name: string;
        slug: string;
        colorHex: string;
      }) => {
        store.set(l.id, l);
        return l;
      },
      update: async (l: {
        id: string;
        name: string;
        slug: string;
        colorHex: string;
      }) => {
        store.set(l.id, l);
        return l;
      },
      delete: async (id: string) => {
        store.delete(id);
      },
      setSongLabels: async () => {},
      getSongLabelIds: async () => [],
    };
    const create = new CreateLabel(labelRepo);
    await create.execute({
      actor: admin,
      name: "Sunday Set",
      colorHex: "#4F46E5",
    });
    await expect(
      create.execute({ actor: admin, name: "Sunday Set", colorHex: "#000000" }),
    ).rejects.toThrow(ConflictError);
    const update = new UpdateLabel(labelRepo);
    await expect(
      update.execute({ actor: sarah, id: "x", name: "Youth" }),
    ).rejects.toThrow(ForbiddenError);

    const search = new SearchYouTube({ search: async () => [] });
    const { ValidationError } = await import("@/core/domain/errors");
    await expect(search.execute({ query: "  " })).rejects.toThrow(
      ValidationError,
    );
    const { results } = await search.execute({ query: "grace" });
    expect(results).toEqual([]);
  });
});
