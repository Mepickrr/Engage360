# Flow Builder — Product Requirements Document

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

**What's built and working:**
- A canvas-based builder where nodes represent steps and edges represent connections between them
- A trigger wizard that forces the marketer to define entry conditions before building — opens automatically on new flows, re-openable on existing ones
- A browsable library of node types organised into categories (Communication, Flow Control, Integrations, etc.)
- Node add via click or drag-and-drop onto the canvas
- Node deletion via keyboard (Backspace / Delete) with a browser-native confirmation when the node has connections
- A configuration panel that opens when a node is selected, with three tabs: Config, AI Dev, and Analytics
- Autosave: canvas state (nodes + edges) and flow metadata (name, description) both save automatically after 1500ms of no changes
- Flow lifecycle management: draft → active (publish) → paused → active (resume), controlled from the builder header
- An inline editable flow name in the header
- Two flow-level global wizards that run once per flow before certain node types can be configured: AI Calling and AI Chatbot
- Keyboard delete guard: when deleting a node with connections, a native browser `window.confirm` dialog intercepts

**What's incomplete (stubs):**
- "Test flow" sets flow status to `test` and shows a toast — no actual test execution, no test user, no result feedback
- "Download report" shows a toast — no file generated
- View Analytics navigates to an analytics route that is separate from the builder — not validated as reachable
- The AI Dev tab exists in the configuration panel but its full behaviour is not specified
- The delete confirmation uses `window.confirm` — a native browser dialog that cannot be styled, blocked by pop-up suppressors, and gives no custom copy

**What's absent:**
- No validation before publishing a flow — a flow with no nodes or no connection between start trigger and any other node can be activated
- No undo / redo
- No way to rename a node on the canvas
- No duplicate node action
- No zoom-to-fit or "find my nodes" when the marketer is lost on the canvas
- No indication of which nodes are unreachable (not connected to the trigger)
- No confirmation when navigating away with unsaved changes (only applies to the debounce window)

---

## 1. Feature Brief

The Flow Builder is where a marketer turns a campaign idea into a live automated journey. They define who enters, what happens at each step, and in what order — without writing logic or involving engineering. The builder must be capable enough to express complex multi-channel sequences yet approachable enough that a marketer with no technical background can operate it confidently. A flow that a marketer can understand while building is a flow they will maintain and improve over time.

---

## 2. The Job

Let a marketer design, configure, and activate an automated customer journey entirely on their own.

Three things that, if missing, make it not worth shipping:

1. **Every step in the journey is reachable from the trigger.** A marketer who builds a flow must know, before they publish, whether their messages will actually send. Disconnected steps that silently do nothing destroy trust.
2. **The flow saves without the marketer thinking about it.** Mid-build interruptions are inevitable. A marketer who loses work because they didn't click Save will not come back.
3. **Testing is possible before going live.** Publishing a broken flow to real customers is not acceptable. The marketer must be able to verify behaviour on a controlled audience first.

---

## 3. Success Metrics

| Metric | Baseline | Target (90 days) |
|--------|----------|-----------------|
| Flows published per marketer per month | Unknown — establish baseline | Grow 30% after builder ships |
| % of new flows that reach "active" within 48h of creation | Unknown | > 50% |
| Builder session abandonment rate (opens builder, exits without saving anything) | Unknown | < 20% |
| Time from "Create Flow" to first node placed | Unknown | < 60 seconds (median) |
| Support tickets citing "flow didn't send" caused by disconnected nodes | Baseline TBD | −70% after publish validation ships |
| Flows tested before first activation | 0 (test stub not functional) | > 40% of new flows |

---

## 4. Who Uses This and When

**Persona 1 — Campaign Marketer building their first automated flow**

Goal: Build a cart recovery sequence that sends a WhatsApp message 1 hour after abandonment, followed by an email 24 hours later if the user hasn't converted.
Emotional state: Motivated but cautious. Hasn't done this before. Will stop and leave if they encounter an unexplained error or a step that doesn't work the way they expected.
Success: Places the trigger, adds the two message nodes, connects them with a delay and a condition, and publishes — all in one session, under 30 minutes.
Failure: Builds the entire flow and activates it, then discovers one of the message nodes was never connected to anything and never fired.

---

**Persona 2 — CRM Manager editing a live flow**

Goal: Update the copy in a WhatsApp template on an active flow and add a new branch for users who have already purchased.
Emotional state: Careful. This flow is running on real customers. A mistake costs money and credibility.
Success: Opens the flow, makes the changes, sees the autosave indicator confirm it saved, and knows the live flow is now updated.
Failure: Makes a change, navigates away to check something, and doesn't know if the change was saved or whether the live flow is now reflecting the edit.

---

**Persona 3 — Growth Marketer building a complex multi-channel sequence**

Goal: Build a 6-step sequence across WhatsApp, Email, and AI Calling, with conditional branches for different customer segments.
Emotional state: Confident and ambitious. Wants to push the product to its limits.
Success: Uses conditional splits to create multiple paths, places all nodes, connects every branch, and validates the logic is correct before publishing.
Failure: Gets lost on the canvas after adding 15+ nodes; can't tell which paths are complete and which are dead ends; gives up and uses a simpler single-channel flow instead.

---

## 5. User Flows

### Flow 1: Create and publish a new flow

1. Marketer enters the builder from the Flows list or the Create Flow page.
2. The trigger configuration experience opens immediately. The marketer cannot place nodes until they have defined the entry condition (the event or schedule that starts the journey).
3. Trigger configuration has two steps: *When* (what event or schedule starts the journey) and *Who* (which users qualify). The marketer can skip the "Who" step if the selected trigger type does not support audience filtering.
4. On completing trigger configuration, the entry node appears on the canvas representing the configured trigger. The rest of the canvas is empty.
5. The marketer adds a node from the node library. The node appears on the canvas and is immediately selected.
6. The marketer connects the trigger node to the new node by drawing a connection from the trigger's output handle to the new node's input handle.
7. The marketer opens the node's configuration and sets it up (template, timing, etc. — covered in individual node PRDs).
8. The marketer repeats steps 5–7 until the journey is complete.
9. The marketer activates the flow. The system validates that at least one node is reachable from the trigger (connected). If validation fails, the system surfaces which nodes are unreachable.
10. On successful activation, the flow status changes to active. Users begin entering the flow in real time.

---

### Flow 2: Edit an existing active flow

1. Marketer opens an existing active flow from the Flows list.
2. The canvas loads with the saved state. The flow status is visible and indicates it is active.
3. Marketer makes a change (reconfigures a node, adds a step, updates a connection).
4. Autosave runs within 1500ms of the last change. The save state indicator communicates: saving → saved.
5. The change is live immediately — there is no separate "deploy" step after save.
6. If autosave fails, the indicator communicates an error and the marketer is prompted to retry manually.

---

### Flow 3: Pause a flow from the builder

1. With an active flow open, the marketer triggers the pause action from the flow header controls.
2. A confirmation is shown: pausing stops new users from entering; users already in-journey continue to their current step.
3. On confirm: the flow status changes to paused. The canvas remains editable.
4. The marketer makes changes to the paused flow.
5. The marketer resumes the flow. Status returns to active.

---

### Flow 4: Test a flow before going live

1. Marketer completes building the flow but does not yet activate it.
2. Marketer triggers test mode. The system asks the marketer to specify a test user (by email, phone, or user ID).
3. The flow runs against the test user. Each step executes in sequence, with delays compressed or skippable.
4. The marketer can observe which steps the test user passed through and whether each step succeeded or failed.
5. If a step fails, the marketer sees the reason (e.g. test user not subscribed on that channel).
6. Marketer exits test mode. The flow returns to draft status. No changes to the flow state are made by testing.

---

### Flow 5: Reconfigure the trigger on an existing flow

1. Marketer selects the trigger node on the canvas.
2. The trigger configuration experience reopens, pre-populated with the existing configuration.
3. Marketer edits the trigger (changes the event, adjusts audience conditions, modifies scheduling).
4. On save: the trigger node on the canvas updates to reflect the new configuration. Autosave persists the change.

---

### Flow 6: Delete a node

1. Marketer selects a node on the canvas.
2. Marketer presses Backspace or Delete, or chooses a delete action from the node's context menu.
3. If the node has connections: a confirmation is required before deletion. The confirmation communicates that connected edges will also be removed.
4. On confirm: the node and all its edges are removed. Any downstream nodes that are now unreachable are visually indicated as disconnected.
5. On cancel: nothing changes.

---

## 6. Functional Specification

### 6.1 Flow Identity

| Field | Type | Editable | Notes |
|-------|------|----------|-------|
| `name` | String | Yes — inline from builder header | Defaults to "Untitled flow". Saved on confirm (Enter key or focus loss). Max 80 characters. Cannot be empty — reverts to previous value if cleared. |
| `description` | String | Yes | Optional. Autosaved. |
| `status` | Enum | Via header controls | `draft`, `active`, `paused`. See lifecycle section. |

---

### 6.2 Trigger Configuration

Every flow has exactly one trigger. The trigger defines the conditions under which a user enters the flow. It is configured before any nodes are placed and can be reconfigured at any time.

**Trigger types (from the event catalogue):**

| Category | Behaviour |
|----------|-----------|
| Event-based | User fires a specific event (e.g. `cart_abandoned`, `order_placed`). The trigger can require multiple events in combination (AND / OR groups). |
| Broadcast | Flow runs once on a scheduled date/time against a fixed audience segment. No ongoing entry. |

**Trigger configuration — "When" step:**

| Element | Required | Behaviour |
|---------|----------|---------|
| Event picker | Yes | Marketer selects from the event catalogue. Events are browsable by category and searchable by name. |
| Trigger groups | No | Multiple event conditions can be combined (e.g. "cart_abandoned AND page_viewed"). Each group can have its own event and condition set. Groups are combined with AND or OR. |
| Exit trigger | No | An event that removes a user from the flow mid-journey (e.g. `order_placed` exits the cart recovery flow). |

**Trigger configuration — "Who" step:**

Available only on event-based triggers. Some event types do not support audience qualification (e.g. system-level events) — the Who step is skipped automatically for these.

| Filter type | Behaviour |
|-------------|---------|
| User properties | Filter by user attributes (e.g. LTV, city, custom attributes). Operators: equals, does not equal, greater than, less than, contains, is set, is not set. |
| User behaviour | Filter by past event activity (e.g. "has placed at least 2 orders in the last 30 days"). |
| User affinity | Filter by AI-derived affinity tags (e.g. weekendShopper, bargainHunter). |
| Audience inclusion/exclusion | Include all users matching conditions, or exclude a subset. |
| Entry frequency limit | Cap how often a single user can re-enter the flow (e.g. once per 7 days). |
| Global control group | Optionally exclude a holdout percentage from the flow for statistical comparison. |

**Broadcast-specific configuration:**

| Element | Required | Behaviour |
|---------|----------|---------|
| Schedule | Yes | Send now, or schedule for a specific date and time. |
| Audience | Yes | Target all users, or a named audience segment. |

---

### 6.3 Node Library

The node library is the source of all step types a marketer can add to a flow. It is always accessible while on the canvas.

**Categories:**

| Category | Node types |
|----------|-----------|
| Communication | WhatsApp, Email, SMS, RCS, Push Notification, Onsite, InApp, AI Calling, AI Chatbot |
| Flow Control | Conditional Split, Delay, Start Another Flow |

Additional categories (Shopify, Integrations, Google Sheets, User Profile, Ticket, Shiprocket) exist in the full node catalogue but are hidden in the current V1 release. They are available in the underlying code and can be re-enabled per release.

**Node library behaviour:**
- Marketer can search by node name.
- Marketer can add a node by clicking it (places it on the canvas at an automatic position) or dragging it to a specific position.
- Recently used nodes are surfaced for quick re-access.
- The library remains accessible while a node is selected and being configured.

---

### 6.4 Canvas

The canvas is the workspace where nodes are placed and connected into a journey.

**Canvas interactions:**

| Interaction | Behaviour |
|-------------|---------|
| Add node | Node appears on canvas. Newly added nodes are automatically selected. |
| Select node | Clicking a node selects it. Configuration panel opens for the selected node. Only one node is selected at a time. |
| Deselect | Clicking empty canvas space deselects the current node. Configuration panel returns to flow-level view. |
| Move node | Drag a node to reposition it. Position is saved with autosave. |
| Connect nodes | Draw a connection from one node's output handle to another node's input handle. |
| Delete connection | Click an edge to select it; delete to remove. |
| Delete node | Select a node and press Backspace or Delete. Requires confirmation if the node has connections. |
| Pan | Drag empty canvas to pan. |
| Zoom | Scroll to zoom in/out. Zoom range: 25% to 200%. |
| Zoom to fit | Resets the viewport to show all nodes at once. |
| Minimap | Overview of the full canvas; clicking a region navigates to it. |

**Connection rules:**
- Every node has at least one input handle (except the trigger, which has none).
- Every node has at least one output handle (except exit nodes, which have none).
- Conditional Split nodes have one input and multiple output handles (one per branch).
- A handle can only have one connection in a given direction. An output handle that already has a connection cannot accept a second without removing the first.

---

### 6.5 Node Configuration

When a node is selected, its configuration becomes accessible. Configuration is node-type-specific and is covered in individual node PRDs. What applies to all nodes:

| Behaviour | Specification |
|-----------|--------------|
| Configuration persists on deselect | Changes made in the config are not lost when the marketer clicks elsewhere on the canvas. |
| Configuration autosaves | Node configuration is part of the canvas state. It saves with the same 1500ms debounce as all other canvas changes. |
| Configuration shows a completion indicator | A node whose required configuration is incomplete is visually distinguished on the canvas from a fully configured node. |

**Configuration panel tabs:**

| Tab | Purpose |
|-----|---------|
| Config | Node-specific settings. Template selection, timing, conditions — per node type. |
| AI Dev | AI-assisted flow editing. The AI can suggest or apply changes to the canvas in response to natural language prompts. Changes made by the AI can be undone. |
| Analytics | Per-node performance data (entered, delivered, opened, clicked, converted). Available only when the flow has been active. In draft status, this tab shows a placeholder. |

---

### 6.6 Flow-Level Global Configurations

Two node types — AI Calling and AI Chatbot — require a one-time flow-level setup before any individual instance of that node can be configured. This setup runs automatically the first time the marketer places or selects one of these nodes.

| Wizard | What it configures |
|--------|-------------------|
| AI Calling | Voice selection, tone (professional / casual / etc.), goal of the calling campaign |
| AI Chatbot | Tone, system instructions, agent type, store data access permissions, enabled tools, handover context |

Once configured, the global settings apply to all instances of that node type within the flow. The marketer can re-open the wizard at any time to update the global configuration. Changes to global configuration affect all instances.

---

### 6.7 Flow Lifecycle

| Status | Meaning | Who enters the flow |
|--------|---------|-------------------|
| `draft` | Flow is being built. Not yet live. | Nobody |
| `active` | Flow is live. Trigger is listening for qualifying events. | Any user who matches the trigger conditions |
| `paused` | Flow is suspended. Trigger is not listening. | Nobody. Users mid-journey continue to their current step. |

**Transitions:**

| From | To | Action | Validation required |
|------|----|---------|--------------------|
| `draft` | `active` | Publish / Activate | At least one node is reachable from the trigger. All reachable nodes that have required configuration are fully configured. |
| `active` | `paused` | Pause | Confirmation required. |
| `paused` | `active` | Resume | None. |
| Any | `draft` | — | Not a valid transition. A published flow cannot be returned to draft. |

---

### 6.8 Autosave

Autosave runs automatically. The marketer does not need to trigger it.

| Trigger | Debounce | What is saved |
|---------|----------|--------------|
| Any change to nodes or edges | 1500ms after last change | Full canvas state (all nodes + all edges) |
| Any change to flow name or description | 1500ms after last change | Name, description |

**Save state:**

| State | Meaning |
|-------|---------|
| `idle` | No unsaved changes |
| `saving` | Save in flight |
| `saved` | Save confirmed by backend. Shown briefly, then returns to idle. |
| `error` | Save failed. Marketer is notified and can retry manually. |

The save state is always visible while in the builder. `error` state persists until the marketer retries or the next successful save.

---

### 6.9 Publish Validation

Before a flow can be activated, the system checks:

1. The flow has at least one node beyond the trigger.
2. Every node on the canvas is reachable from the trigger (has a path of edges from the trigger to it).
3. Every reachable node that has required configuration has been configured.

If any check fails, activation is blocked. The marketer is shown which nodes failed which checks, with a direct action to navigate to each one.

---

## 7. States

### Builder

| State | Trigger | What the marketer sees | How it exits |
|-------|---------|-----------------------|--------------|
| Loading (new flow) | Builder opens for an unsaved flow | Trigger wizard opens immediately | Trigger configured → canvas with trigger node |
| Loading (existing flow) | Builder opens for a saved flow | Canvas loads with saved state | Data arrives → canvas ready |
| Ready | Canvas loaded | Full builder interface | — |
| Error (load failed) | Flow data cannot be fetched | Error with retry | Retry → Loading |

### Trigger Wizard

| State | Trigger | What the marketer sees | How it exits |
|-------|---------|-----------------------|--------------|
| Event picker | Wizard opens | Full event catalogue to browse or search | Event selected → Step 1 |
| Step 1 — When | Event selected | Trigger group configuration with selected event pre-filled | Next → Step 2, or Finish (if step 2 skipped) |
| Step 2 — Who | Step 1 complete | Audience filter builder with estimated qualifying user count | Finish → wizard closes, trigger placed on canvas |
| Broadcast | Broadcast event selected | Schedule and audience configuration | Finish → wizard closes, trigger placed on canvas |
| Cancelled (new flow) | Marketer closes wizard on a new flow before configuring | Marketer is returned to the previous page | — |
| Cancelled (existing flow) | Marketer closes wizard on an existing flow | Wizard closes, existing trigger config unchanged | — |

### Node

| State | Trigger | What the marketer sees |
|-------|---------|-----------------------|
| Unconnected | Node on canvas with no incoming or outgoing edge | Visual indicator distinguishes it from connected nodes |
| Incomplete | Node is connected but required configuration is missing | Visual indicator on the node itself |
| Complete | Node is connected and fully configured | Standard node appearance |
| Selected | Marketer clicks node | Configuration panel opens |
| Deleting | Delete key pressed with node selected | Confirmation shown if node has connections |

### Autosave

| State | What the marketer sees |
|-------|----------------------|
| `idle` | Save indicator is quiet — no unsaved changes |
| `saving` | "Saving…" indicator visible |
| `saved` | "Saved [N] ago" indicator visible briefly |
| `error` | "Save failed" with a manual retry action |

### Publish Validation

| State | Trigger | What the marketer sees |
|-------|---------|-----------------------|
| Validation passing | All checks pass | Activate button is enabled |
| Validation failing | One or more checks fail | Activate is blocked. A summary lists the failing nodes with navigation links. |

---

## 8. Edge Cases

**Situation:** Marketer activates a flow where one branch of a Conditional Split has no nodes connected to it.
**Wrong behaviour:** Flow activates. Users who route into the empty branch exit the flow silently.
**Correct behaviour:** Publish validation treats every branch of every Conditional Split as a reachable path. An unconnected branch on any split fails validation with: "Conditional Split has an empty branch. Either add steps to this branch or remove it."

---

**Situation:** Marketer deletes a node that is the only connection between the trigger and a downstream sequence.
**Wrong behaviour:** The downstream sequence disappears silently; the marketer doesn't notice they've disconnected half the flow.
**Correct behaviour:** After deletion, the canvas visually marks all nodes that are now unreachable. A non-blocking notice reads: "Some nodes are no longer reachable from the trigger." The marketer can re-connect or delete the orphaned nodes.

---

**Situation:** Marketer opens the same flow in two browser tabs simultaneously, makes different edits in each, and saves both.
**Wrong behaviour:** The second save silently overwrites the first. One set of edits is lost with no warning.
**Correct behaviour:** On save, the backend checks a version/timestamp against the last known save. If a conflict is detected, the second tab shows: "This flow was updated in another tab. Reload to get the latest version, or force-save to overwrite it." The marketer chooses.

---

**Situation:** Marketer renames the flow to an empty string and navigates away.
**Wrong behaviour:** Flow is saved with an empty name. The Flows list shows a blank row.
**Correct behaviour:** On commit (Enter or focus loss), if the name is empty, the name field reverts to the previous value. An empty flow name is never saved.

---

**Situation:** Autosave is running when the browser tab is closed.
**Wrong behaviour:** In-flight save is lost. Marketer reopens and finds work from before the last successful save.
**Correct behaviour:** The autosave debounce is short (1500ms). The expected data loss window is at most 1500ms of changes. This is disclosed to the marketer in the "unsaved changes" copy. There is no additional browser-close guard because the debounce window is short enough that a guard dialog would be more disruptive than the potential loss.

---

**Situation:** An AI Calling or AI Chatbot node is added, the global wizard is dismissed without completing, and the marketer then tries to configure the individual node.
**Wrong behaviour:** Individual node configuration opens but the global settings it depends on are empty — the node may appear configured but will fail at runtime.
**Correct behaviour:** Individual node configuration for AI Calling and AI Chatbot is blocked until the global wizard is completed. A prompt within the node config reads: "Complete the AI Calling setup first." with a link to re-open the wizard.

---

**Situation:** Marketer places a node, connects it, and then the backend create fails (e.g. API is down at the moment of first save).
**Wrong behaviour:** Node appears on canvas but is never persisted. On reload, it is gone. Marketer doesn't know.
**Correct behaviour:** The canvas responds optimistically — the node appears immediately. If the first save fails, the autosave error state is shown. The node remains visible on the canvas until the marketer refreshes. If they refresh without a successful save, the node will not be there. The error state must make this risk clear: "Changes couldn't be saved. Don't refresh until this is resolved."

---

**Situation:** Marketer has a flow with 50+ nodes and is zoomed out to see all of them. They click to select a node and then press Delete — but the selection fell on a different node than the one they intended because the nodes are visually small at that zoom level.
**Wrong behaviour:** The wrong node is deleted, possibly silently if it had no connections.
**Correct behaviour:** The node name is always shown in the confirmation dialog regardless of zoom level, so the marketer can verify they're deleting the right one before confirming.

---

## 9. Non-Functional Requirements

### Performance
- Canvas with up to 50 nodes must load in under 2 seconds.
- Adding a node to the canvas must be reflected in the UI in under 100ms (optimistic, before save).
- Autosave must not cause any visible jank or interruption to canvas interaction — it runs in the background.
- Trigger wizard must open in under 500ms.

### Scale
- Canvas must remain interactive at up to 200 nodes without frame-rate degradation. Beyond 200 nodes, a warning is shown: "Large flows may be slow to load."
- The event catalogue in the trigger picker must support 500+ events with instant search (client-side after initial load).

### Security
- Editing a flow (adding nodes, changing configuration, publishing) requires write permission. Read-only users can open the builder but all edit interactions are disabled with an explanatory tooltip.
- Node configuration may include API keys or webhook secrets. These values must be masked in the UI after entry and never logged.
- Publish action requires write permission. The publish control is hidden (not just disabled) for read-only users.

### Reliability
- If the autosave API fails, the marketer's local canvas state must not be destroyed. The canvas remains fully usable. The error state must persist until a save succeeds or the marketer manually retries.
- If the flow metadata API fails on load, the canvas should still load with whatever data is locally available (e.g. from the query cache). A banner communicates that the data may be stale.
- The trigger wizard must be completable offline (data entered before an API failure should not be lost when the connection returns).

---

## 10. Analytics & Instrumentation

### Events

| Event | Trigger | Properties |
|-------|---------|-----------|
| `builder_opened` | Builder loads | `flow_id`, `is_new`, `node_count` (if existing) |
| `trigger_wizard_completed` | Wizard finished | `flow_id`, `trigger_type` (event/broadcast), `has_audience_filter`, `has_exit_trigger` |
| `trigger_wizard_abandoned` | Wizard closed without completing on a new flow | `flow_id`, `stage_reached` (picker/step1/step2) |
| `node_added` | Node placed on canvas | `flow_id`, `node_type`, `method` (click/drag) |
| `node_deleted` | Node removed | `flow_id`, `node_type`, `had_connections` |
| `node_connected` | Edge drawn between nodes | `flow_id`, `source_type`, `target_type` |
| `node_selected` | Node clicked | `flow_id`, `node_type` |
| `flow_published` | Activate confirmed | `flow_id`, `node_count`, `time_to_publish_ms` |
| `flow_paused` | Pause confirmed | `flow_id` |
| `flow_resumed` | Resume confirmed | `flow_id` |
| `flow_test_started` | Test mode entered | `flow_id` |
| `autosave_failed` | Save API returns error | `flow_id`, `retry_count` |
| `publish_validation_failed` | Activation blocked by validation | `flow_id`, `failure_reasons[]` |
| `ai_dev_prompt_submitted` | AI Dev tab prompt sent | `flow_id`, `prompt_length` |
| `ai_change_accepted` | Marketer accepts AI canvas modification | `flow_id` |
| `ai_change_undone` | Marketer undoes AI canvas modification | `flow_id` |

### Reporting Metrics

| Metric | Definition | Where it surfaces |
|--------|-----------|-------------------|
| Flow completion rate | `flow_published / builder_opened` per session | Builder health dashboard |
| Trigger wizard abandonment rate | `trigger_wizard_abandoned / trigger_wizard_opened` | Builder funnel |
| Avg. nodes per published flow | `sum(node_count on publish) / flows_published` | Flow complexity trend |
| Publish validation block rate | `publish_validation_failed / flow_published attempts` | Product quality signal |
| Autosave error rate | `autosave_failed / autosave_triggered` | Reliability dashboard |
| Test-before-publish rate | `flow_test_started before flow_published` | Quality adoption |

---

## 11. Copy

### Flow name

> Untitled flow *(default name — editable inline)*

---

### Autosave states

> Saving…

> Saved just now

> Saved [N] minutes ago

> Changes couldn't be saved. [Retry]

> Changes couldn't be saved. Don't refresh until this is resolved.

---

### Trigger wizard

> **Step 1 of 2 — When will users enter this flow?**

> **Step 2 of 2 — Who can enter this flow?**

> Estimated [X,XXX] users match these conditions

> This trigger type doesn't support audience filtering. All qualifying users will enter. [Continue →]

---

### Node states

> Not connected — this step won't run until it's connected to the flow.

> Setup incomplete — finish configuring this step before activating.

---

### Publish validation failure

> **This flow isn't ready to go live**
> Fix the following before activating:
> — [Node name]: not reachable from the trigger [Go to node]
> — [Node name]: required configuration missing [Go to node]
> — Conditional Split has an empty branch [Go to node]

---

### Node deletion confirmation

> **Delete "[Node name]"?**
> This will also remove [N] connection(s). This cannot be undone.
> [Cancel] [Delete]

---

### Pause confirmation

> **Pause this flow?**
> No new users will enter. Users already in the journey will finish their current step.
> [Cancel] [Pause]

---

### Concurrent edit conflict

> This flow was updated in another tab.
> [Reload to see latest] [Force-save my changes]

---

### Errors

> Couldn't load this flow. [Try again]

> Failed to publish. [Try again]

> Failed to pause. [Try again]

---

## 12. Dependencies

| Dependency | What is needed | If unavailable | Graceful degradation |
|------------|---------------|---------------|---------------------|
| Flows API (fetch) | Load existing flow data (nodes, edges, meta) | Flow cannot load | Error state with retry |
| Flows API (create) | Create a new flow record on first node drop | Flow not persisted | Canvas still usable locally; autosave error shown |
| Flows API (update) | Autosave canvas and meta changes | Saves fail | Autosave error state; canvas still usable |
| Flows API (publish / pause / resume) | Lifecycle transitions | Transition fails | Error shown; status unchanged |
| Event catalogue | Trigger event picker | Picker shows error; cannot complete trigger setup | Builder cannot open for new flows without this |
| Audience count API | Estimated user count in trigger "Who" step | Count shows "—"; wizard still completable | Non-blocking |
| Message delivery API | Test flow execution | Test mode unavailable | Draft mode still fully functional |
| AI Dev API | AI-assisted canvas editing | AI Dev tab shows error | Config and Analytics tabs unaffected |

---

## 13. Out of Scope

| Exclusion | Reason | What unlocks it |
|-----------|--------|----------------|
| Undo / redo | Requires full history stack on the canvas state. Not a trivial addition to the current Zustand store. | Canvas history PRD. |
| Flow versioning and rollback | No version history model exists. | Versioning PRD. |
| Collaborative editing (multiple users on the same canvas simultaneously) | Requires operational transforms or CRDT. | Collaboration infrastructure PRD. |
| Mobile / tablet editing | Canvas-based drag-and-drop is not suited to touch without significant interaction redesign. | Mobile builder PRD. |
| Per-node analytics deeper than what the Analytics tab shows | Node-level analytics deeper than entered/delivered/clicked belongs in the Flow Analytics page. | Flow Analytics PRD. |
| Individual node specifications | Each node type (WhatsApp, Email, Conditional Split, etc.) has its own configuration surface. These are separate PRDs. | Individual node PRDs. |
| Exporting a flow as JSON or importing from JSON | Not in scope for V1. | Import/Export PRD. |

---

## 14. Open Questions

| Question | Why it's open | Owner | What resolves it |
|----------|-------------|-------|-----------------|
| When a draft flow is edited after being partially published, should the live version continue running while the draft is being edited? | Currently there is no concept of a "draft vs live" version separation — saving immediately affects the live flow. This is a significant product decision with trust implications. | Product + Engineering | Decision on whether the builder needs a "staged" or "versioned" editing model. |
| What happens to users mid-journey when a node is deleted from an active flow? | If a user is currently waiting at a step that gets deleted, their journey state is undefined. | Engineering + Product | Defined behaviour for in-flight users when their current node is removed. |
| Should publish validation block on incomplete optional nodes, or only required fields? | Currently no distinction is made between required and optional configuration within a node. | Product + Engineering | Field-level required/optional spec per node type. |
| What is the maximum number of nodes a single flow should support? | There is no limit enforced. At high node counts the canvas becomes unwieldy and save payloads become large. | Engineering | Performance benchmarking + defined limit with UX handling at the threshold. |
| Should the AI Dev tab allow the AI to delete nodes, or only add/modify them? | Unrestricted AI-driven deletion is higher-risk than addition. | Product | AI capability boundary definition for the Dev tab. |
| Is test mode scoped to a single test user, or can it run against a small test segment? | Currently undefined — the stub only shows a toast. | Product + Engineering | Test mode PRD. |

---

## 15. Decision Log

| Decision | Alternatives considered | Rationale | Tradeoff accepted |
|----------|------------------------|-----------|------------------|
| Trigger must be configured before any nodes can be placed | Allow nodes first, configure trigger later | A flow without a trigger has no entry point — every node a marketer places before defining the trigger is being placed without context. Forcing trigger first means every subsequent decision (which channel to use, what delay makes sense) is grounded in the actual entry event. | Slightly higher friction on the very first step. Acceptable because the trigger wizard can be completed in under 2 minutes. |
| Autosave with 1500ms debounce over explicit Save button | Explicit Save button | A Save button puts cognitive load on the marketer. Autosave with a visible indicator gives the same safety guarantee with less interruption. | The debounce window means up to 1500ms of changes can be lost on sudden disconnection. Mitigated by the autosave error state. |
| Optimistic canvas updates (node appears immediately before save confirms) | Block canvas until save confirms | Blocking the canvas on save would make the product feel slow and unresponsive, especially on poor connections. Optimistic updates make the product feel instant. | If the backend is down, nodes appear on canvas but aren't saved. The error state must make this clear. |
| Publish validation at activation time, not continuously | Continuous validation as the marketer builds | Continuous validation creates noise — every half-built state would show errors, distracting the marketer while they're mid-thought. Validation at activation gives the marketer a clear moment to fix issues with full context. | Marketer can build an invalid flow and not discover the problem until they try to activate. |
