# Flow Builder — Product Requirements Document

## Executive Summary

Currently, marketers can view and monitor existing flows but cannot build or publish automated multi-channel customer journeys without engineering support.

**Objective:**
Enable marketers to design, configure, and publish automated multi-step customer journeys entirely within the browser, at `/flows-v2/builder/:id`, without any engineering hand-off.

This release supports:
- Trigger configuration: defining who enters the journey and under what conditions
- Canvas-based composition of a directed journey graph
- Per-node configuration for all supported channel and logic node types
- Continuous autosave with no mandatory manual save step
- Full flow lifecycle management: Draft, Active (Live), Paused, Test
- AI-assisted structural modification via a conversational Dev assistant
- Journey-level and per-node analytics inline within the builder

---

## Goals & Non-Goals

### Goals

1. Allow marketers to build and publish multi-channel automated journeys without engineering support.
2. Enable complete configuration of every journey aspect — trigger, nodes, connections, delivery — from a single page.
3. Autosave all changes continuously so work is never lost.
4. Support full lifecycle management: publish, pause, resume, and test from within the builder.
5. Provide an AI assistant capable of making structural journey changes on natural-language instruction.
6. Surface journey performance data inline so marketers can analyze and iterate without switching pages.

### Non-Goals

- Two-way inbound conversation handling (handling replies as new triggers) — future scope
- A/B test variant management — future scope
- General undo/redo stack — only single-step AI-modification revert is in scope for V1
- Bulk editing of multiple nodes simultaneously
- Mobile authoring — desktop-only
- WhatsApp template approval via Meta — templates must be pre-approved before use in the builder

---

## User Personas

**1. Growth Marketer**
- Builds retention and re-engagement journeys (cart recovery, winback, onboarding).
- Non-technical; needs configuration without code.
- Iterates based on conversion rate and open rate data.

**2. CRM Manager**
- Owns lifecycle flows across multiple channels.
- Uses conditional splits and delays to build branched, multi-step journeys.
- Needs reliable publish and pause controls when making live changes.

**3. Performance Manager**
- Focused on revenue-attributed conversion.
- Uses AI Calling and AI Chatbot nodes for high-intent moments.
- Uses the AI (Dev) assistant for structural changes.
- Acts quickly on per-node drop-off signals from the analytics tab.

---

## Navigation

**Entry points to the builder:**

- Flows list → Click a flow row → `/flows-v2/builder/:id` (opens existing journey)
- Flows list → Create Flow → Template or blank → `/flows-v2/builder/new` (opens new journey)

The builder is a full-screen environment. Standard app navigation is suspended for the duration of the builder session.

---

## Core Use Cases

1. Marketer wants to define who enters a journey and under what conditions, before building any steps.
2. Marketer wants to add communication and logic nodes to compose the journey sequence.
3. Marketer wants to connect nodes to define execution order and branching paths.
4. Marketer wants to configure each node — which message to send, how long to wait, how to branch.
5. Marketer wants to assign a name and description to the journey for internal documentation.
6. Marketer wants to publish a journey so real users start entering it.
7. Marketer wants to pause a live journey to safely make changes.
8. Marketer wants to resume a paused journey after verifying changes are correct.
9. Marketer wants to test a journey with test users before going to production.
10. Marketer wants to instruct an AI assistant to make a structural change to the journey.
11. Marketer wants to undo an AI-generated change that wasn't what they intended.
12. Marketer wants to view delivery performance for the journey without leaving the builder.
13. Marketer wants to identify which specific node has the highest user drop-off.
14. Marketer wants to see how user entries have trended over the last 7 days.
15. Marketer wants to download a performance report for the journey.
16. Marketer wants to re-configure the trigger for an existing journey.

---

## User Flow Overview

### Flow 1: Configuring a New Journey's Trigger

When a marketer opens a new journey at `/flows-v2/builder/new`:

1. The trigger configuration wizard opens immediately as a blocking modal. The canvas is not accessible until this is completed or cancelled.
2. **Step 1 — When (Event Configuration):** Marketer selects one or more trigger events from the event catalogue, organized by category. Each trigger group supports attribute-based filter conditions. Multiple trigger groups can be combined with AND / OR logic. An optional exit trigger can be defined — users who fire this event leave the journey immediately regardless of current position.
3. **Step 2 — Who (Audience Configuration):** Marketer defines audience conditions using Include and Exclude blocks. Three condition types are available: User Property (attribute-based), User Behavior (event frequency or recency), User Affinity (predicted interest score). Re-entry limits, global control group exclusions, and flow-level control group settings can also be configured. A live audience count estimate is shown as conditions are edited.
4. Marketer clicks **Save Trigger** → Wizard closes. A Start Trigger node appears on the canvas reflecting the configured event and audience summary. Canvas becomes active.

**Editing the trigger on an existing journey:**
At any time, clicking Edit on the Start Trigger node re-opens the wizard with the existing configuration pre-filled.

**Broadcast path:**
When a Broadcast event type is selected, Step 2 is replaced with a Broadcast Config step: choose Send Now or Schedule (with date and time), and define the target audience for the one-time send.

---

### Flow 2: Building the Journey

1. Marketer browses the Node Palette on the left side of the builder.
2. Marketer adds a node to the canvas by clicking it (places at an auto-calculated position) or dragging and dropping it at a specific canvas position.
3. On the first node drop for a brand-new journey, the flow is created server-side. The URL updates from `/new` to `/flows-v2/builder/:id` with the real flow ID.
4. Marketer selects a node by clicking it. The Right Panel opens to the Config tab with that node's configuration form.
5. Marketer configures the node — selecting templates, setting wait durations, defining split conditions, choosing audience segments, etc.
6. Marketer creates a connection by dragging from an output handle of one node to the input handle of another.
7. Steps 2–6 repeat until the journey is complete.
8. All changes autosave 1,500ms after any edit. The topbar shows the current save state.

---

### Flow 3: Publishing a Journey

1. Marketer clicks the **Active Toggle** in the topbar.
2. The system calls `publishFlow()`. The status badge updates from Draft to Active.
3. Users who match the trigger begin entering the journey in real time.

---

### Flow 4: Pausing and Resuming a Journey

**Pausing:**
1. Marketer clicks the **Active Toggle** on a Live journey.
2. The system calls `pauseFlow()`. Status updates to Paused. No new users enter.
3. Users already mid-journey continue to completion uninterrupted.

**Resuming:**
1. Marketer clicks the **Active Toggle** on a Paused journey.
2. The system calls `resumeFlow()`. Status returns to Active. New entries resume.

---

### Flow 5: Testing a Journey

1. Marketer clicks **Test Flow** in the topbar.
2. Status is set to Test mode.
3. The journey runs only for designated test user profiles. No production users are affected.
4. Marketer validates behavior, then switches to Active when ready for production.

---

### Flow 6: Using AI (Dev) to Modify the Journey

1. Marketer opens the **AI (Dev)** tab in the Right Panel.
2. Marketer types a modification instruction or clicks a suggested prompt (e.g., "Add a 24h wait after WhatsApp", "Add an email fallback if no purchase").
3. The system sends the instruction and the current journey graph to the Dev AI.
4. If the AI response includes a structural modification, the current canvas state is snapshotted and replaced with the revised graph.
5. A confirmation is shown with an **Undo** button active for 5 seconds.
6. If the result is not as intended, marketer clicks **Undo** to revert to the pre-modification state.

---

### Flow 7: Viewing Journey Analytics

1. Marketer opens the **Analytics** tab in the Right Panel.
2. **For a Draft journey:** A placeholder message explains that data is only available after publishing.
3. **For a Live or Paused journey:**
   - Four KPIs are shown: Entered, Completed, Conversion %, Revenue (INR).
   - A 7-day entry trend chart shows daily entry counts.
   - A per-node delivery breakdown lists every node in journey order, with user in/out counts and delivery rate.
4. Marketer identifies the node with the highest drop-off.
5. Marketer switches to the Config tab to adjust that node's configuration.

---

### Flow 8: Saving and Reporting

**Autosave:** Fires automatically 1,500ms after any node or edge change. No action required by the marketer.

**Manual save:** Clicking **Save Journey** in the topbar forces an immediate save outside the autosave debounce — used when the marketer wants to force-save before navigating away.

**Download Report:** Clicking **⋯ More** → **Download Report** exports a journey performance report.

---

## Detailed Functional Requirements

### 1. Journey Identity and Metadata

| Feature | Behaviour |
|---------|-----------|
| Journey name | Editable inline from the topbar. Click to enter edit mode; Enter or blur to save; Escape to cancel. Disabled on new journeys until the flow has been created server-side. |
| Journey description | Editable from the Config tab when no node is selected (Flow Settings state). Free text, for internal documentation purposes. |
| Audience segment display | Read-only in Flow Settings. Shows the audience name and estimated reach derived from the trigger configuration. |
| Back navigation | Returns to the flows list without a confirmation prompt. Autosave ensures changes are not lost. |

---

### 2. Trigger Configuration

| Feature | Behaviour |
|---------|-----------|
| Trigger wizard | Opens as a blocking modal on all new journeys. Canvas cannot be used until the wizard is dismissed. |
| Event-Based triggers | One or more tracked events, organized into categories. Attribute-based filter conditions can be applied per trigger group. Multiple groups combine with AND / OR. |
| Exit trigger | Optional. Users who fire this event exit the journey immediately, regardless of their current step. |
| Broadcast triggers | Replaces Step 2 with a send-timing step (Send Now or Schedule) and audience targeting. |
| Audience — Include | Users matching these conditions will enter the journey when they fire the trigger event. |
| Audience — Exclude | Users matching these conditions are blocked from entering, even if they fire the trigger. |
| User Property condition | Filter on user attributes (e.g., city, plan tier, lifetime value). |
| User Behavior condition | Filter on historical event patterns (e.g., "has purchased more than 3 times in the last 30 days"). |
| User Affinity condition | Filter on AI-predicted interest scores for specific product categories or actions. |
| Re-entry limit | Configures whether and how often a user may re-enter the same journey (e.g., at most once every 7 days). |
| Global control group | Excludes a fixed percentage of eligible users for holdout measurement. |
| Flow control group | Excludes users who are currently active in another specified journey. |
| Audience count estimate | A live count of users matching the current conditions, refreshed as conditions change. |
| Editing the trigger | Clicking Edit on the Start Trigger node opens the wizard with the existing configuration pre-filled. Changes take effect after Save Trigger. |

---

### 3. Canvas — Journey Composition

| Feature | Behaviour |
|---------|-----------|
| Adding nodes (click) | Clicking a node in the palette adds it to the canvas at an automatically calculated non-overlapping position. |
| Adding nodes (drag) | Dragging a node from the palette and dropping it on the canvas places it at the drop coordinates. |
| Moving nodes | Nodes can be freely repositioned by dragging. Position is persisted on the next autosave. |
| Connecting nodes | Dragging from a node's output handle to another node's input handle creates a directed edge. |
| Branching connections | Nodes with multiple outputs (Conditional Split, delivery outcomes) expose named output handles. Each can be connected to a different downstream node. |
| Deleting nodes | Press Backspace or Delete with a node selected. If the node has existing connections, a confirmation dialog is required. |
| Deleting connections | Connections can be removed independently without deleting the nodes they join. |
| Start Trigger protection | The Start Trigger node cannot be deleted. No delete affordance is present; keyboard shortcuts are ignored for it. |
| Canvas navigation | Pan by dragging; zoom with scroll or pinch. Fit-to-view loads the full journey with padding when a flow is first opened. |
| Empty canvas state | When no nodes exist, the canvas displays a prompt to add a node. The canvas remains fully interactive for drops. |
| Minimap overview | A navigable minimap renders the full journey at reduced scale for orientation in large, multi-branch graphs. |
| First node bootstrap | Dropping the first node on a new journey triggers `createFlow()` in the background. The node appears immediately (optimistic). On success, the URL updates to the real flow ID without adding a browser history entry. |

---

### 4. Node Palette

| Feature | Behaviour |
|---------|-----------|
| Node categories | All nodes are organized into categories. Each category can be individually expanded or collapsed. |
| Collapsed mode | When collapsed, the palette shows only category icons. Hovering any icon expands the full palette. |
| Expanded / pinned mode | A pin control holds the palette open permanently. When unpinned, it auto-collapses when the cursor leaves. |
| Search | A search field filters all nodes across all categories in real time by name. The first matching category auto-expands. |
| Recently Used | Displays the last 4 nodes added to the canvas in the current browser session, for quick re-use without browsing. |
| Coming Soon indicator | Nodes not yet available are visible in the palette but non-interactive, with a "Coming soon" label. |
| V2 allow-list | In the V2 builder, only nodes on a curated allow-list are shown. Categories with no visible nodes are hidden. The allow-list is configuration-driven; no component change is required to add or remove nodes. |

---

### 5. Supported Node Types

**Communication nodes — send a message to the user:**

| Node | Channel |
|------|---------|
| WhatsApp | WhatsApp Business messages via pre-approved templates |
| Email | Email with template selection |
| RCS | Rich Communication Services messages |
| SMS | Standard SMS |
| Web Push | Browser push notification |
| Onsite | On-site message (pop-up or banner triggered on-site) |
| In-App | In-app message shown inside the mobile or web app |
| AI Calling | Outbound AI voice call to the user |
| AI Chatbot | AI-powered conversational agent interaction |

**Flow control nodes — control execution path:**

| Node | Function |
|------|---------|
| Conditional Split | Branches the journey based on user attributes, behavior, or delivery outcomes |
| Delay | Holds users at this step for a specified duration before proceeding |
| Start Flow | Triggers a separate journey from within this one |

---

### 6. Right Panel — Config Tab

**No node selected — Flow Settings:**
- Journey name (editable)
- Journey description (editable)
- Audience segment and estimated reach (read-only, derived from trigger)

**Node selected — Node Config:**
Each node type has a dedicated configuration panel. The panel content is specific to the node type and covers message content, delivery settings, output routing, and any channel-specific options. All changes write to the store and trigger autosave.

For unrecognized node types, a generic fallback panel shows a label field and a Delete action.

---

### 7. Right Panel — AI (Dev) Tab

| Feature | Behaviour |
|---------|-----------|
| Instruction input | Free-text textarea. Enter submits the message. Shift+Enter inserts a line break. |
| Suggested prompts | Four pre-written instruction chips (e.g., "Add a 24h wait after WhatsApp", "Add an email fallback if no purchase", "Move SMS before email", "Add an A/B split on the message"). Clicking a chip submits it immediately. |
| Conversation history | The full prior message history for this flow's Dev interactions is loaded and shown on tab open. |
| Structural modification | When the AI returns a graph change, the current canvas is snapshotted and replaced with the new state. |
| Single-step undo | An Undo action is available immediately after any AI modification. It reverts to the pre-modification snapshot. Only the most recent modification is recoverable this way. |
| No-modification response | When the AI replies with advice or a question rather than a structural change, only the conversation thread updates. The canvas is not touched. No snapshot is taken. |

---

### 8. Right Panel — Analytics Tab

| Feature | Behaviour |
|---------|-----------|
| Draft state | Shows an informational placeholder explaining that data collection begins after publishing. The tab is accessible at all times — it is never disabled. |
| Entered | Total users who have entered this journey since it was first published. |
| Completed | Total users who have reached a terminal step (exit point). |
| Conversion % | Percentage of entered users who completed the journey. |
| Revenue | Total INR revenue attributed to this journey. |
| 7-day entry trend | A line chart of daily entry counts for the last 7 days. Used to assess whether the journey is capturing more or fewer users over time. |
| Per-node delivery breakdown | Lists every node in the journey, sorted by canvas position (top to bottom). Each entry shows users in, users out, and delivery rate. Identifies the drop-off point. |

---

### 9. Flow Lifecycle Management

| Status | Meaning | Who enters |
|--------|---------|------------|
| Draft | Created but not published | No one |
| Active | Published and running | All users matching the trigger |
| Paused | Suspended; no new entries | No one (in-flight users continue) |
| Test | Running in test mode only | Designated test profiles only |
| Completed | Broadcast that has finished sending | No one |
| Inactive | Deactivated | No one |

**Lifecycle transitions:**

| From | To | Action | Effect |
|------|----|--------|--------|
| Draft | Active | `publishFlow()` | Journey goes live immediately. |
| Active | Paused | `pauseFlow()` | New entries stop; in-flight users continue uninterrupted. |
| Paused | Active | `resumeFlow()` | New entries resume. |
| Any | Test | Test Flow button | Runs for test users only; no production impact. |

The lifecycle toggle is disabled while any `publishFlow()`, `pauseFlow()`, or `resumeFlow()` call is in-flight, preventing double-execution.

---

### 10. Autosave

| Feature | Behaviour |
|---------|-----------|
| Trigger | Any change to nodes or edges starts a 1,500ms debounce. On expiry, `updateFlow()` is called. |
| First-load guard | After loading from the server, the initial state is recorded as the baseline. Autosave will not immediately fire an identical write. |
| Change detection | If nodes and edges haven't changed since the last successful save, the API call is skipped entirely. |
| Save status indicators | Topbar shows: idle (no indicator), Saving…, Just saved, Saved X minutes ago, Save failed. |
| Save failed handling | On API failure, the indicator shows "Save failed." The canvas remains fully usable. The next edit restarts the debounce. |
| Manual save | The **Save Journey** button forces an immediate save outside the debounce. Typically used before navigating away. |
| Metadata autosave | Name and description edits have their own 1,500ms debounce running in parallel with node/edge autosave. |
| New journey guard | On `/new`, autosave is dormant until the first node is dropped (no flow ID exists to save to). |

---

### 11. AI Global Configuration Wizards

Certain AI node types require a one-time flow-level configuration the first time they are added:

**AI Calling Global Wizard:**
Opens on first selection of an AI Calling node if global configuration has not been set. Captures: voice persona (voice ID), tone (professional / friendly / assertive), and call objective. These settings apply to all AI Calling nodes in this flow.

**AI Chatbot Global Wizard:**
Opens on first selection of an AI Chatbot node without prior global configuration. Captures: tone, agent instructions, agent type, store data access (full / limited), available tools, and handover context. These settings apply to all AI Chatbot nodes in this flow.

Both wizards can be re-opened after initial configuration if changes are needed.

---

## Edge Cases & Constraints

| Scenario | Behaviour |
|----------|-----------|
| First node on a new journey | `createFlow()` runs in the background. Node appears immediately (optimistic). URL updates to real flow ID on success. |
| Hydration guard | Server state hydrates the store exactly once per flow ID. Re-rendering or navigating back to the same flow does not re-hydrate and overwrite local edits. |
| Autosave before flow ID exists | Debounce fires but skips the API call until the flow has been created server-side. |
| Autosave after hydration | The loaded state is set as the saved baseline. No redundant write fires on load. |
| Delete node with connections | Confirmation required. Cancel leaves all nodes and connections intact. |
| Delete Start Trigger node | Not permitted. No delete affordance exists; Backspace/Delete keyboard shortcuts are suppressed for this node. |
| Lifecycle toggle during mutation | Disabled until the in-flight `publishFlow()`, `pauseFlow()`, or `resumeFlow()` call resolves. |
| Name edit before flow ID exists | Name input is disabled until the flow has been created server-side. |
| Save failed — marketer navigates away | No warning shown. Changes since the last successful save may be lost. V1 accepted behavior. |
| AI Dev — no structural change in response | Thread updates; canvas unchanged; no snapshot taken. |
| AI Dev — undo after two modifications | Only the most recent modification is recoverable. Earlier modifications cannot be undone. |
| Trigger wizard cancelled on a new journey | Navigates back to the flows list. No flow is created. |
| Trigger wizard cancelled on an existing journey | Preserves existing trigger configuration. No changes made. |
| Journey with no terminal node | Valid. Nodes without outgoing connections represent terminal steps. Can be published. |
| Store reset on navigation | When the marketer leaves the builder, the store is fully cleared. Re-entering any flow starts from a clean state. |
| Keyboard shortcuts inside text fields | Backspace and Delete do not fire node deletion when the cursor is inside a text input. |

---

## Non-Functional Requirements

### Performance

- The canvas must be interactive within 2 seconds for journeys with up to 50 nodes.
- Autosave API calls must complete within 1 second on standard connectivity.
- Canvas pan and zoom must remain smooth at all zoom levels.

### Reliability

- Autosave failures must not block the marketer from continuing to build or configure.
- Store reset on unmount must be consistent — no state from one flow bleeds into another.
- The hydration guard must prevent duplicate writes when navigating between flows rapidly.

### Usability

- All primary actions — adding nodes, connecting, configuring, publishing — must be available without leaving the canvas page.
- A marketer must never need to navigate to a separate page to complete journey configuration.

---

## User Stories

### Trigger Configuration

**US-01**
*As a marketer, I want to define which event triggers entry into the journey so that only users who take the relevant action are enrolled.*

**US-02**
*As a marketer, I want to apply filter conditions to a trigger event so that only users matching specific criteria enter when they fire the event.*

**US-03**
*As a marketer, I want to combine multiple trigger events with AND / OR logic so that I can capture users who match different combinations of conditions.*

**US-04**
*As a marketer, I want to define an exit trigger so that users who achieve a goal leave the journey immediately rather than continuing through unnecessary steps.*

**US-05**
*As a marketer, I want to define audience inclusion and exclusion conditions so that the right users enter and unqualified users are automatically blocked.*

**US-06**
*As a marketer, I want to use User Property, User Behavior, and User Affinity conditions interchangeably in the same audience block so that I can build precise targeting rules.*

**US-07**
*As a marketer, I want to limit re-entry frequency so that users are not enrolled in the same journey more often than intended.*

**US-08**
*As a marketer, I want to exclude a holdout control group from the journey so that I can measure the incremental impact of running the flow.*

**US-09**
*As a marketer, I want to see an estimated audience count as I configure conditions so that I can validate reach before publishing.*

**US-10**
*As a marketer, I want to edit the trigger at any time after the journey is created so that I can adjust targeting without having to rebuild the flow from scratch.*

**US-11**
*As a marketer, I want to configure a broadcast send with a scheduled date and time so that I can run one-time campaign sends through the same builder.*

**US-12**
*As a marketer, I want to exclude users currently active in another journey so that two flows don't send overlapping messages to the same user at the same time.*

### Canvas & Node Composition

**US-13**
*As a marketer, I want to drag a node from the palette onto the canvas so that I can place it at the exact position I want in the journey.*

**US-14**
*As a marketer, I want to click a node in the palette to add it at a sensible auto-calculated position so that I can build quickly without precise placement.*

**US-15**
*As a marketer, I want to connect two nodes by dragging between handles so that I define the direction of execution flow between steps.*

**US-16**
*As a marketer, I want branching nodes to expose multiple named output handles so that I can route users along different paths depending on the outcome.*

**US-17**
*As a marketer, I want to reposition nodes freely on the canvas so that I can reorganize the journey layout as it evolves.*

**US-18**
*As a marketer, I want to delete a node and its connections in one action so that I can remove a step cleanly without leaving orphan edges.*

**US-19**
*As a marketer, I want the canvas to fit the full journey to view when a flow is loaded so that I can see the entire graph immediately without manually zooming out.*

**US-20**
*As a marketer, I want a minimap so that I can navigate large multi-branch journeys without losing orientation.*

### Node Palette

**US-21**
*As a marketer, I want to search for a node by name so that I can find it immediately without scanning every category.*

**US-22**
*As a marketer, I want a Recently Used list at the top of the palette so that I can re-add nodes I've been using without browsing categories again.*

**US-23**
*As a marketer, I want the palette to collapse to an icon rail and expand on hover so that it does not permanently occupy canvas space.*

**US-24**
*As a marketer, I want to pin the palette open so that I can add multiple nodes in quick succession without the palette collapsing between each one.*

**US-25**
*As a marketer, I want unavailable nodes to be visible but non-interactive in the palette so that I know what's coming without being confused by broken functionality.*

### Node Configuration

**US-26**
*As a marketer, I want to click a node and see its configuration panel open immediately on the right so that I can configure it without navigating away from the canvas.*

**US-27**
*As a marketer, I want the configuration panel content to be specific to the selected node type so that I only see options relevant to the channel I'm configuring.*

**US-28**
*As a marketer, I want my node configuration changes to save automatically so that I don't lose settings if I click away or change tabs.*

**US-29**
*As a marketer, I want to see the journey's name, description, and audience segment when no node is selected so that I can review journey-level context without switching pages.*

**US-30**
*As a marketer, I want to configure a Conditional Split node with attribute, behavior, or delivery outcome conditions so that I can route users to different paths based on who they are or what they did.*

**US-31**
*As a marketer, I want to configure a Delay node with a specific duration so that I can control the timing between steps in the journey.*

**US-32**
*As a marketer, I want to configure a Start Flow node to trigger another journey so that I can modularize complex flows into composable sub-flows.*

### Flow Lifecycle

**US-33**
*As a marketer, I want to publish the journey with a single action so that it goes live immediately without a multi-step approval workflow.*

**US-34**
*As a marketer, I want to pause a live journey so that no new users enter while I make changes, without disrupting users already mid-flow.*

**US-35**
*As a marketer, I want to resume a paused journey so that user entries restart once I've confirmed my changes are correct.*

**US-36**
*As a marketer, I want to run the journey in test mode so that I can validate it with test users before it affects real customers.*

**US-37**
*As a marketer, I want the lifecycle toggle to be non-interactive while a status change is in progress so that I can't accidentally trigger a conflicting state change.*

### Autosave

**US-38**
*As a marketer, I want the system to save my changes automatically after each edit so that I never lose work if I close the tab or lose connectivity.*

**US-39**
*As a marketer, I want to see a "Saving…" indicator so that I know my current change is actively being persisted.*

**US-40**
*As a marketer, I want to see a "Save failed" indicator so that I know I should take action before navigating away.*

**US-41**
*As a marketer, I want a manual Save button so that I can force a save before navigating away even if the debounce hasn't fired yet.*

**US-42**
*As a marketer, I want to see a relative "Saved X ago" timestamp so that I know how recent my last successful save was.*

### AI (Dev) Assistant

**US-43**
*As a marketer, I want to type a natural-language instruction and have the AI modify the journey graph so that I can make structural changes without manually repositioning nodes.*

**US-44**
*As a marketer, I want pre-written suggested prompts in the AI tab so that I can discover what the assistant can do without having to guess the right phrasing.*

**US-45**
*As a marketer, I want to undo an AI modification with one click so that I can immediately revert if the change isn't what I intended.*

**US-46**
*As a marketer, I want the AI's full conversation history to be visible so that I can trace what structural changes have been made over the journey's lifetime.*

**US-47**
*As a marketer, I want the canvas to remain unchanged when the AI responds with text rather than a modification so that informational replies don't accidentally alter my journey.*

**US-48**
*As a marketer, I want to ask the AI to add a fallback path to an existing node so that users who don't engage on one channel are retried on another automatically.*

**US-49**
*As a marketer, I want to ask the AI to reorder steps in the journey so that I can adjust sequencing without manually dragging and reconnecting nodes.*

### Analytics

**US-50**
*As a marketer, I want to see total Entered, Completed, Conversion %, and Revenue for the journey in the builder so that I can assess impact without navigating to a separate analytics page.*

**US-51**
*As a marketer, I want a 7-day entry trend chart so that I can see whether the journey is capturing more or fewer users over time.*

**US-52**
*As a marketer, I want per-node delivery rates listed in journey order so that I can immediately identify the step with the highest user drop-off.*

**US-53**
*As a marketer, I want the analytics tab on a Draft journey to show an explanatory placeholder rather than empty charts so that I understand the system is working correctly.*

**US-54**
*As a marketer, I want to switch between the Config and Analytics tabs freely without the canvas or journey state resetting so that I can cross-reference data and configuration in the same session.*

### Journey Identity & Reporting

**US-55**
*As a marketer, I want to rename the journey from the topbar so that I can update it without navigating to a separate settings page.*

**US-56**
*As a marketer, I want to add a description to the journey so that teammates who open it later understand its purpose.*

**US-57**
*As a marketer, I want to download a performance report for the journey so that I can share results in presentations or offline reports.*

---

## Success Metrics

| Metric | Target (90 days post-launch) |
|--------|------------------------------|
| Journeys published per week | > 50 |
| Autosave API success rate | > 99% |
| % of sessions with at least one successful autosave | > 95% |
| Median time from first node drop to publish | < 15 minutes |
| % of published journeys using 3 or more node types | > 60% |
| AI (Dev) tab interactions per week | > 30 sessions |
| AI modification undo rate | < 25% |
| Analytics tab open rate on Live journeys | > 50% of builder sessions |
