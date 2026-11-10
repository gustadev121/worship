import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import type { SessionPayload } from "@/core/application/ports";
import { type Db, getDb } from "@/infrastructure/db/client";
import { users } from "@/infrastructure/db/schema";

// Dynamic test bindings and session
let currentD1: unknown = null;
let currentSession: SessionPayload | null = null;

const workerEnv = {
  get DB() {
    return currentD1;
  },
};

mock.module("cloudflare:workers", () => ({
  env: workerEnv,
}));

mock.module("@/presentation/auth", () => ({
  getSession: async () => currentSession,
  buildSessionCookie: () => "",
  CLEAR_SESSION_COOKIE: "",
  SESSION_COOKIE: "wf_session",
  SESSION_MAX_AGE: 604800,
}));

// Route handlers
const { GET: getRoadmap } = await import("@/app/api/roadmap/route");
const { PATCH: updateMilestoneStatus } = await import(
  "@/app/api/roadmap/milestones/[id]/status/route"
);
const { POST: toggleVote } = await import(
  "@/app/api/roadmap/capabilities/[id]/vote/route"
);
const { getContainer } = await import("@/infrastructure/container");
const { getRequestEnv } = await import("@/presentation/get-request-env");

interface TestContext {
  db: Db;
  mf: Miniflare;
}

const now = "2026-01-01T00:00:00.000Z";

async function setup(): Promise<TestContext> {
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

  const d1 = await mf.getD1Database("DB");
  currentD1 = d1;
  const db = await getDb(d1);

  // Seed baseline test users for FK integrity
  await db.insert(users).values([
    {
      id: "u-admin",
      username: "admin_tester",
      email: "admin@test.local",
      passwordHash: "hash123",
      role: "ADMIN",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "u-member",
      username: "member_tester",
      email: "member@test.local",
      passwordHash: "hash123",
      role: "MEMBER",
      createdAt: now,
      updatedAt: now,
    },
  ]);

  // Seed baseline canonical roadmap
  const container = await getContainer(await getRequestEnv());
  await container.seedRoadmap.execute();

  return { db, mf };
}

describe("Roadmap API Integration Tests", () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setup();
    currentSession = null;
  });

  afterEach(async () => {
    currentSession = null;
    currentD1 = null;
    if (ctx?.mf) {
      await ctx.mf.dispose();
    }
  });

  describe("GET /api/roadmap (T012)", () => {
    test("rejects unauthenticated request with 401 Unauthorized", async () => {
      currentSession = null;
      const req = new Request("http://localhost/api/roadmap");
      const res = await getRoadmap(req);

      expect(res.status).toBe(401);
      const data = (await res.json()) as { error?: string };
      expect(data.error).toBe("No autorizado");
    });

    test("returns full roadmap hierarchy, 4 sequential phases, and summary statistics", async () => {
      currentSession = {
        sub: "u-member",
        username: "member_tester",
        role: "MEMBER",
      };
      const req = new Request("http://localhost/api/roadmap");
      const res = await getRoadmap(req);

      expect(res.status).toBe(200);
      const data = (await res.json()) as {
        phases: Array<{
          id: string;
          phaseNumber: number;
          name: string;
          status: string;
          completionPercentage: number;
          milestones: Array<{
            id: string;
            capabilities: Array<{ id: string; userHasVoted: boolean }>;
          }>;
        }>;
        summary: {
          totalPhases: number;
          totalMilestones: number;
          completedMilestones: number;
          totalCapabilities: number;
          completedCapabilities: number;
          overallProgress: number;
        };
      };

      expect(data.phases.length).toBe(4);
      expect(data.phases[0]?.phaseNumber).toBe(1);
      expect(data.phases[0]?.status).toBe("COMPLETED");
      expect(data.phases[0]?.completionPercentage).toBe(100);
      expect(data.summary.totalPhases).toBe(4);
      expect(data.summary.totalMilestones).toBe(8);
      expect(data.summary.completedMilestones).toBe(2);
      expect(data.summary.totalCapabilities).toBe(24);
      expect(data.summary.completedCapabilities).toBe(6);
      expect(data.summary.overallProgress).toBe(25);
    });

    test("filters capabilities by functionalTrack (US3 / T025)", async () => {
      currentSession = {
        sub: "u-member",
        username: "member_tester",
        role: "MEMBER",
      };
      const req = new Request("http://localhost/api/roadmap?track=PLANNING");
      const res = await getRoadmap(req);

      expect(res.status).toBe(200);
      const data = (await res.json()) as {
        phases: Array<{
          milestones: Array<{
            capabilities: Array<{ functionalTrack: string }>;
          }>;
        }>;
      };

      const allCapabilities = data.phases.flatMap((p) =>
        p.milestones.flatMap((m) => m.capabilities),
      );
      expect(allCapabilities.length).toBeGreaterThan(0);
      for (const cap of allCapabilities) {
        expect(cap.functionalTrack).toBe("PLANNING");
      }
    });

    test("filters capabilities by priorityTier (US3 / T025)", async () => {
      currentSession = {
        sub: "u-member",
        username: "member_tester",
        role: "MEMBER",
      };
      const req = new Request("http://localhost/api/roadmap?priority=P1");
      const res = await getRoadmap(req);

      expect(res.status).toBe(200);
      const data = (await res.json()) as {
        phases: Array<{
          milestones: Array<{
            capabilities: Array<{ priorityTier: string }>;
          }>;
        }>;
      };

      const allCapabilities = data.phases.flatMap((p) =>
        p.milestones.flatMap((m) => m.capabilities),
      );
      expect(allCapabilities.length).toBeGreaterThan(0);
      for (const cap of allCapabilities) {
        expect(cap.priorityTier).toBe("P1");
      }
    });

    test("filters by phase number (US1, US3)", async () => {
      currentSession = {
        sub: "u-member",
        username: "member_tester",
        role: "MEMBER",
      };
      const req = new Request("http://localhost/api/roadmap?phase=2");
      const res = await getRoadmap(req);

      expect(res.status).toBe(200);
      const data = (await res.json()) as {
        phases: Array<{ phaseNumber: number }>;
      };

      expect(data.phases.length).toBe(1);
      expect(data.phases[0]?.phaseNumber).toBe(2);
    });

    test("rejects invalid query parameters with 400 Bad Request", async () => {
      currentSession = {
        sub: "u-member",
        username: "member_tester",
        role: "MEMBER",
      };
      const req = new Request(
        "http://localhost/api/roadmap?track=INVALID_TRACK",
      );
      const res = await getRoadmap(req);

      expect(res.status).toBe(400);
      const data = (await res.json()) as { error?: string };
      expect(data.error).toBeDefined();
    });
  });

  describe("PATCH /api/roadmap/milestones/:id/status (T021)", () => {
    test("rejects unauthenticated request with 401 Unauthorized", async () => {
      currentSession = null;
      const req = new Request(
        "http://localhost/api/roadmap/milestones/ms-2-setlists/status",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "IN_PROGRESS" }),
        },
      );
      const res = await updateMilestoneStatus(req, {
        params: Promise.resolve({ id: "ms-2-setlists" }),
      });

      expect(res.status).toBe(401);
    });

    test("rejects non-admin MEMBER role with 403 Forbidden", async () => {
      currentSession = {
        sub: "u-member",
        username: "member_tester",
        role: "MEMBER",
      };
      const req = new Request(
        "http://localhost/api/roadmap/milestones/ms-2-setlists/status",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "IN_PROGRESS" }),
        },
      );
      const res = await updateMilestoneStatus(req, {
        params: Promise.resolve({ id: "ms-2-setlists" }),
      });

      expect(res.status).toBe(403);
    });

    test("allows ADMIN to update milestone status", async () => {
      currentSession = {
        sub: "u-admin",
        username: "admin_tester",
        role: "ADMIN",
      };
      const req = new Request(
        "http://localhost/api/roadmap/milestones/ms-2-setlists/status",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "IN_PROGRESS",
            releaseNotes: "Development in active sprint",
          }),
        },
      );
      const res = await updateMilestoneStatus(req, {
        params: Promise.resolve({ id: "ms-2-setlists" }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as {
        milestone: {
          id: string;
          status: string;
          releaseNotes: string | null;
        };
        phaseStatusUpdated: boolean;
      };
      expect(data.milestone.id).toBe("ms-2-setlists");
      expect(data.milestone.status).toBe("IN_PROGRESS");
      expect(data.milestone.releaseNotes).toBe("Development in active sprint");
    });

    test("blocks milestone completion when upstream blocking prerequisite is unmet (PREREQUISITE_NOT_SATISFIED)", async () => {
      currentSession = {
        sub: "u-admin",
        username: "admin_tester",
        role: "ADMIN",
      };
      // ms-3-scheduling depends on ms-2-setlists (blocking), which is IN_PROGRESS
      const req = new Request(
        "http://localhost/api/roadmap/milestones/ms-3-scheduling/status",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "COMPLETED" }),
        },
      );
      const res = await updateMilestoneStatus(req, {
        params: Promise.resolve({ id: "ms-3-scheduling" }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as {
        error: {
          code: string;
          message: string;
          unmetPrerequisites: string[];
        };
      };
      expect(data.error.code).toBe("PREREQUISITE_NOT_SATISFIED");
      expect(data.error.unmetPrerequisites).toContain("ms-2-setlists");
    });

    test("returns 404 Not Found for nonexistent milestone", async () => {
      currentSession = {
        sub: "u-admin",
        username: "admin_tester",
        role: "ADMIN",
      };
      const req = new Request(
        "http://localhost/api/roadmap/milestones/nonexistent-ms/status",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "IN_PROGRESS" }),
        },
      );
      const res = await updateMilestoneStatus(req, {
        params: Promise.resolve({ id: "nonexistent-ms" }),
      });

      expect(res.status).toBe(404);
    });

    test("returns 400 Bad Request for invalid status body", async () => {
      currentSession = {
        sub: "u-admin",
        username: "admin_tester",
        role: "ADMIN",
      };
      const req = new Request(
        "http://localhost/api/roadmap/milestones/ms-2-setlists/status",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "INVALID_STATUS_VALUE" }),
        },
      );
      const res = await updateMilestoneStatus(req, {
        params: Promise.resolve({ id: "ms-2-setlists" }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/roadmap/capabilities/:id/vote (T030)", () => {
    test("rejects unauthenticated vote request with 401 Unauthorized", async () => {
      currentSession = null;
      const req = new Request(
        "http://localhost/api/roadmap/capabilities/cap-2-1/vote",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hasInterest: true }),
        },
      );
      const res = await toggleVote(req, {
        params: Promise.resolve({ id: "cap-2-1" }),
      });

      expect(res.status).toBe(401);
    });

    test("allows volunteer to toggle vote on with note and increments tally", async () => {
      currentSession = {
        sub: "u-member",
        username: "member_tester",
        role: "MEMBER",
      };
      const req = new Request(
        "http://localhost/api/roadmap/capabilities/cap-2-1/vote",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hasInterest: true,
            note: "Crucial for our service transitions",
          }),
        },
      );
      const res = await toggleVote(req, {
        params: Promise.resolve({ id: "cap-2-1" }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as {
        capabilityId: string;
        hasInterest: boolean;
        note: string | null;
        newTotalInterestCount: number;
      };

      expect(data.capabilityId).toBe("cap-2-1");
      expect(data.hasInterest).toBe(true);
      expect(data.note).toBe("Crucial for our service transitions");
      expect(data.newTotalInterestCount).toBe(1);
    });

    test("allows volunteer to toggle vote off and decrements tally", async () => {
      currentSession = {
        sub: "u-member",
        username: "member_tester",
        role: "MEMBER",
      };

      // Vote on first
      await toggleVote(
        new Request("http://localhost/api/roadmap/capabilities/cap-2-1/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hasInterest: true, note: "Initial interest" }),
        }),
        { params: Promise.resolve({ id: "cap-2-1" }) },
      );

      // Toggle off
      const req = new Request(
        "http://localhost/api/roadmap/capabilities/cap-2-1/vote",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hasInterest: false }),
        },
      );
      const res = await toggleVote(req, {
        params: Promise.resolve({ id: "cap-2-1" }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as {
        capabilityId: string;
        hasInterest: boolean;
        note: string | null;
        newTotalInterestCount: number;
      };

      expect(data.hasInterest).toBe(false);
      expect(data.newTotalInterestCount).toBe(0);
    });

    test("rejects note exceeding 280 characters with 400 Bad Request", async () => {
      currentSession = {
        sub: "u-member",
        username: "member_tester",
        role: "MEMBER",
      };
      const longNote = "A".repeat(281);
      const req = new Request(
        "http://localhost/api/roadmap/capabilities/cap-2-1/vote",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hasInterest: true, note: longNote }),
        },
      );
      const res = await toggleVote(req, {
        params: Promise.resolve({ id: "cap-2-1" }),
      });

      expect(res.status).toBe(400);
    });

    test("returns 404 Not Found for nonexistent capability", async () => {
      currentSession = {
        sub: "u-member",
        username: "member_tester",
        role: "MEMBER",
      };
      const req = new Request(
        "http://localhost/api/roadmap/capabilities/nonexistent-cap/vote",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hasInterest: true }),
        },
      );
      const res = await toggleVote(req, {
        params: Promise.resolve({ id: "nonexistent-cap" }),
      });

      expect(res.status).toBe(404);
    });
  });
});
