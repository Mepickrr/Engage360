# Flow Builder — PRD (Problem-First)

## Table of Contents

1. [What the Prototype Shows](#0-what-the-prototype-shows)
2. [Feature Brief](#1-feature-brief)
3. [The Job](#2-the-job)
4. [Success Metrics](#3-success-metrics)
5. [Who Uses This and When](#4-who-uses-this-and-when)
6. [User Flows](#5-user-flows)
7. [Functional Specification](#6-functional-specification)
8. [States](#7-states)
9. [Edge Cases](#8-edge-cases)
10. [Non-Functional Requirements](#9-non-functional-requirements)
11. [Analytics & Instrumentation](#10-analytics--instrumentation)
12. [Copy](#11-copy)
13. [Dependencies](#12-dependencies)
14. [Out of Scope](#13-out-of-scope)
15. [Open Questions](#14-open-questions)
16. [Decision Log](#15-decision-log)

---

## 0. What the Prototype Shows

**What's built:**
- A canvas where nodes represent steps and edges represent the order of execution
- A trigger wizard that gates entry — marketer must define entry conditions before building
- A node palette with channel and logic node types
- A right panel with Config, AI Dev, and Analytics tabs
- Autosave that fires 1,500ms after any change
- Lifecycle controls (Draft → Active → Paused) in the topbar

**What's incomplete:**
- Test Flow sets status to `test` and shows a toast — no actual execution, no test user, no observable result
- Download Report shows a toast — no file
- Publish has no pre-flight validation — a flow with disconnected nodes can be activated silently
- No undo. No duplicate node. No zoom-to-fit.
- Delete confirmation uses `window.confirm` — native browser dialog, not styled, can be blocked

**What's absent:**
- No signal to the marketer that some nodes are unreachable from the trigger
- No recovery path when autosave fails and the marketer navigates away
- No confirmation on navigate-away with unsaved changes

---

## 1. Feature Brief

A marketer knows exactly what should happen at a given customer moment — who to reach, what to say, in what sequence. Today they cannot act on that knowledge alone. Getting a multi-step, conditional, multi-channel sequence into production requires an engineering handoff, which means delay, translation loss, and no ability to iterate quickly.

The Flow Builder removes the engineering dependency. A marketer with no technical background can define the logic of a journey, sequence the steps, configure the content, and put it live — entirely on their own. What changes in their world: a campaign idea that would have taken a sprint to implement now takes an afternoon. They can test it, adjust it, and own it long-term.

---

## 2. The Job

**The job:** Turn a marketer's mental model of "what should happen to this customer and when" into something that actually runs on real customers — reliably and automatically — without writing code or involving engineering.

Three things that, if missing, make it not worth shipping:

1. **The marketer can trust what they built will actually run.** A sequence that silently does nothing because one step wasn't connected is worse than no automation — it creates false confidence and undetected revenue loss.
2. **The marketer can verify behavior before it reaches real customers.** Publishing broken logic to a live audience is not recoverable in the short term. The ability to test first is not a nice-to-have.
3. **Work is never lost mid-build.** Marketers don't build flows in one sitting. A tool that loses progress when the tab closes will be abandoned after the first incident.

---

## 3. Success Metrics

The goal is not that the builder exists — it is that marketers use it to ship automations they couldn't ship before, and those automations perform.

| Metric | Baseline | Target (90 days) |
|--------|----------|-----------------|
| % of new flows that reach Active within 48h of creation | Unknown — establish at launch | > 50% |
| Flows published per marketer per month | Unknown | +30% vs. pre-launch baseline |
| Builder session abandonment rate (opened, nothing saved) | Unknown | < 20% |
| Support tickets citing "flow didn't send" / disconnected nodes | Baseline TBD | −70% after publish validation ships |
| % of flows tested before first activation | 0 (test not functional) | > 40% within 90 days |
| Autosave API success rate | Unknown | > 99% |

---

## 4. Who Uses This and When

**Persona 1 — Campaign Marketer setting up their first automation**

*Situation:* They've been running one-off blast campaigns. They've identified a customer moment — cart abandonment, post-purchase, inactivity — where a timely message would materially change conversion. They've never built a sequence before.

*Goal:* Get that logic live before the next campaign cycle closes. One session if possible.

*Emotional state:* Motivated but cautious. They'll stop at the first thing that doesn't work the way they expect. If they publish and nothing sends, they won't come back.

*What success looks like:* They built, tested, and published the sequence in under an hour. It fires correctly. They see entries in analytics.

*What failure looks like:* They published a flow with a disconnected node. It ran for two weeks. No messages were sent. They found out by checking metrics.

---

**Persona 2 — CRM Manager modifying a live flow**

*Situation:* A retention flow has been running for months. A new product launch means the copy needs updating and a new branch needs adding for users who've already purchased. The flow is touching real customers right now.

*Goal:* Make the change safely, confirm it saved, and know the live flow reflects the edit.

*Emotional state:* Careful. Anxious. A mistake here costs money and erodes customer trust.

*What success looks like:* They made the edit, saw the save confirm, and can reason with confidence that the live flow is now updated.

*What failure looks like:* They made the edit, navigated away to check something else, and don't know if the change was saved. The live flow might be in an inconsistent state. They have no way to know.

---

**Persona 3 — Growth Marketer building a complex multi-channel sequence**

*Situation:* They're building a 6-step sequence across WhatsApp, Email, and AI Calling with conditional branches for different segments. They've done this before in other tools.

*Goal:* Express the full logic they have in their head — including branching, fallback paths, timing — and publish it without simplifying it to fit the tool's constraints.

*Emotional state:* Confident and ambitious. Frustrated quickly when the tool imposes arbitrary limits.

*What success looks like:* They built exactly the sequence they designed, validated it, and published it without needing to compromise on any branch.

*What failure looks like:* They built 15+ nodes and can't tell which paths are dead ends. They give up and publish a simpler version that they know is underperforming.

---

## 5. User Flows

These flows describe what the user is trying to accomplish, not how the UI works.

### Flow 1: Define who enters the journey

Before placing any steps, the marketer needs to answer two questions: *What event starts this journey?* and *Which users qualify?* Without these answers, every subsequent decision — which channel, what timing, what message — is made without context.

The trigger configuration is the first thing the marketer does when starting a new flow. It is not optional. It can be edited after the journey is built, but it must exist before building begins.

---

### Flow 2: Build the sequence

The marketer has a mental model: step A happens, then step B, but if condition C is true, go to step D instead. They need a workspace where they can express that logic by placing steps, connecting them, and branching where needed.

The marketer should be able to:
- Add any supported step type to the sequence
- Specify the order steps happen in
- Create branches for conditional paths
- Introduce timing between steps
- Remove steps and branches as the design evolves

Building is an iterative, non-linear process. The marketer may rearrange, delete, and rebuild multiple times before settling on the final sequence. The workspace should support this without friction.

---

### Flow 3: Configure each step

Once the sequence structure is set, each step needs content. For a message step, that means which template, which channel, which audience settings. For a logic step, that means the condition that determines which branch a user takes.

The marketer needs to configure each step without navigating away from the workspace. Context switching (open a new page to set up a message, come back) breaks the mental model they're holding while building.

---

### Flow 4: Verify the journey before going live

The marketer has finished building. Before publishing, they need to know:
1. Is every step reachable from the entry point? (Nothing is disconnected.)
2. Does the journey actually behave as intended when a real user goes through it?

These are different questions. The first is structural — the system can answer it. The second requires running the journey against a test user and observing what happens.

If either check fails, the marketer needs to know *what* failed and where to fix it — not just a generic error.

---

### Flow 5: Publish and manage the live journey

Publishing means real customers start entering. The marketer needs to do this with confidence.

After publishing, circumstances change — copy needs updating, a new branch is needed, performance is poor. The marketer needs to:
- Pause the journey to safely make changes without interrupting users already in-flight
- Edit a live journey and know those edits take effect
- Resume when ready

Changes to a live journey are immediate. There is no staging or deployment step.

---

### Flow 6: Understand how the journey is performing

The marketer needs to know if the journey is working. Not in aggregate at the campaign level — at the step level. Which node are users dropping off at? What's the conversion rate at each step? Are entries trending up or down?

This information belongs inside the builder, not on a separate analytics page. The marketer should be able to see performance and iterate on configuration in the same session.

---

## 6. Functional Specification

This section covers the builder as a whole. Individual node configurations are out of scope here — each node type has its own PRD.

### 6.1 Journey Identity

| Field | Behaviour |
|-------|-----------|
| Name | Editable inline from the topbar. Required. Cannot be empty — reverts to the previous value if cleared. Max 80 characters. |
| Description | Optional. For internal documentation. Editable when no node is selected. |
| Status | `draft`, `active`, `paused`. Controlled from the topbar. |

---

### 6.2 Trigger

Every journey has exactly one trigger — the entry condition that determines who enters and when.

A trigger has two parts:
- **When:** The event or schedule that causes entry (e.g. cart_abandoned, a scheduled broadcast send).
- **Who:** The audience conditions that further qualify which users can enter when the event fires (e.g. LTV > 500, hasn't purchased in 30 days, is predicted to be a bargain hunter).

The "Who" step is optional for events that don't support audience qualification (system-level events). For broadcasts, "Who" is replaced with a one-time send schedule and audience segment.

The trigger must be configured before the marketer can begin placing nodes. It can be reconfigured at any time after.

---

### 6.3 Journey Composition

The marketer assembles a journey by placing step nodes on a canvas and connecting them in order.

**What must be possible:**
- Add any available node type to the journey
- Connect one node's output to another node's input to define execution order
- Create conditional branches by connecting one node's output to multiple downstream nodes (via split node types)
- Remove any node or connection
- Rearrange nodes freely

**Connection rules:**
- Every node except the trigger must have an incoming connection from somewhere in the journey
- Every node except terminal steps must have an outgoing connection
- The trigger cannot be deleted

---

### 6.4 Lifecycle

| Status | What it means | Who enters |
|--------|--------------|------------|
| `draft` | Being built. Not live. | No one |
| `active` | Live. Trigger is listening. | Users matching trigger conditions |
| `paused` | Suspended. Trigger not listening. | No one. Users already in-journey continue to their current step. |

**Transitions:**

| From | To | What happens |
|------|----|-----------  |
| `draft` | `active` | System validates the journey (see 6.5). On pass, journey goes live. |
| `active` | `paused` | New entries stop. In-flight users are unaffected. |
| `paused` | `active` | New entries resume. |

A draft cannot be restored once a journey has been published. Changes to a live journey take effect immediately on save.

---

### 6.5 Publish Validation

Before a journey can be activated, the system must confirm:

1. At least one node beyond the trigger exists.
2. Every node on the canvas is reachable from the trigger — there is a path of connections from the trigger to it.
3. Every reachable node with required configuration has been configured.
4. Every output handle of every branching node is connected — no empty branches.

If any check fails, activation is blocked. The marketer is shown exactly which nodes failed and why, with a direct navigation action to each.

---

### 6.6 Autosave

The marketer should never think about saving. Every change saves automatically.

- Changes to the canvas (nodes, edges, positions) save 1,500ms after the last edit.
- Changes to journey name and description save on the same debounce in parallel.
- The current save state is always visible in the topbar: saving, saved, save failed.
- On save failure, the canvas remains fully usable. The marketer is told not to navigate away until the save resolves.

---

### 6.7 Test Mode

Before a journey goes live, the marketer can run it against a test user to observe actual execution.

A test must:
- Allow the marketer to specify a test user (not just "simulate")
- Execute each step in sequence — with timing compressed or skippable
- Show which steps the test user passed through and whether each step succeeded or failed
- On step failure, show the reason (e.g. test user not subscribed on this channel)
- Not affect production users or flow state

---

### 6.8 AI Dev Assistant

The marketer can make structural changes to the journey by describing what they want in natural language. The AI interprets the instruction and modifies the canvas.

Constraints:
- The marketer can undo any AI-generated modification immediately after it is applied
- If the AI response is informational only (no structural change), the canvas is not touched
- The full instruction history for a journey is accessible in the same panel

---

### 6.9 Per-Node Analytics

For published journeys, each node shows delivery performance inline in the builder.

Metrics per node: users entered, users exited, delivery rate.
Journey-level: total entered, completed, conversion %, revenue attributed, 7-day entry trend.

For draft journeys, the analytics surface shows a placeholder explaining that data begins after publishing.

---

## 7. States

### Builder

| State | What the marketer sees | How it exits |
|-------|-----------------------|--------------|
| Loading (new journey) | Trigger wizard opens immediately | Trigger configured → canvas with trigger node |
| Loading (existing journey) | Canvas loads with saved nodes and edges | Data arrives → canvas ready |
| Ready | Full builder interface | — |
| Load failed | Error with retry | Retry → loading |

### Trigger Wizard

| State | What the marketer sees | How it exits |
|-------|-----------------------|--------------|
| Event picker | Full event catalogue, browsable and searchable | Event selected |
| When — event config | Selected event with condition builder | Next → Who step, or finish |
| Who — audience config | Audience filter builder with live user count estimate | Finish → wizard closes, trigger placed on canvas |
| Broadcast config | Schedule picker + audience segment selector | Finish → wizard closes |
| Cancelled (new journey) | Marketer is returned to the flows list | — |
| Cancelled (existing journey) | Wizard closes, existing trigger unchanged | — |

### Node

| State | What the marketer sees |
|-------|-----------------------|
| Unconnected | Visual indicator: this step won't run |
| Incomplete | Visual indicator: required configuration missing |
| Complete | Standard appearance |
| Selected | Configuration panel opens in right panel |

### Autosave

| State | What the marketer sees |
|-------|-----------------------|
| Idle | Nothing — no unsaved changes |
| Saving | "Saving…" in topbar |
| Saved | "Saved just now" briefly, then idle |
| Failed | "Save failed — don't navigate away" with manual retry |

### Publish Validation

| State | What the marketer sees |
|-------|-----------------------|
| Passing | Activate is enabled |
| Failing | Activate is blocked. List of specific failures with navigation to each. |

---

## 8. Edge Cases

**Situation:** Marketer activates a flow where a Conditional Split has one output connected and one left empty.
**Wrong behavior:** Flow activates. Users who route to the empty branch silently exit the journey.
**Correct behavior:** Publish validation blocks activation. The empty branch is explicitly called out as a failure.

---

**Situation:** Marketer deletes a middle node that is the only connection between the trigger and a downstream section.
**Wrong behavior:** Downstream nodes appear on canvas but are silently disconnected. Marketer doesn't notice.
**Correct behavior:** After deletion, all nodes now unreachable from the trigger are visually flagged. A non-blocking notice tells the marketer which nodes are now disconnected.

---

**Situation:** Marketer renames the journey to an empty string and clicks away.
**Wrong behavior:** Journey saves with an empty name. It appears as a blank row in the flows list.
**Correct behavior:** On commit, if the name is empty, it reverts to the previous value. Empty name is never saved.

---

**Situation:** Autosave is in-flight when the marketer closes the browser tab.
**Wrong behavior:** In-flight save is dropped. On reload, the marketer finds work from before the last successful save with no explanation.
**Correct behavior:** The save failure copy in the topbar tells the marketer not to navigate away until the issue resolves. The data loss window is bounded by the 1,500ms debounce. No browser-close guard is added — the debounce window is short enough that a confirmation dialog on close would be more disruptive than the potential loss.

---

**Situation:** Marketer opens the same journey in two tabs, edits in both, and saves.
**Wrong behavior:** Second save silently overwrites the first. One set of edits is lost.
**Correct behavior:** Backend detects a version conflict. Second tab shows: "This journey was updated in another tab. Reload to get the latest, or overwrite with your changes."

---

**Situation:** AI Dev makes a structural change. Marketer makes additional manual edits on top. Marketer then clicks Undo.
**Wrong behavior:** Undo reverts to the pre-AI state, discarding the manual edits made after.
**Correct behavior:** Undo is only available immediately after the AI modification is applied. Once the marketer makes another edit, the Undo option expires. This is clearly communicated.

---

**Situation:** Marketer publishes, the journey runs for a week, then deletes a node while users are in-flight at that step.
**Wrong behavior:** Users mid-journey at the deleted node have undefined behavior — they may be stuck, silently dropped, or produce an error.
**Correct behavior:** Defined policy needed. Options: block deletion of nodes with in-flight users, or advance in-flight users to the next connected step on deletion. (See Open Questions.)

---

## 9. Non-Functional Requirements

### Performance
- Canvas must be interactive within 2 seconds for journeys with up to 50 nodes.
- Adding a node must appear in the UI within 100ms (optimistic, before save confirms).
- Trigger wizard must open within 500ms.
- Autosave must not interrupt or visibly slow canvas interaction.

### Scale
- Canvas must remain interactive at up to 200 nodes.
- Event catalogue in trigger picker must support 500+ events with instant search.

### Security
- Read-only users can open the builder but cannot edit, publish, or pause. Edit controls are disabled with an explanatory tooltip, not hidden.
- The publish control is hidden (not just disabled) for read-only users.
- Node configuration may contain sensitive values (API keys, webhook secrets). These must be masked after entry and never logged.

### Reliability
- Autosave failure must not block the marketer from continuing to build. The canvas remains usable.
- If flow metadata fails to load, the canvas loads with whatever data is available locally. A banner communicates potential staleness.
- Store state from one flow must not bleed into another when the marketer navigates between flows.

---

## 10. Analytics & Instrumentation

### Events

| Event | Trigger | Properties |
|-------|---------|-----------|
| `builder_opened` | Builder loads | `flow_id`, `is_new`, `node_count` |
| `trigger_wizard_completed` | Wizard finished | `flow_id`, `trigger_type`, `has_audience_filter`, `has_exit_trigger` |
| `trigger_wizard_abandoned` | Wizard closed before completion on a new flow | `flow_id`, `stage_reached` |
| `node_added` | Node placed | `flow_id`, `node_type`, `method` (click/drag) |
| `node_deleted` | Node removed | `flow_id`, `node_type`, `had_connections` |
| `flow_published` | Activate confirmed | `flow_id`, `node_count`, `time_in_builder_ms` |
| `flow_paused` | Pause confirmed | `flow_id` |
| `flow_test_started` | Test mode entered | `flow_id` |
| `autosave_failed` | Save API error | `flow_id`, `retry_count` |
| `publish_validation_failed` | Activation blocked | `flow_id`, `failure_reasons[]` |
| `ai_modification_applied` | AI changes canvas | `flow_id` |
| `ai_modification_undone` | Marketer undoes AI change | `flow_id` |

### Reporting Metrics

| Metric | Definition | Where it surfaces |
|--------|-----------|-------------------|
| Flow completion rate | `flow_published / builder_opened` per session | Builder health |
| Trigger wizard abandonment | `wizard_abandoned / wizard_opened` | Builder funnel |
| Publish validation block rate | `validation_failed / publish_attempts` | Quality signal |
| Test-before-publish rate | Sessions where test started before first publish | Quality adoption |
| Autosave error rate | `autosave_failed / autosave_triggered` | Reliability |

---

## 11. Copy

### Autosave states
> Saving…
> Saved just now
> Saved [N] minutes ago
> Save failed — don't navigate away until this is resolved. [Retry]

### Node states
> Not connected — this step won't run until it's connected to the flow.
> Setup incomplete — finish configuring this step before activating.

### Publish validation failure
> **This journey isn't ready to go live**
> — [Node name]: not connected to the trigger [Go to node]
> — [Node name]: setup incomplete [Go to node]
> — Conditional Split has an empty branch [Go to node]

### Node deletion confirmation
> **Delete "[Node name]"?**
> This will also remove [N] connection(s).
> [Cancel] [Delete]

### Pause confirmation
> **Pause this journey?**
> No new users will enter. Users already in the journey continue to their current step.
> [Cancel] [Pause]

### Concurrent edit conflict
> This journey was updated in another tab.
> [Reload to see latest] [Keep my changes]

### Errors
> Couldn't load this journey. [Try again]
> Couldn't publish. [Try again]
> Couldn't pause. [Try again]

---

## 12. Dependencies

| Dependency | What it provides | If unavailable | Degradation |
|------------|-----------------|---------------|-------------|
| Flows API (fetch) | Load saved journey state | Journey cannot open | Error state with retry |
| Flows API (update) | Autosave | Saves fail | Autosave error state; canvas still usable |
| Flows API (publish / pause / resume) | Lifecycle transitions | Transition fails | Error shown; status unchanged |
| Event catalogue API | Trigger event picker | Picker errors; wizard incompletable | Builder cannot start new flows |
| Audience count API | Estimated reach in trigger "Who" step | Count shows "—" | Non-blocking; wizard still completable |
| Message delivery API | Test flow execution | Test mode unavailable | Draft mode still fully functional |
| AI Dev API | AI-assisted canvas modification | AI Dev tab errors | Config and Analytics tabs unaffected |

---

## 13. Out of Scope

| Exclusion | Reason |
|-----------|--------|
| Per-node configuration specs | Each node type (WhatsApp, Email, Conditional Split, Delay, etc.) has its own PRD. |
| Undo / redo (general) | Requires full canvas history stack. Not in V1. |
| Flow versioning and rollback | No version history model exists. |
| Collaborative editing | Requires CRDT or operational transforms. |
| Mobile / tablet editing | Canvas drag-and-drop is not suited to touch. |
| A/B test variant management | Separate feature. |
| Exporting / importing flows as JSON | Not in V1. |
| Inbound reply handling (replies as triggers) | Future scope. |

---

## 14. Open Questions

| Question | Why it's open | Owner |
|----------|-------------|-------|
| What happens to users mid-journey when a node they are currently waiting at gets deleted? | If a user is at step N and the marketer deletes step N, their journey state is undefined. This is a product decision with significant trust implications. | Product + Engineering |
| When a live journey is edited, do changes affect users already in-flight or only new entrants? | Currently saves overwrite the live flow immediately. Whether in-flight users get the new logic or complete on the version they entered on is unspecified. | Product + Engineering |
| Is test mode scoped to a single test user or a small test segment? | The current stub only shows a toast. The design of test mode is undefined. | Product |
| What is the enforced maximum node count per journey? | No limit is currently set. At high node counts, save payloads grow and canvas performance degrades. | Engineering |
| Should publish validation block on nodes with incomplete optional configuration, or only required fields? | No distinction between required and optional fields exists at the node level yet. | Product |

---

## 15. Decision Log

| Decision | Alternatives considered | Rationale | Tradeoff |
|----------|------------------------|-----------|---------|
| Trigger configuration is required before placing any nodes | Allow nodes before trigger | Without a trigger, every node placed has no entry context. Forcing trigger first means every subsequent decision is grounded in who is actually entering. | Slightly higher friction at the start. Acceptable because the trigger wizard completes in under 2 minutes. |
| Autosave over an explicit Save button | Require manual save | An explicit Save button adds cognitive overhead. Autosave with a visible indicator provides the same reliability with less interruption. | Up to 1,500ms of changes can be lost on sudden disconnection. Mitigated by the error state. |
| Optimistic canvas updates | Block canvas until save confirms | Blocking makes the product feel slow, especially on poor connections. Optimistic updates feel instant. | If the backend is down, nodes appear but aren't persisted. The error state must make this explicit. |
| Publish validation at activation time, not continuously | Validate as the marketer builds | Continuous validation creates noise — every half-built state shows errors. Validation at activation gives the marketer a clean moment to resolve issues with full context. | A marketer can build an invalid flow and not know until they try to activate. |
