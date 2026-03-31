---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain-skipped, step-06-innovation-skipped, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete, step-e-01-discovery, step-e-02-review, step-e-03-edit]
workflowComplete: true
completedAt: '2026-03-29'
lastEdited: '2026-03-30'
editHistory:
  - date: '2026-03-30'
    changes: 'Tape edit/delete FRs; security/reliability; PRD validation report; FR32 delete confirmation (UX safety, not auth).'
inputDocuments:
  - _bmad-output/brainstorming/brainstorming-session-2026-03-29-1930.md
workflowType: 'prd'
workflow: 'edit'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 0
classification:
  projectType: web_app
  domain: Social / Consumer Entertainment
  complexity: low
  projectContext: greenfield
  notes: Dynamic SPA with real-time preview and link-based sharing. Dual user flows - Creator (homepage entry) and Contributor (shared link entry). Scenario link grants view/add/edit/delete (open model in MVP).
---

# Product Requirements Document — Caution Tape Generator

**Author:** Melissa
**Date:** 2026-03-29

## Executive Summary

The Caution Tape Generator is a personal web tool for creating, collecting, and sharing absurdist fake caution tape warnings. Built for casual social use — primarily around in-person sessions with friends — it solves a simple problem: funny riffing sessions are ephemeral. The product gives them a persistent home.

The core mechanic is deliberately narrow: a user types any text, and the tool renders it as a realistic-looking caution tape image in the format **CAUTION: [text]**. Warnings are grouped into user-created *scenarios* (thematic collections). Anyone with a scenario link can view, add, edit, or delete tapes in that scenario. No accounts, no friction.

The intended audience is the creator and a small, known circle of friends — not the general public. The product is not designed for discoverability, virality, or moderation at scale.

### What Makes This Special

The entire product is built on a single joke executed with total commitment: **the more seriously the tape looks, the funnier the absurd content becomes.** The format — bold industrial typography, diagonal stripes, repeating pattern — does not wink at the viewer. That seriousness is the punchline.

This design philosophy extends to the creation experience: a dead-simple homepage, instant live preview as you type, and an output that looks genuinely official. The product never breaks the bit.

The second differentiator is persistence without ceremony. In-person humor disappears. This tool captures it with zero onboarding, zero accounts, and zero friction — share a link, friends add tapes, come back later and it's all still there.

## Project Classification

- **Project Type:** Web App — dynamic SPA with real-time tape preview and link-based scenario sharing
- **Domain:** Social / Consumer Entertainment
- **Complexity:** Low — no regulated data, no authentication, no financial transactions
- **Project Context:** Greenfield
- **User Flows:** Two distinct entry points — Creator (homepage, starts a new scenario) and Contributor (shared link, drops into an existing scenario)

## Success Criteria

### User Success

The product succeeds when it's a fun, frictionless game to play with friends in the same room. The primary success moment: someone pulls out the app during dinner or drinks, creates a scenario, passes the phone around, and the group spends time adding absurd warnings and laughing at what others wrote. The experience requires zero explanation — the mechanic is self-evident from the interface.

Secondary success: returning to a scenario from a past session and picking up where you left off — the jokes are still there, new ones can be added.

### Business Success

Personal project with no commercial goals. Success is personal utility — the app gets used in real social situations and does exactly what it's supposed to do without friction or embarrassment.

### Technical Success

- Tape renders correctly and looks genuinely official (the visual quality is the product)
- Real-time preview works smoothly as you type
- Scenarios persist reliably — nothing gets lost
- Shareable links work instantly on any device without an account
- App loads fast enough not to kill the moment when pulled out in front of people

### Measurable Outcomes

- Used in a real social setting at least once
- The tape visual passes the "looks legit" test with friends
- No one needs to ask "wait, how does this work?" to start playing

## Product Scope

### MVP — Minimum Viable Product

**MVP Approach:** Experience MVP — nail the tape visual first. If the tape doesn't look right, nothing else matters. Prototype the visual before building any other feature.

**Core User Journeys Supported:** All three — Instigator, Contributor, Returning Player.

**Must-Have Capabilities:**
- Tape visual: diagonal stripes, bold industrial all-caps typography, repeating text, length scales with text
- Real-time tape preview as user types
- Full-spectrum color picker (HSL wheel)
- Dead simple homepage — just "CAUTION:" and a blinking cursor
- Scenario creation and naming
- Scenario library home screen — grid of cards with name + tape count
- Tape stack view inside scenario — vertical scroll, pinned ADD button
- Anonymous — no accounts, no names
- Persistent — scenarios and tapes saved permanently
- Shareable URL per scenario — anyone with the link can view, add, edit, and delete tapes (no per-user ownership in MVP)
- Mobile-responsive layout

**Resources:** Solo developer with AI assistance (BMAD workflow). Tape rendering approach (CSS/Canvas/SVG) to be determined in architecture phase.

### Growth Features (Post-MVP)

- AI color suggestion — contextually funny color based on tape text
- Scenario status labels — auto-generated from tape count ("Under Investigation" → "Active Incident" → "Total Containment Failure")
- Reaction set: 👀 Noted / 🏃 Already Running / 💀 Too Late / 🫡 Acknowledged / 🤌 Valid

### Vision (Future)

- Slight wrinkle/crinkle texture on tape for physical realism
- One-tap tape image export (save/copy, zero friction)
- Most-reacted tape surfaces to top of scenario

## User Journeys

### Journey 1: The Instigator — Starting a Game at the Table

*Melissa is at dinner with two friends. Someone makes an absurd comment about a mutual acquaintance. The table erupts. She pulls out her phone.*

She navigates to the app — the homepage is exactly what she expected: "CAUTION:" and a blinking cursor. No loading state, no tutorial, no login prompt. She types "DAVE" — the tape renders instantly, repeating across the full width, diagonal stripes and all. It looks completely official and completely insane. The table leans in.

She realizes this should be a scenario, not a one-off. She names it "Dave's apartment" and the scenario is created. She shares the link in the group chat — her friends open it on their own phones and start adding tapes immediately. No one asks how it works.

By the end of the night there are eleven tapes. She closes the app. The scenario is still there.

**Capabilities revealed:** Homepage tape creator, live preview, scenario creation, shareable link generation, mobile-responsive layout.

---

### Journey 2: The Contributor — Receiving the Link Cold

*Marcus gets a link in the group chat. He opens it on his phone and lands directly inside a scenario called "Dave's apartment."*

He sees a vertical stack of caution tapes. He reads them top to bottom, laughing. There's a pinned button at the bottom: **+ ADD TAPE**. He taps it. A creation screen opens — "CAUTION:" and a cursor, same as the homepage. He picks a color (something bile yellow), types "PASSIVE AGGRESSIVE STICKY NOTES," and hits generate. The tape appears at the top of the stack.

He didn't create an account. He didn't choose a scenario name. He was never shown the homepage. He was just in.

He notices a typo on a tape he added — he edits it in place. Someone else's joke is too spicy for the thread — they delete it. Same rules for everyone: link access is all you need.

**Capabilities revealed:** Scenario view (link entry point), tape stack display, pinned ADD button, tape creator accessible from within scenario, color picker, tape persistence after creation, edit and delete for any tape in the scenario.

---

### Journey 3: The Returning Player — Picking Up Where You Left Off

*Three days after the dinner, Melissa remembers the scenario. She opens the app, sees the scenario library on the home screen — "Dave's apartment · 11 tapes." She taps in.*

The tapes are all there. She reads through them, laughs again, adds two more. She creates a new scenario for a different bit that's been running in a different friend group. She shares that link in a separate chat.

At no point does she need to log in, search for her content, or remember a username.

**Capabilities revealed:** Scenario library home screen, scenario cards with tape count, multiple scenarios, persistent storage, scenario re-entry without authentication.

---

### Journey Requirements Summary

| Capability | Revealed By |
|---|---|
| Live tape preview (real-time as you type) | Journey 1 |
| Homepage as standalone tape creator | Journey 1 |
| Scenario creation from homepage | Journey 1 |
| Shareable link per scenario | Journey 1 |
| Mobile-responsive layout | Journeys 1 & 2 |
| Scenario view as link entry point | Journey 2 |
| Tape stack display (vertical scroll) | Journey 2 |
| Pinned ADD button inside scenario | Journey 2 |
| Color picker on tape creator | Journey 2 |
| Tape persistence after creation | Journeys 2 & 3 |
| Scenario library home screen | Journey 3 |
| Scenario cards (name + tape count) | Journey 3 |
| Multiple scenarios per creator | Journey 3 |
| No authentication required anywhere | All journeys |
| Edit tape (text and/or color) from scenario view | Journey 2 |
| Delete tape from scenario view | Journey 2 |
| Edit/delete require only scenario link access (same as add) | Journey 2 |
| Delete confirmation before permanent removal | Journey 2 |

## Web App Specific Requirements

### Application Model

Single-page application (SPA) — all state transitions happen client-side without full page reloads. The tape creator, scenario view, and home screen are rendered dynamically. No server-side rendering or SEO optimization required.

### Backend Requirement

Dynamic web app with persistent storage — scenarios and tapes must survive sessions. URL slug generation required for shareable scenario links. Slugs must be non-guessable (not sequential IDs).

### Browser Matrix

| Browser | Support Level |
|---|---|
| Mobile Safari (iOS) | Required |
| Chrome for Android | Required |
| Chrome (desktop) | Required |
| Firefox (desktop) | Best effort |
| Safari (desktop) | Best effort |
| IE / Legacy browsers | Not supported |

### Responsive Design

- Mobile-first — primary use case is phones passed around a table
- Tape creator and scenario view fully functional on small screens
- Scenario library adapts from single-column (mobile) to grid (desktop)
- Touch targets sized for in-the-moment use — no fiddly interactions
- Color picker (HSL wheel) must work correctly on mobile touch interfaces

## Functional Requirements

### Tape Creation & Preview

- **FR1:** Users can type text into a tape creator and see a live tape preview update in real time as they type
- **FR2:** Users can confirm a tape to add it to a scenario
- **FR3:** Users can select a tape color using a full-spectrum color picker before confirming
- **FR4:** The system renders tape text in a continuous repeating pattern (e.g. CAUTION: [text] ⚠ CAUTION: [text] ⚠)
- **FR5:** The system scales the tape's rendered length proportionally to the character length of the input text

### Tape Visual Rendering

- **FR6:** The system displays all tapes with a diagonal stripe pattern
- **FR7:** The system displays tape text in bold, industrial all-caps typography
- **FR8:** The system applies the user's selected color to the tape's visual appearance

### Scenario Management

- **FR9:** Users can create a new named scenario
- **FR10:** Users can view all tapes in a scenario as a vertically scrollable list
- **FR11:** Users can access the tape creator from within a scenario view
- **FR12:** Users can add a tape to a scenario from within that scenario's view
- **FR13:** The system displays the total tape count for each scenario
- **FR14:** Users can navigate back to the scenario library from any scenario view

### Scenario Library

- **FR15:** Users can view all scenarios on the home screen
- **FR16:** The system displays each scenario as a card showing its name and tape count — the count is a provocation to click, not just information ("11 tapes about Dave's apartment?? I have to see this")
- **FR17:** Users can navigate to a specific scenario from the library
- **FR18:** Users can initiate creation of a new scenario from the home screen

### Sharing & Anonymous Access

- **FR19:** The system generates a unique shareable URL for each scenario
- **FR20:** Users can access a scenario via its shareable URL without creating an account
- **FR21:** Users can add tapes to any scenario they access via a shareable URL
- **FR22:** The system does not require authentication for any action anywhere in the app

### Tape Editing & Deletion

- **FR29:** Users can edit an existing tape from the scenario view (including changing text and/or color) and see the updated tape in the stack immediately after saving
- **FR30:** Users can delete a tape from a scenario; the tape is removed for everyone with access to that scenario
- **FR31:** Edit and delete are available to anyone who can open the scenario via its shareable URL — the same anonymous, link-based access model as viewing and adding tapes (no per-tape owner or role in MVP)
- **FR32:** Before a tape is permanently deleted, the system requires an explicit confirmation step (e.g. modal or bottom sheet). Confirmation reduces accidental loss; it is not authentication and does not restrict who may delete (still anyone with the scenario link)

### Persistence

- **FR23:** The system permanently stores all scenarios and their tapes
- **FR24:** Users can return to a scenario at any future time and find all tapes intact
- **FR25:** Tapes added by any user via a shared link are persisted to the scenario immediately

### Layout & Navigation

- **FR26:** The system presents a fully functional, mobile-responsive layout across all views
- **FR27:** The homepage prominently presents the tape creator as the primary element
- **FR28:** The ADD button remains pinned and visible while scrolling through a scenario's tape stack

## Non-Functional Requirements

### Usability

- Destructive actions use confirmation (see FR32) so a stray tap does not remove a tape; keep copy short and in voice with the rest of the app

### Performance

- Tape preview renders in real time as the user types — perceptible lag between keystroke and visual update is a defect
- App loads and is interactive within 2 seconds on a standard mobile connection
- Shared scenario link opens and displays existing tapes within 2 seconds on mobile
- Color picker responds to touch input without delay

### Security

- No personally identifiable information is collected or stored — users are fully anonymous
- Scenario URLs use non-guessable slugs (not sequential IDs) to prevent casual enumeration
- No authentication credentials, payment data, or sensitive user data is handled at any point
- **Link access = full edit/delete:** Anyone who holds a scenario URL can edit or delete any tape in that scenario. There is no per-tape author, audit trail, or permission tier in MVP. This matches the low-trust, friends-in-the-room use case; the product is not designed to prevent abuse by someone who has the link.
- **Future tightening:** If requirements change (e.g. only original creator can edit/delete, or time-limited editing, or soft-delete/undo), the product must revisit authentication, ownership metadata, or confirmation flows — not assumed for MVP.

### Reliability

- Scenarios and tapes are never lost — persistence is the core product promise
- A confirmed tape is immediately saved and visible to anyone with the scenario link
- Edits and deletes take effect immediately for everyone with the scenario link; a failed edit or delete must not leave the UI and stored state inconsistent
- The app handles poor mobile connections gracefully — a failed tape submission must not result in data loss
