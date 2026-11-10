import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/core/domain/errors";
import {
  type CapabilityItem,
  canMilestoneComplete,
  computePhaseProgress,
  type Milestone,
  type PhaseDependency,
  type RoadmapPhase,
} from "@/core/domain/roadmap";
import type {
  RoadmapCapabilityDTO,
  RoadmapFilterInput,
  RoadmapMilestoneDTO,
  RoadmapPhaseDTO,
  RoadmapPrerequisiteDTO,
  RoadmapResponseDTO,
  RoadmapSummaryDTO,
  ToggleVoteInput,
  ToggleVoteResponseDTO,
  UpdateMilestoneStatusInput,
  UpdateMilestoneStatusResponseDTO,
} from "../dtos";
import type { RoadmapRepository } from "../ports";
import {
  roadmapFilterSchema,
  toggleVoteSchema,
  updateMilestoneStatusSchema,
} from "../schemas";

export const CANONICAL_PHASES: RoadmapPhase[] = [
  {
    id: "phase-1-foundation",
    phaseNumber: 1,
    name: "Repertoire & Rehearsal Foundation",
    description:
      "Core song catalog, multi-part vocal/instrument practice matrix, and rehearsal player.",
    status: "COMPLETED",
    targetHorizon: "Delivered (v0.1)",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "phase-2-planning",
    phaseNumber: 2,
    name: "Service Planning & Setlist Management",
    description:
      "Order of service creation, song ordering, arrangement notes, and duration calculation.",
    status: "IN_PROGRESS",
    targetHorizon: "Q1 2027",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "phase-3-rostering",
    phaseNumber: 3,
    name: "Volunteer Scheduling & Roster Management",
    description:
      "Team invitations, ministry position assignments, availability tracking, and automated reminders.",
    status: "PENDING_PREREQUISITES",
    targetHorizon: "Q2 2027",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "phase-4-stage",
    phaseNumber: 4,
    name: "Live Service Execution & Stage Mode",
    description:
      "Distraction-free live service teleprompter view, transposing chord charts, and cues.",
    status: "PENDING_PREREQUISITES",
    targetHorizon: "Q3 2027",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export const CANONICAL_MILESTONES: Milestone[] = [
  // Phase 1
  {
    id: "ms-1-repertoire",
    phaseId: "phase-1-foundation",
    title: "Song Repertoire & Arrangement Catalog",
    description:
      "Central catalog storing lyrics, chords, canonical keys, BPM, and tags.",
    status: "COMPLETED",
    sortOrder: 1,
    targetCompletionDate: "2026-10-26",
    releaseNotes: "Shipped in initial v0.1 release.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "ms-1-rehearsal",
    phaseId: "phase-1-foundation",
    title: "Multi-Voice Rehearsal & Readiness Tracking",
    description:
      "Vocal/instrument assignments, practice statuses, and synchronized playback.",
    status: "COMPLETED",
    sortOrder: 2,
    targetCompletionDate: "2026-11-05",
    releaseNotes: "Shipped multi-part vocal tracking and practice states.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  // Phase 2
  {
    id: "ms-2-setlists",
    phaseId: "phase-2-planning",
    title: "Setlist Sequencing & Service Timing",
    description:
      "Drag-and-drop song arrangement order and total runtime tracking.",
    status: "IN_PROGRESS",
    sortOrder: 1,
    targetCompletionDate: "2027-02-15",
    releaseNotes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "ms-2-order-of-service",
    phaseId: "phase-2-planning",
    title: "Liturgy & Order of Service Elements",
    description:
      "Non-musical liturgy elements: prayers, scripture readings, welcomes, and sermons.",
    status: "NOT_STARTED",
    sortOrder: 2,
    targetCompletionDate: "2027-03-31",
    releaseNotes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  // Phase 3
  {
    id: "ms-3-scheduling",
    phaseId: "phase-3-rostering",
    title: "Volunteer Position Scheduling & Invitations",
    description:
      "Schedule vocalists, band musicians, and tech crew onto upcoming services.",
    status: "NOT_STARTED",
    sortOrder: 1,
    targetCompletionDate: "2027-05-15",
    releaseNotes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "ms-3-availability",
    phaseId: "phase-3-rostering",
    title: "Volunteer Availability & Block-out Dates",
    description:
      "Team member self-service portal for blackout dates and scheduling preferences.",
    status: "NOT_STARTED",
    sortOrder: 2,
    targetCompletionDate: "2027-06-30",
    releaseNotes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  // Phase 4
  {
    id: "ms-4-stage-mode",
    phaseId: "phase-4-stage",
    title: "Live Stage Teleprompter & Chord Charts",
    description:
      "Full-screen high-contrast live performance view with instant chart transposition.",
    status: "NOT_STARTED",
    sortOrder: 1,
    targetCompletionDate: "2027-08-31",
    releaseNotes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "ms-4-presentation-sync",
    phaseId: "phase-4-stage",
    title: "Live Cues & Presentation Software Integration",
    description:
      "Synchronized live section cues and lyric presentation integrations.",
    status: "NOT_STARTED",
    sortOrder: 2,
    targetCompletionDate: "2027-09-30",
    releaseNotes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export const CANONICAL_DEPENDENCIES: PhaseDependency[] = [
  {
    id: "dep-2-1",
    dependentMilestoneId: "ms-2-setlists",
    prerequisiteMilestoneId: "ms-1-repertoire",
    isBlocking: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "dep-3-2",
    dependentMilestoneId: "ms-3-scheduling",
    prerequisiteMilestoneId: "ms-2-setlists",
    isBlocking: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "dep-4-1",
    dependentMilestoneId: "ms-4-stage-mode",
    prerequisiteMilestoneId: "ms-1-repertoire",
    isBlocking: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "dep-4-2",
    dependentMilestoneId: "ms-4-stage-mode",
    prerequisiteMilestoneId: "ms-2-setlists",
    isBlocking: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

export const CANONICAL_CAPABILITIES: CapabilityItem[] = [
  // Phase 1 - Milestone 1
  {
    id: "cap-1-1",
    milestoneId: "ms-1-repertoire",
    title: "Song Catalog CRUD with Canonical Keys",
    targetPersona: "Worship Leader",
    functionalTrack: "REPERTOIRE",
    priorityTier: "P1",
    acceptanceCriteria:
      "Songs can be created with 24 canonical keys, BPM, time signature, and chord charts.",
    isCompleted: true,
    sortOrder: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cap-1-2",
    milestoneId: "ms-1-repertoire",
    title: "Custom Repertoire Tags & Service Labels",
    targetPersona: "Worship Leader",
    functionalTrack: "REPERTOIRE",
    priorityTier: "P2",
    acceptanceCriteria:
      "Color-coded tags can be assigned to songs to filter by liturgical season.",
    isCompleted: true,
    sortOrder: 2,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cap-1-3",
    milestoneId: "ms-1-repertoire",
    title: "Multi-Format Lyrics & Chord Editor",
    targetPersona: "Band Member",
    functionalTrack: "REPERTOIRE",
    priorityTier: "P3",
    acceptanceCriteria:
      "ChordPro and inline text editing for chords above lyrics.",
    isCompleted: true,
    sortOrder: 3,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  // Phase 1 - Milestone 2
  {
    id: "cap-1-4",
    milestoneId: "ms-1-rehearsal",
    title: "Multi-Voice Vocal & Instrument Assignments",
    targetPersona: "Vocalist",
    functionalTrack: "REHEARSAL",
    priorityTier: "P1",
    acceptanceCriteria:
      "Assign vocal harmonies and instrument parts per song with notes.",
    isCompleted: true,
    sortOrder: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cap-1-5",
    milestoneId: "ms-1-rehearsal",
    title: "Practice Status Tracking & Readiness Indicator",
    targetPersona: "Worship Leader",
    functionalTrack: "REHEARSAL",
    priorityTier: "P2",
    acceptanceCriteria:
      "Volunteers track preparation status: Pending, Practicing, or Ready.",
    isCompleted: true,
    sortOrder: 2,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cap-1-6",
    milestoneId: "ms-1-rehearsal",
    title: "YouTube Video Playback & Timestamp Section Sync",
    targetPersona: "Musician",
    functionalTrack: "REHEARSAL",
    priorityTier: "P2",
    acceptanceCriteria:
      "Loop and jump between marked verse, chorus, and bridge sections in sync with video.",
    isCompleted: true,
    sortOrder: 3,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  // Phase 2 - Milestone 1
  {
    id: "cap-2-1",
    milestoneId: "ms-2-setlists",
    title: "Drag-and-Drop Song Ordering in Setlists",
    targetPersona: "Worship Leader",
    functionalTrack: "PLANNING",
    priorityTier: "P1",
    acceptanceCriteria:
      "Leaders can order songs for a specific service date with instant duration totals.",
    isCompleted: false,
    sortOrder: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cap-2-2",
    milestoneId: "ms-2-setlists",
    title: "Key Transition & BPM Flow Guidance",
    targetPersona: "Music Director",
    functionalTrack: "PLANNING",
    priorityTier: "P2",
    acceptanceCriteria:
      "Visual harmonic wheel indicators warning of jarring vocal key leaps between consecutive songs.",
    isCompleted: false,
    sortOrder: 2,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cap-2-3",
    milestoneId: "ms-2-setlists",
    title: "Service Duration & Item Timing Calculator",
    targetPersona: "Service Coordinator",
    functionalTrack: "PLANNING",
    priorityTier: "P2",
    acceptanceCriteria:
      "Calculates total planned service length dynamically as items are rearranged.",
    isCompleted: false,
    sortOrder: 3,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  // Phase 2 - Milestone 2
  {
    id: "cap-2-4",
    milestoneId: "ms-2-order-of-service",
    title: "Custom Liturgical & Non-Musical Service Items",
    targetPersona: "Pastor",
    functionalTrack: "PLANNING",
    priorityTier: "P1",
    acceptanceCriteria:
      "Add prayers, scripture readings, sermon notes, and welcomes into setlists.",
    isCompleted: false,
    sortOrder: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cap-2-5",
    milestoneId: "ms-2-order-of-service",
    title: "Reusable Service Order Templates",
    targetPersona: "Worship Leader",
    functionalTrack: "PLANNING",
    priorityTier: "P2",
    acceptanceCriteria:
      "Save recurring liturgical sequences as templates for future weeks.",
    isCompleted: false,
    sortOrder: 2,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cap-2-6",
    milestoneId: "ms-2-order-of-service",
    title: "Leader Service Notes & Pastoral Cues",
    targetPersona: "Pastor",
    functionalTrack: "PLANNING",
    priorityTier: "P3",
    acceptanceCriteria:
      "Private coordinator notes for transitioning between service elements.",
    isCompleted: false,
    sortOrder: 3,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  // Phase 3 - Milestone 1
  {
    id: "cap-3-1",
    milestoneId: "ms-3-scheduling",
    title: "Volunteer Position Rostering & Scheduling",
    targetPersona: "Worship Coordinator",
    functionalTrack: "ROSTERING",
    priorityTier: "P1",
    acceptanceCriteria:
      "Assign band, vocal, and technical team members to upcoming service dates.",
    isCompleted: false,
    sortOrder: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cap-3-2",
    milestoneId: "ms-3-scheduling",
    title: "Team Invitation & Email Confirmation Flow",
    targetPersona: "Volunteer",
    functionalTrack: "ROSTERING",
    priorityTier: "P2",
    acceptanceCriteria:
      "Automated invitation dispatch with one-click accept/decline links.",
    isCompleted: false,
    sortOrder: 2,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cap-3-3",
    milestoneId: "ms-3-scheduling",
    title: "Ministry Position Coverage Matrix",
    targetPersona: "Worship Leader",
    functionalTrack: "ROSTERING",
    priorityTier: "P2",
    acceptanceCriteria:
      "Real-time dashboard highlighting unfilled instrumental or tech slots.",
    isCompleted: false,
    sortOrder: 3,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  // Phase 3 - Milestone 2
  {
    id: "cap-3-4",
    milestoneId: "ms-3-availability",
    title: "Volunteer Block-out Dates Management",
    targetPersona: "Volunteer",
    functionalTrack: "ROSTERING",
    priorityTier: "P1",
    acceptanceCriteria:
      "Team members specify dates they are unavailable for scheduling.",
    isCompleted: false,
    sortOrder: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cap-3-5",
    milestoneId: "ms-3-availability",
    title: "Scheduling Conflict Detection",
    targetPersona: "Worship Coordinator",
    functionalTrack: "ROSTERING",
    priorityTier: "P2",
    acceptanceCriteria:
      "Warnings when volunteers are double-booked across ministry teams.",
    isCompleted: false,
    sortOrder: 2,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cap-3-6",
    milestoneId: "ms-3-availability",
    title: "Automated Rehearsal & Service Reminders",
    targetPersona: "Volunteer",
    functionalTrack: "ROSTERING",
    priorityTier: "P3",
    acceptanceCriteria:
      "Timed email and push notifications 48h and 2h prior to rehearsal call.",
    isCompleted: false,
    sortOrder: 3,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  // Phase 4 - Milestone 1
  {
    id: "cap-4-1",
    milestoneId: "ms-4-stage-mode",
    title: "High-Contrast Live Teleprompter Stage View",
    targetPersona: "Band Member",
    functionalTrack: "STAGE",
    priorityTier: "P1",
    acceptanceCriteria:
      "Distraction-free dark mode lyrics and chords layout optimized for low-light stages.",
    isCompleted: false,
    sortOrder: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cap-4-2",
    milestoneId: "ms-4-stage-mode",
    title: "Instant Chart Transposition & Capo Display",
    targetPersona: "Musician",
    functionalTrack: "STAGE",
    priorityTier: "P1",
    acceptanceCriteria:
      "On-the-fly transposition between original, capo, and team practice keys.",
    isCompleted: false,
    sortOrder: 2,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cap-4-3",
    milestoneId: "ms-4-stage-mode",
    title: "Hands-Free Bluetooth Pedal Page Navigation",
    targetPersona: "Guitarist",
    functionalTrack: "STAGE",
    priorityTier: "P3",
    acceptanceCriteria:
      "Advance chart sections using standard Bluetooth foot pedals (PageUp/PageDown).",
    isCompleted: false,
    sortOrder: 3,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  // Phase 4 - Milestone 2
  {
    id: "cap-4-4",
    milestoneId: "ms-4-presentation-sync",
    title: "ProPresenter & Presentation Software Slide Export",
    targetPersona: "AV Tech",
    functionalTrack: "STAGE",
    priorityTier: "P2",
    acceptanceCriteria:
      "Export service setlists formatted directly for church projection software.",
    isCompleted: false,
    sortOrder: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cap-4-5",
    milestoneId: "ms-4-presentation-sync",
    title: "Synchronized Live Band Section Cues",
    targetPersona: "Music Director",
    functionalTrack: "STAGE",
    priorityTier: "P2",
    acceptanceCriteria:
      "Broadcast current section (Verse 1, Chorus, Outro) across connected stage tablets.",
    isCompleted: false,
    sortOrder: 2,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cap-4-6",
    milestoneId: "ms-4-presentation-sync",
    title: "Offline PWA Rehearsal Caching",
    targetPersona: "Vocalist",
    functionalTrack: "STAGE",
    priorityTier: "P3",
    acceptanceCriteria:
      "Cache charts and audio for offline use when church Wi-Fi is unreliable.",
    isCompleted: false,
    sortOrder: 3,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export class GetRoadmap {
  constructor(private readonly roadmap: RoadmapRepository) {}

  async execute({
    actor,
    query,
  }: {
    actor: { sub: string; role: string };
    query?: RoadmapFilterInput;
  }): Promise<RoadmapResponseDTO> {
    const filter = query ? roadmapFilterSchema.parse(query) : undefined;

    const [
      allPhases,
      allMilestones,
      allCapabilities,
      allDependencies,
      allFeedback,
    ] = await Promise.all([
      this.roadmap.listPhases(),
      this.roadmap.listMilestones(),
      this.roadmap.listCapabilities(),
      this.roadmap.listDependencies(),
      this.roadmap.listFeedback(),
    ]);

    const milestonesById = new Map<string, Milestone>(
      allMilestones.map((m) => [m.id, m]),
    );

    const phasesToRender =
      filter?.phase !== undefined
        ? allPhases.filter((p) => p.phaseNumber === filter.phase)
        : allPhases;

    const phases: RoadmapPhaseDTO[] = phasesToRender.map((phase) => {
      const phaseMilestones = allMilestones.filter(
        (m) => m.phaseId === phase.id,
      );
      const phaseMilestoneIds = new Set(phaseMilestones.map((m) => m.id));
      const phaseCapabilities = allCapabilities.filter((c) =>
        phaseMilestoneIds.has(c.milestoneId),
      );

      const completionPercentage = computePhaseProgress(
        phaseMilestones,
        phaseCapabilities,
      );

      const milestones: RoadmapMilestoneDTO[] = phaseMilestones.map(
        (milestone) => {
          const deps = allDependencies.filter(
            (d) => d.dependentMilestoneId === milestone.id,
          );
          const prerequisites: RoadmapPrerequisiteDTO[] = deps.map((dep) => {
            const prereq = milestonesById.get(dep.prerequisiteMilestoneId);
            return {
              prerequisiteMilestoneId: dep.prerequisiteMilestoneId,
              isBlocking: dep.isBlocking,
              prerequisiteTitle: prereq
                ? prereq.title
                : dep.prerequisiteMilestoneId,
              isSatisfied: prereq?.status === "COMPLETED",
            };
          });

          let capabilitiesForMilestone = allCapabilities.filter(
            (c) => c.milestoneId === milestone.id,
          );

          if (filter?.track) {
            capabilitiesForMilestone = capabilitiesForMilestone.filter(
              (c) => c.functionalTrack === filter.track,
            );
          }
          if (filter?.priority) {
            capabilitiesForMilestone = capabilitiesForMilestone.filter(
              (c) => c.priorityTier === filter.priority,
            );
          }

          const capabilities: RoadmapCapabilityDTO[] =
            capabilitiesForMilestone.map((cap) => {
              const capFeedback = allFeedback.filter(
                (f) => f.capabilityId === cap.id,
              );
              const interestCount = capFeedback.filter(
                (f) => f.hasInterest,
              ).length;
              const userVote = capFeedback.find((f) => f.userId === actor.sub);

              return {
                id: cap.id,
                milestoneId: cap.milestoneId,
                title: cap.title,
                targetPersona: cap.targetPersona,
                functionalTrack: cap.functionalTrack,
                priorityTier: cap.priorityTier,
                acceptanceCriteria: cap.acceptanceCriteria,
                isCompleted: cap.isCompleted,
                sortOrder: cap.sortOrder,
                interestCount,
                userHasVoted: Boolean(userVote?.hasInterest),
                userNote: userVote ? userVote.note : null,
              };
            });

          return {
            id: milestone.id,
            phaseId: milestone.phaseId,
            title: milestone.title,
            description: milestone.description,
            status: milestone.status,
            sortOrder: milestone.sortOrder,
            targetCompletionDate: milestone.targetCompletionDate,
            releaseNotes: milestone.releaseNotes,
            capabilities,
            prerequisites,
          };
        },
      );

      return {
        id: phase.id,
        phaseNumber: phase.phaseNumber,
        name: phase.name,
        description: phase.description,
        status: phase.status,
        targetHorizon: phase.targetHorizon,
        completionPercentage,
        milestones,
      };
    });

    const totalPhases = allPhases.length;
    const totalMilestones = allMilestones.length;
    const completedMilestones = allMilestones.filter(
      (m) => m.status === "COMPLETED",
    ).length;
    const totalCapabilities = allCapabilities.length;
    const completedCapabilities = allCapabilities.filter(
      (c) => c.isCompleted,
    ).length;
    const overallProgress =
      totalCapabilities > 0
        ? Math.round((completedCapabilities / totalCapabilities) * 100)
        : totalMilestones > 0
          ? Math.round((completedMilestones / totalMilestones) * 100)
          : 0;

    const summary: RoadmapSummaryDTO = {
      totalPhases,
      totalMilestones,
      completedMilestones,
      totalCapabilities,
      completedCapabilities,
      overallProgress,
    };

    return {
      phases,
      summary,
    };
  }
}

export class UpdateMilestoneStatus {
  constructor(private readonly roadmap: RoadmapRepository) {}

  async execute({
    actor,
    milestoneId,
    input,
  }: {
    actor: { sub: string; role: string };
    milestoneId: string;
    input: UpdateMilestoneStatusInput;
  }): Promise<UpdateMilestoneStatusResponseDTO> {
    if (actor.role !== "ADMIN") {
      throw new ForbiddenError(
        "Only administrators can update milestone status.",
      );
    }

    const parsed = updateMilestoneStatusSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues[0]?.message ?? "Invalid milestone status input",
      );
    }
    const validated = parsed.data;

    const milestone = await this.roadmap.getMilestone(milestoneId);
    if (!milestone) {
      throw new NotFoundError(`Milestone not found: ${milestoneId}`);
    }

    if (validated.status === "COMPLETED") {
      const dependencies = await this.roadmap.listDependencies(milestoneId);
      const allMilestones = await this.roadmap.listMilestones();
      const milestonesById = new Map<string, Milestone>(
        allMilestones.map((m) => [m.id, m]),
      );

      const { allowed, unmetPrerequisiteIds } = canMilestoneComplete(
        milestoneId,
        dependencies,
        milestonesById,
      );

      if (!allowed) {
        throw new ValidationError(
          "Cannot mark milestone completed. Prerequisite milestone is not completed.",
          unmetPrerequisiteIds,
        );
      }
    }

    const updatedMilestone = await this.roadmap.updateMilestoneStatus(
      milestoneId,
      validated.status,
      validated.releaseNotes,
    );

    const phaseMilestones = await this.roadmap.listMilestones(
      milestone.phaseId,
    );
    const allCompleted =
      phaseMilestones.length > 0 &&
      phaseMilestones.every((m) =>
        m.id === updatedMilestone.id
          ? updatedMilestone.status === "COMPLETED"
          : m.status === "COMPLETED",
      );

    let phaseStatusUpdated = false;
    if (allCompleted) {
      const phase = await this.roadmap.getPhase(milestone.phaseId);
      if (phase && phase.status !== "COMPLETED") {
        await this.roadmap.updatePhaseStatus(phase.id, "COMPLETED");
        phaseStatusUpdated = true;
      }
    }

    return {
      milestone: {
        id: updatedMilestone.id,
        status: updatedMilestone.status,
        releaseNotes: updatedMilestone.releaseNotes,
        updatedAt: updatedMilestone.updatedAt,
      },
      phaseStatusUpdated,
    };
  }
}

export class ToggleCapabilityVote {
  constructor(private readonly roadmap: RoadmapRepository) {}

  async execute({
    actor,
    capabilityId,
    input,
  }: {
    actor: { sub: string; role: string };
    capabilityId: string;
    input: ToggleVoteInput;
  }): Promise<ToggleVoteResponseDTO> {
    const parsed = toggleVoteSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues[0]?.message ?? "Invalid vote input",
      );
    }
    const validated = parsed.data;

    const capability = await this.roadmap.getCapability(capabilityId);
    if (!capability) {
      throw new NotFoundError(`Capability not found: ${capabilityId}`);
    }

    const result = await this.roadmap.toggleVote(
      capabilityId,
      actor.sub,
      validated.hasInterest,
      validated.note ?? null,
    );

    return {
      capabilityId,
      hasInterest: validated.hasInterest,
      note: result.feedback.note,
      newTotalInterestCount: result.totalInterestCount,
    };
  }
}

export class SeedRoadmap {
  constructor(private readonly roadmap: RoadmapRepository) {}

  async execute(): Promise<void> {
    if (await this.roadmap.isSeeded()) {
      return;
    }

    await this.roadmap.seedBaseline({
      phases: CANONICAL_PHASES,
      milestones: CANONICAL_MILESTONES,
      capabilities: CANONICAL_CAPABILITIES,
      dependencies: CANONICAL_DEPENDENCIES,
    });
  }
}
