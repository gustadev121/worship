import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import { ConflictError, NotFoundError } from "@/core/domain/errors";
import type {
  CapabilityItem,
  Milestone,
  PhaseDependency,
  RoadmapPhase,
} from "@/core/domain/roadmap";
import { type Db, getDb } from "@/infrastructure/db/client";
import {
  roadmapCapabilityFeedback,
  roadmapPhases,
  users,
} from "@/infrastructure/db/schema";
import { DrizzleRoadmapRepository } from "@/infrastructure/repositories/DrizzleRoadmapRepository";

interface Fixture {
  db: Db;
  mf: Miniflare;
  repo: DrizzleRoadmapRepository;
}

const now = "2026-01-01T00:00:00.000Z";

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
  return {
    db,
    mf,
    repo: new DrizzleRoadmapRepository(db),
  };
}

let fx: Fixture;
beforeEach(async () => {
  fx = await setup();
});
afterEach(async () => {
  await fx.mf.dispose();
});

async function seedUser(
  db: Db,
  id: string,
  username = "sarah.lead",
  email = "sarah@example.com",
) {
  await db.insert(users).values({
    id,
    username,
    email,
    passwordHash: "hash",
    role: "MEMBER",
    createdAt: now,
    updatedAt: now,
  });
}

function samplePhase(
  id: string,
  phaseNumber: number,
  name: string,
): RoadmapPhase {
  return {
    id,
    phaseNumber,
    name,
    description: `Description for ${name}`,
    status: "PLANNED",
    targetHorizon: `Q${phaseNumber} 2026`,
    createdAt: now,
    updatedAt: now,
  };
}

function sampleMilestone(
  id: string,
  phaseId: string,
  title: string,
  sortOrder: number,
  status: Milestone["status"] = "NOT_STARTED",
): Milestone {
  return {
    id,
    phaseId,
    title,
    description: `Description for ${title}`,
    status,
    sortOrder,
    targetCompletionDate: "2026-06-30",
    releaseNotes: null,
    createdAt: now,
    updatedAt: now,
  };
}

function sampleCapability(
  id: string,
  milestoneId: string,
  title: string,
  sortOrder: number,
  functionalTrack: CapabilityItem["functionalTrack"] = "PLANNING",
  priorityTier: CapabilityItem["priorityTier"] = "P1",
  isCompleted = false,
): CapabilityItem {
  return {
    id,
    milestoneId,
    title,
    targetPersona: "Worship Leader",
    functionalTrack,
    priorityTier,
    acceptanceCriteria: `Criteria for ${title}`,
    isCompleted,
    sortOrder,
    createdAt: now,
    updatedAt: now,
  };
}

describe("DrizzleRoadmapRepository", () => {
  describe("isSeeded and seedBaseline", () => {
    test("isSeeded returns false on fresh DB and true after seedBaseline", async () => {
      expect(await fx.repo.isSeeded()).toBe(false);

      const p1 = samplePhase("p1", 1, "Phase 1 - Repertoire Core");
      const m1 = sampleMilestone("m1", "p1", "Song Library", 0);
      const c1 = sampleCapability("c1", "m1", "Song Database", 0);
      const dep: PhaseDependency = {
        id: "d1",
        dependentMilestoneId: "m1",
        prerequisiteMilestoneId: "m1",
        isBlocking: false,
        createdAt: now,
      };

      await fx.repo.seedBaseline({
        phases: [p1],
        milestones: [m1],
        capabilities: [c1],
        dependencies: [dep],
      });

      expect(await fx.repo.isSeeded()).toBe(true);

      const phases = await fx.repo.listPhases();
      expect(phases).toHaveLength(1);
      expect(phases[0]?.name).toBe("Phase 1 - Repertoire Core");

      const milestones = await fx.repo.listMilestones("p1");
      expect(milestones).toHaveLength(1);
      expect(milestones[0]?.title).toBe("Song Library");

      const caps = await fx.repo.listCapabilities({ milestoneId: "m1" });
      expect(caps).toHaveLength(1);
      expect(caps[0]?.title).toBe("Song Database");

      const deps = await fx.repo.listDependencies("m1");
      expect(deps).toHaveLength(1);
      expect(deps[0]?.id).toBe("d1");
    });
  });

  describe("Phases CRUD & Ordering", () => {
    test("listPhases orders by phaseNumber ASC and getPhase retrieves by ID", async () => {
      const p3 = samplePhase("p3", 3, "Phase 3");
      const p1 = samplePhase("p1", 1, "Phase 1");
      const p2 = samplePhase("p2", 2, "Phase 2");

      await fx.repo.seedBaseline({
        phases: [p3, p1, p2],
        milestones: [],
        capabilities: [],
        dependencies: [],
      });

      const phases = await fx.repo.listPhases();
      expect(phases).toHaveLength(3);
      expect(phases.map((p) => p.phaseNumber)).toEqual([1, 2, 3]);

      const retrieved = await fx.repo.getPhase("p2");
      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe("Phase 2");
      expect(retrieved?.targetHorizon).toBe("Q2 2026");

      const notFound = await fx.repo.getPhase("p-nonexistent");
      expect(notFound).toBeNull();
    });
  });

  describe("Milestones CRUD, Ordering & Status Updates", () => {
    test("listMilestones filters by phaseId and orders by sortOrder ASC", async () => {
      const p1 = samplePhase("p1", 1, "Phase 1");
      const p2 = samplePhase("p2", 2, "Phase 2");

      const m1a = sampleMilestone("m1a", "p1", "Milestone 1B", 2);
      const m1b = sampleMilestone("m1b", "p1", "Milestone 1A", 1);
      const m2a = sampleMilestone("m2a", "p2", "Milestone 2A", 1);

      await fx.repo.seedBaseline({
        phases: [p1, p2],
        milestones: [m1a, m1b, m2a],
        capabilities: [],
        dependencies: [],
      });

      const p1Milestones = await fx.repo.listMilestones("p1");
      expect(p1Milestones).toHaveLength(2);
      expect(p1Milestones.map((m) => m.id)).toEqual(["m1b", "m1a"]);

      const allMilestones = await fx.repo.listMilestones();
      expect(allMilestones).toHaveLength(3);

      const single = await fx.repo.getMilestone("m1a");
      expect(single?.title).toBe("Milestone 1B");
      expect(await fx.repo.getMilestone("missing")).toBeNull();
    });

    test("updateMilestoneStatus updates status, releaseNotes, and updatedAt", async () => {
      const p1 = samplePhase("p1", 1, "Phase 1");
      const m1 = sampleMilestone("m1", "p1", "Milestone 1", 0, "NOT_STARTED");

      await fx.repo.seedBaseline({
        phases: [p1],
        milestones: [m1],
        capabilities: [],
        dependencies: [],
      });

      const updated = await fx.repo.updateMilestoneStatus(
        "m1",
        "IN_PROGRESS",
        "Release notes v1.0",
      );

      expect(updated.status).toBe("IN_PROGRESS");
      expect(updated.releaseNotes).toBe("Release notes v1.0");
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(now).getTime(),
      );

      // Verify persistence in DB
      const fetched = await fx.repo.getMilestone("m1");
      expect(fetched?.status).toBe("IN_PROGRESS");
      expect(fetched?.releaseNotes).toBe("Release notes v1.0");

      // Verify omitting releaseNotes keeps previous releaseNotes
      const updatedWithoutNotes = await fx.repo.updateMilestoneStatus(
        "m1",
        "COMPLETED",
      );
      expect(updatedWithoutNotes.status).toBe("COMPLETED");
      expect(updatedWithoutNotes.releaseNotes).toBe("Release notes v1.0");

      // Verify passing null clears releaseNotes
      const clearedNotes = await fx.repo.updateMilestoneStatus(
        "m1",
        "COMPLETED",
        null,
      );
      expect(clearedNotes.releaseNotes).toBeNull();
    });

    test("updateMilestoneStatus throws NotFoundError for nonexistent milestone", async () => {
      await expect(
        fx.repo.updateMilestoneStatus("non-existent-id", "COMPLETED"),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("Capabilities CRUD & Multi-Dimensional Filtering", () => {
    test("listCapabilities filters by milestoneId, functionalTrack, and priorityTier", async () => {
      const p1 = samplePhase("p1", 1, "Phase 1");
      const m1 = sampleMilestone("m1", "p1", "Milestone 1", 0);
      const m2 = sampleMilestone("m2", "p1", "Milestone 2", 1);

      const c1 = sampleCapability(
        "c1",
        "m1",
        "Cap 1",
        2,
        "PLANNING",
        "P1",
        false,
      );
      const c2 = sampleCapability(
        "c2",
        "m1",
        "Cap 2",
        1,
        "REPERTOIRE",
        "P1",
        true,
      );
      const c3 = sampleCapability(
        "c3",
        "m2",
        "Cap 3",
        0,
        "PLANNING",
        "P2",
        false,
      );

      await fx.repo.seedBaseline({
        phases: [p1],
        milestones: [m1, m2],
        capabilities: [c1, c2, c3],
        dependencies: [],
      });

      // Filter by milestoneId
      const m1Caps = await fx.repo.listCapabilities({ milestoneId: "m1" });
      expect(m1Caps).toHaveLength(2);
      expect(m1Caps.map((c) => c.id)).toEqual(["c2", "c1"]); // ordered by sortOrder (1, 2)

      // Filter by functionalTrack
      const planningCaps = await fx.repo.listCapabilities({
        functionalTrack: "PLANNING",
      });
      expect(planningCaps).toHaveLength(2);
      expect(planningCaps.map((c) => c.id)).toEqual(["c3", "c1"]); // sortOrder 0, 2

      // Filter by priorityTier
      const p1Caps = await fx.repo.listCapabilities({ priorityTier: "P1" });
      expect(p1Caps).toHaveLength(2);

      // Filter by both track and priority
      const filtered = await fx.repo.listCapabilities({
        functionalTrack: "PLANNING",
        priorityTier: "P1",
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.id).toBe("c1");
      expect(filtered[0]?.isCompleted).toBe(false);

      // getCapability check
      const cap = await fx.repo.getCapability("c2");
      expect(cap).not.toBeNull();
      expect(cap?.isCompleted).toBe(true);
      expect(await fx.repo.getCapability("missing")).toBeNull();
    });
  });

  describe("Dependencies CRUD & Blocking Gating", () => {
    test("addDependency and listDependencies support blocking flags and prevent duplicates", async () => {
      const p1 = samplePhase("p1", 1, "Phase 1");
      const m1 = sampleMilestone("m1", "p1", "Prerequisite Milestone", 0);
      const m2 = sampleMilestone("m2", "p1", "Dependent Milestone", 1);
      const m3 = sampleMilestone("m3", "p1", "Another Milestone", 2);

      await fx.repo.seedBaseline({
        phases: [p1],
        milestones: [m1, m2, m3],
        capabilities: [],
        dependencies: [],
      });

      const dep1 = await fx.repo.addDependency("m2", "m1", true);
      expect(dep1.dependentMilestoneId).toBe("m2");
      expect(dep1.prerequisiteMilestoneId).toBe("m1");
      expect(dep1.isBlocking).toBe(true);

      const dep2 = await fx.repo.addDependency("m3", "m1", false);
      expect(dep2.isBlocking).toBe(false);

      // Listing
      const allDeps = await fx.repo.listDependencies();
      expect(allDeps).toHaveLength(2);

      const m2Deps = await fx.repo.listDependencies("m2");
      expect(m2Deps).toHaveLength(1);
      expect(m2Deps[0]?.id).toBe(dep1.id);

      // Unique constraint on (dependentMilestoneId, prerequisiteMilestoneId)
      await expect(fx.repo.addDependency("m2", "m1", false)).rejects.toThrow(
        ConflictError,
      );
    });
  });

  describe("toggleVote & Ministry Feedback Signals (T027)", () => {
    test("handles vote casting, note updating, vote toggling off, and tally decrementing", async () => {
      await seedUser(fx.db, "u1", "user.one", "u1@example.com");
      await seedUser(fx.db, "u2", "user.two", "u2@example.com");

      const p1 = samplePhase("p1", 1, "Phase 1");
      const m1 = sampleMilestone("m1", "p1", "Milestone 1", 0);
      const c1 = sampleCapability("c1", "m1", "Capability 1", 0);

      await fx.repo.seedBaseline({
        phases: [p1],
        milestones: [m1],
        capabilities: [c1],
        dependencies: [],
      });

      // 1. Initial vote with note by user 1
      const vote1 = await fx.repo.toggleVote(
        "c1",
        "u1",
        true,
        "Critical for Sunday band",
      );
      expect(vote1.totalInterestCount).toBe(1);
      expect(vote1.feedback.hasInterest).toBe(true);
      expect(vote1.feedback.note).toBe("Critical for Sunday band");
      expect(vote1.feedback.capabilityId).toBe("c1");
      expect(vote1.feedback.userId).toBe("u1");

      // Verify getUserFeedback
      const u1Feedback = await fx.repo.getUserFeedback("c1", "u1");
      expect(u1Feedback).not.toBeNull();
      expect(u1Feedback?.hasInterest).toBe(true);
      expect(u1Feedback?.note).toBe("Critical for Sunday band");

      // 2. Initial vote without note by user 2
      const vote2 = await fx.repo.toggleVote("c1", "u2", true);
      expect(vote2.totalInterestCount).toBe(2);
      expect(vote2.feedback.hasInterest).toBe(true);
      expect(vote2.feedback.note).toBeNull();

      // 3. User 1 updates note while still interested
      const vote1UpdatedNote = await fx.repo.toggleVote(
        "c1",
        "u1",
        true,
        "Updated: urgent for Easter",
      );
      expect(vote1UpdatedNote.totalInterestCount).toBe(2);
      expect(vote1UpdatedNote.feedback.note).toBe("Updated: urgent for Easter");

      // 4. User 1 updates vote without providing note (preserves existing note)
      const vote1PreserveNote = await fx.repo.toggleVote("c1", "u1", true);
      expect(vote1PreserveNote.totalInterestCount).toBe(2);
      expect(vote1PreserveNote.feedback.note).toBe(
        "Updated: urgent for Easter",
      );

      // 5. User 1 toggles off interest (total decrements)
      const vote1ToggleOff = await fx.repo.toggleVote("c1", "u1", false);
      expect(vote1ToggleOff.totalInterestCount).toBe(1);
      expect(vote1ToggleOff.feedback.hasInterest).toBe(false);
      expect(vote1ToggleOff.feedback.note).toBe("Updated: urgent for Easter");

      // 6. User 2 toggles off interest (total decrements to 0)
      const vote2ToggleOff = await fx.repo.toggleVote("c1", "u2", false);
      expect(vote2ToggleOff.totalInterestCount).toBe(0);
      expect(vote2ToggleOff.feedback.hasInterest).toBe(false);

      // 7. Verify feedback list returns both users' rows
      const feedbackList = await fx.repo.listFeedback("c1");
      expect(feedbackList).toHaveLength(2);

      // Verify unique constraint: total rows in table for (c1) remains exactly 2
      const rows = await fx.db.select().from(roadmapCapabilityFeedback);
      expect(rows).toHaveLength(2);

      // Direct duplicate insertion rejects due to UNIQUE(capability_id, user_id)
      await expect(
        (async () => {
          await fx.db.insert(roadmapCapabilityFeedback).values({
            id: "duplicate-id",
            capabilityId: "c1",
            userId: "u1",
            hasInterest: true,
            createdAt: now,
            updatedAt: now,
          });
        })(),
      ).rejects.toThrow();
    });
  });

  describe("Foreign Key Cascade Deletions", () => {
    test("deleting a phase cascades to milestones, capabilities, and dependencies", async () => {
      const p1 = samplePhase("p1", 1, "Phase 1");
      const m1 = sampleMilestone("m1", "p1", "Milestone 1", 0);
      const m2 = sampleMilestone("m2", "p1", "Milestone 2", 1);
      const c1 = sampleCapability("c1", "m1", "Cap 1", 0);
      const dep: PhaseDependency = {
        id: "d1",
        dependentMilestoneId: "m2",
        prerequisiteMilestoneId: "m1",
        isBlocking: true,
        createdAt: now,
      };

      await fx.repo.seedBaseline({
        phases: [p1],
        milestones: [m1, m2],
        capabilities: [c1],
        dependencies: [dep],
      });

      // Confirm created
      expect(await fx.repo.listPhases()).toHaveLength(1);
      expect(await fx.repo.listMilestones("p1")).toHaveLength(2);
      expect(
        await fx.repo.listCapabilities({ milestoneId: "m1" }),
      ).toHaveLength(1);
      expect(await fx.repo.listDependencies()).toHaveLength(1);

      // Delete the phase directly
      await fx.db.delete(roadmapPhases);

      // Everything should have cascaded
      expect(await fx.repo.listPhases()).toHaveLength(0);
      expect(await fx.repo.listMilestones()).toHaveLength(0);
      expect(await fx.repo.listCapabilities()).toHaveLength(0);
      expect(await fx.repo.listDependencies()).toHaveLength(0);
    });
  });
});
