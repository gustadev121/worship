# API Contracts: WorshipFlow Product Roadmap

**Feature**: WorshipFlow Product Roadmap (Milestones, Priorities, and Dependency Phases)  
**Branch**: `001-product-roadmap`  
**Date**: 2026-11-10

This document specifies the HTTP endpoints, authorization rules, request payloads, response schemas, and error responses for the WorshipFlow Product Roadmap.

---

## 1. `GET /api/roadmap`

Retrieve the full roadmap hierarchy including phases, milestones, capabilities, progress statistics, and the current user's vote state.

### Authorization

- Authenticated user (`ADMIN` or `MEMBER`).

### Query Parameters

- `track` (optional, string): Filter capabilities by `FunctionalTrack` (`REPERTOIRE`, `PLANNING`, `ROSTERING`, `REHEARSAL`, `STAGE`).
- `priority` (optional, string): Filter capabilities by `PriorityTier` (`P1`, `P2`, `P3`, `P4`).
- `phase` (optional, number): Filter by phase number (1, 2, 3, or 4).

### Success Response (`200 OK`)

```json
{
  "phases": [
    {
      "id": "phase-1-foundation",
      "phaseNumber": 1,
      "name": "Repertoire & Rehearsal Foundation",
      "description": "Core song catalog, multi-part vocal/instrument practice matrix, and rehearsal player.",
      "status": "COMPLETED",
      "targetHorizon": "Delivered (v0.1)",
      "completionPercentage": 100,
      "milestones": [
        {
          "id": "ms-1-repertoire",
          "phaseId": "phase-1-foundation",
          "title": "Song Repertoire & Arrangement Catalog",
          "description": "Central catalog storing lyrics, chords, canonical keys, BPM, and tags.",
          "status": "COMPLETED",
          "sortOrder": 1,
          "targetCompletionDate": "2026-10-26",
          "releaseNotes": "Shipped in initial v0.1 release.",
          "capabilities": [
            {
              "id": "cap-1-1",
              "milestoneId": "ms-1-repertoire",
              "title": "Song Catalog CRUD with Canonical Keys",
              "targetPersona": "Worship Leader",
              "functionalTrack": "REPERTOIRE",
              "priorityTier": "P1",
              "acceptanceCriteria": "Songs can be created with 24 canonical keys, BPM, time signature, and chord charts.",
              "isCompleted": true,
              "sortOrder": 1,
              "interestCount": 14,
              "userHasVoted": false,
              "userNote": null
            }
          ],
          "prerequisites": []
        }
      ]
    },
    {
      "id": "phase-2-planning",
      "phaseNumber": 2,
      "name": "Service Planning & Setlist Management",
      "description": "Order of service creation, song ordering, arrangement notes, and duration calculation.",
      "status": "IN_PROGRESS",
      "targetHorizon": "Q1 2027",
      "completionPercentage": 25,
      "milestones": [
        {
          "id": "ms-2-setlists",
          "phaseId": "phase-2-planning",
          "title": "Setlist Sequencing & Service Timing",
          "description": "Drag-and-drop song arrangement order and total runtime tracking.",
          "status": "IN_PROGRESS",
          "sortOrder": 1,
          "targetCompletionDate": "2027-02-15",
          "releaseNotes": null,
          "capabilities": [
            {
              "id": "cap-2-1",
              "milestoneId": "ms-2-setlists",
              "title": "Drag-and-Drop Song Ordering in Setlists",
              "targetPersona": "Worship Leader",
              "functionalTrack": "PLANNING",
              "priorityTier": "P1",
              "acceptanceCriteria": "Leaders can order songs for a specific service date with instant duration totals.",
              "isCompleted": false,
              "sortOrder": 1,
              "interestCount": 28,
              "userHasVoted": true,
              "userNote": "Needed for Sunday morning transitions"
            }
          ],
          "prerequisites": [
            {
              "prerequisiteMilestoneId": "ms-1-repertoire",
              "isBlocking": true,
              "prerequisiteTitle": "Song Repertoire & Arrangement Catalog",
              "isSatisfied": true
            }
          ]
        }
      ]
    }
  ],
  "summary": {
    "totalPhases": 4,
    "totalMilestones": 8,
    "completedMilestones": 2,
    "totalCapabilities": 24,
    "completedCapabilities": 6,
    "overallProgress": 25
  }
}
```

---

## 2. `PATCH /api/roadmap/milestones/:id/status`

Update the status of a roadmap milestone. Validates that all upstream blocking prerequisites are satisfied before allowing transition to `COMPLETED`.

### Authorization

- Restricted to `ADMIN` role.

### Request Headers

- `Content-Type: application/json`

### Request Body

```json
{
  "status": "COMPLETED",
  "releaseNotes": "Shipped setlist drag-and-drop feature verified across browser tests."
}
```

### Response Codes

#### `200 OK`

```json
{
  "milestone": {
    "id": "ms-2-setlists",
    "status": "COMPLETED",
    "releaseNotes": "Shipped setlist drag-and-drop feature verified across browser tests.",
    "updatedAt": "2026-11-10T14:30:00.000Z"
  },
  "phaseStatusUpdated": false
}
```

#### `400 Bad Request` (Prerequisite Blocking Violation)

Returned when attempting to mark a milestone `COMPLETED` when an upstream blocking milestone is not completed.
```json
{
  "error": {
    "code": "PREREQUISITE_NOT_SATISFIED",
    "message": "Cannot mark milestone completed. Prerequisite milestone 'ms-1-repertoire' is not completed.",
    "unmetPrerequisites": ["ms-1-repertoire"]
  }
}
```

#### `403 Forbidden`

Returned when a non-admin user attempts the action.
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Only administrators can update milestone status."
  }
}
```

#### `404 Not Found`

Returned if `id` does not match an existing milestone.

---

## 3. `POST /api/roadmap/capabilities/:id/vote`

Toggle the authenticated volunteer's interest vote on an upcoming capability and optionally attach or update a short feedback note.

### Authorization

- Authenticated user (`ADMIN` or `MEMBER`).

### Request Headers

- `Content-Type: application/json`

### Request Body

```json
{
  "hasInterest": true,
  "note": "We struggle with key transitions between songs — this would help our band immensely."
}
```

### Validation Rules

- `hasInterest`: boolean, required.
- `note`: optional string, trimmed, maximum 280 characters.

### Response Codes

#### `200 OK`

```json
{
  "capabilityId": "cap-2-1",
  "hasInterest": true,
  "note": "We struggle with key transitions between songs — this would help our band immensely.",
  "newTotalInterestCount": 29
}
```

#### `400 Bad Request`

Returned if `note` exceeds 280 characters.
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Feedback note must not exceed 280 characters."
  }
}
```

#### `401 Unauthorized`

Returned if caller is unauthenticated.
