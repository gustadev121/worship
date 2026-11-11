# Feature Specification: Rehearsal Live Playback Synchronization & Active Section Tracking

**Feature Branch**: `003-rehearsal-live-sync`

**Created**: 2026-11-11

**Status**: Draft

**Input**: User description: "Sincronización en tiempo real del reproductor de ensayo: sondeo de tiempo de reproducción de YouTube, iluminación reactiva de la sección activa (verso, coro, puente) y auto-scroll suave hacia la sección en reproducción"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Real-Time Section Detection & Highlighting (Priority: P1)

When a musician or vocalist is rehearsing with reference video/audio playback, the rehearsal studio continuously identifies which musical section (e.g., Intro, Verse 1, Chorus, Bridge, Outro) is currently playing based on defined section timestamps. The chord sheet visually emphasizes and highlights the active section so the performer instantly recognizes their place in the song arrangement at a glance.

**Why this priority**: Core value of live synchronization. Eliminates disorientation during rehearsal, enabling performers to follow complex vocal arrangements and chord shifts in real time.

**Independent Test**: Can be tested by starting playback on a song with configured section timestamps; as playback crosses a timestamp threshold (e.g., crossing from 0:00 Verse into 0:45 Chorus), the active visual highlight transitions immediately to the corresponding section without user clicks.

**Acceptance Scenarios**:

1. **Given** a song with timestamps for Verse (0:00) and Chorus (0:45), **When** playback reaches 0:45, **Then** the Verse highlight deactivates and the Chorus section receives the prominent active visual highlight.
2. **Given** media playback is paused, **When** the user resumes playback at second 1:15 within the Chorus range (0:45 to 1:30), **Then** Chorus remains visibly highlighted as the active section.
3. **Given** an A-B loop is active repeating Chorus (0:45 to 1:15), **When** the playback loops back from 1:15 to 0:45, **Then** the active highlight remains on Chorus across loop iterations.

---

### User Story 2 - Smooth Automatic Follow-Scroll to Active Section (Priority: P2)

As playback progresses across sections (e.g., from Verse 1 near the top of the sheet to Chorus further down), the rehearsal sheet viewport smoothly scrolls to keep the active section centered or comfortably visible in the upper half of the display. Musicians with hands occupied on instruments (guitars, keyboards, drums) do not need to touch the screen to see upcoming lyrics and chords.

**Why this priority**: Hands-free operation is vital for instrumentalists and vocalists reading chord charts from stands during rehearsal.

**Independent Test**: Can be tested on long chord charts exceeding the screen height; as playback transitions to a section previously scrolled off-screen, the container executes a smooth scroll bringing the active section header and first lines into viewport visibility.

**Acceptance Scenarios**:

1. **Given** the user is viewing Verse 1 and Chorus is positioned below the visible fold, **When** playback reaches the Chorus timestamp, **Then** the view smoothly scrolls downward to reveal the Chorus section.
2. **Given** the performer is in Fullscreen Stage Mode, **When** an automated section transition occurs, **Then** the auto-scroll executes without layout shifting or interrupting ongoing audio playback.
3. **Given** the user has toggled auto-scroll disabled, **When** section transitions occur, **Then** the visual highlight updates but viewport auto-scrolling is suppressed.

---

### User Story 3 - Interactive Seeking & Non-Intrusive Manual Override (Priority: P3)

When a rehearsal director or musician manually jumps to a specific section (by clicking a section badge or timestamp button) or manually scrubs the media timeline, the system synchronizes both directions: the media seeks to the target timestamp, the active section highlight updates immediately, and the view centers on that section. If a musician manually scrolls to inspect an upcoming section while audio continues playing, the system temporarily suspends auto-scroll so the user's manual position is respected, resuming automatic follow-scrolling after an inactivity timeout or upon section change.

**Why this priority**: Rehearsal involves stopping, jumping to difficult bridges, and previewing upcoming parts. The synchronization engine must never fight the user's manual intent.

**Independent Test**: Can be tested by manually scrolling the chord sheet away from the playing section; verify that auto-scroll does not yank the screen back immediately, but resumes smooth following upon the next section transition or after user gesture stops.

**Acceptance Scenarios**:

1. **Given** playback is in Verse 1, **When** the user clicks the "Bridge" timestamp marker, **Then** audio seeks to the Bridge start time, Bridge highlights immediately, and the view scrolls to Bridge.
2. **Given** audio is actively playing in Verse 1, **When** the user manually scrolls downward to inspect the Outro, **Then** automated follow-scroll is temporarily paused for 3 seconds of user inactivity.
3. **Given** audio scrubbed backward past a section boundary, **When** scrub completes, **Then** the previous section highlight activates according to the new playback position.

---

### Edge Cases

- **Songs without timestamps**: If a song has no section timestamps defined, playback operates normally; the sheet displays without section highlights and general continuous auto-scroll remains accessible.
- **Playback before the first timestamp**: If playback position is earlier than the first defined section marker (e.g., an uncataloged instrumental intro), no section is falsely marked as active until the first timestamp is reached.
- **Playback beyond the final timestamp**: When playback progresses past the last section's start time, that final section remains highlighted until playback stops or loops.
- **Repeated section names**: Songs with repeated sections (e.g., Chorus 1 at 0:45 and Chorus 2 at 2:10) uniquely highlight the specific instance corresponding to the current playback time window.
- **Rapid scrubbing / scrubbing while paused**: Scrubbing rapidly through multiple sections must not cause queued scrolling spasms or race conditions; it immediately settles on the section matching the final timestamp.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST continuously determine the current playback time during media playback with a polling frequency of at least 4 updates per second (<= 250ms interval).
- **FR-002**: The system MUST evaluate the active section based on the current playback time matching the range between `startSeconds` of a section and `startSeconds` of the subsequent section (or media end).
- **FR-003**: The system MUST apply a distinct high-contrast visual state to the active section container and its section title header.
- **FR-004**: The system MUST provide an optional "Auto-Follow" toggle in the stage utility controls enabling/disabling automated viewport scrolling to the active section.
- **FR-005**: When Auto-Follow is enabled, the system MUST smoothly scroll the active section into the visible viewport upon each section transition.
- **FR-006**: The system MUST detect user touch or wheel scroll gestures and temporarily suspend Auto-Follow scrolling for a configurable buffer window (default: 3 seconds) to prevent scroll fighting.
- **FR-007**: Clicking any section header or section navigator badge MUST seek the media player to that section's `startSeconds` and set that section as active immediately.
- **FR-008**: When an A-B loop is configured, the system MUST correctly maintain or transition section highlighting when playback automatically restarts from point A.

### Key Entities

- **Song**: The musical arrangement entity containing title, artist, canonical keys, lyrics/chords text, and associated media references.
- **SectionTimestamp**: A defined arrangement marker pairing a section label (e.g., "Verse 1", "Chorus") with a start time in seconds (`startSeconds`) and optional end time (`endSeconds`).
- **PlaybackSyncState**: Transient client state tracking current playback seconds, active section identifier, auto-follow enabled state, and user interaction override flag.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Section transition highlighting occurs within 300 milliseconds of the media playback passing a section timestamp boundary.
- **SC-002**: Auto-follow scrolling centers the new active section in the visible viewport within 600 milliseconds of a section change without visual stuttering.
- **SC-003**: 100% of user touch/scroll gestures successfully suppress automated scroll repositioning without causing page jitter.
- **SC-004**: Zero audio/video playback interruption or stutter is introduced by the synchronization polling loop.

---

## Assumptions

- Reference media playback uses web-accessible media streaming (e.g., YouTube iframe embedded player) providing fractional or integer playback time reporting via standard APIs.
- Chord sheets continue to use ChordPro format where section headers (`{comment: ...}`, `[Verse]`, `[Chorus]`) correspond to the labeled section timestamp markers.
- Rehearsal mode operates primarily in modern tablet and desktop browsers supporting CSS smooth scrolling and high-contrast color scheme tokens.
