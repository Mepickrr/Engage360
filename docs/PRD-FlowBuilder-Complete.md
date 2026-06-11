# Flow Builder

## Executive Summary

Currently, marketers on Engage 360 can view existing flows and check campaign performance. However, building and publishing a new automated multi-channel journey requires engineering involvement or manual configuration outside the product.

**Objective:**
Build a complete visual Flow Builder experience that lets marketers discover, create, configure, and publish automated customer journeys — entirely within the browser — without any engineering hand-off. This covers three linked areas: the Flows list page, the Flow creation/template page, and the canvas-based builder itself.

This release covers:
- A flows management dashboard with live performance metrics and AI-surfaced insights
- A template library with AI-assisted flow generation
- A full-screen canvas builder with drag-and-drop node composition
- Per-node configuration for 12 communication and logic node types
- Continuous autosave with background persistence
- Flow lifecycle management: Draft → Active → Paused
- Journey-level and per-node analytics within the builder
- An embedded AI assistant ("Dev") for intent-driven flow modifications
- A proactive intelligence layer (Rishi) that surfaces delivery issues
- A growth recommendations layer (Aryan) that suggests new flows to build

---

## Goals & Non-Goals

### Goals

1. Allow marketers to build and publish multi-channel automated journeys without engineering support.
2. Provide a template library — both AI-recommended and categorized by use case — so marketers can start from a proven structure.
3. Surface proactive AI insights on the flows list to identify underperforming journeys before manual discovery.
4. Support drag-and-drop canvas authoring with 12 node types across communication, flow control, and AI channels.
5. Autosave all changes continuously so no work is ever lost.
6. Enable full flow lifecycle management: Draft, Active, Paused, Completed, Archived.
7. Let marketers issue natural-language instructions to modify a flow's structure via an AI assistant.
8. Show journey-level and per-node delivery analytics without leaving the builder.
9. Support a V2 curated node set that can be expanded without rebuilding the builder.

### Non-Goals

- Inbound conversation threading (handling replies as new flow triggers) — separate feature
- A/B test variant management — future scope
- Bulk actions across multiple canvas nodes simultaneously
- General undo/redo stack — only a single AI-modification revert is supported in V1
- Mobile authoring — desktop-only (1280px+ viewport)
- WhatsApp Business Manager template approval workflow — templates must be pre-approved before appearing in the picker

---

## User Personas

**1. Growth Marketer**
- Designs retention and re-engagement flows (cart recovery, winback, onboarding).
- Discovers flow opportunities through AI recommendations.
- Builds using templates, editing them to match their campaign.
- Checks analytics to iterate on conversion and open rates.

**2. CRM Manager**
- Owns lifecycle flows across multiple channels.
- Uses conditional splits and delay nodes to build branched journeys.
- Needs reliable publish/pause controls to manage live flows safely.
- Reviews per-node delivery attrition to identify where users drop off.

**3. Performance Manager**
- Focused on revenue impact — monitors Conversion %, Revenue, and ROI.
- Acts quickly when Rishi surfaces a critical delivery failure.
- Uses the AI (Dev) assistant for structural changes ("add a fallback email after 48h").
- Relies on the flows table's absolute vs. percentage toggle for quick read across campaigns.

**4. Marketing Ops**
- Sets up template flows used by the broader team.
- Manages flow naming, statuses, and lifecycle tagging.
- Exports the flows table as CSV for reporting.
- Accesses archived and completed flows for audit purposes.

---

## Navigation

**Side Menu → Flows** → Flows list page (`/flows-v2`)

**Flows list → Create Flow** → Flow creation page (`/flows-v2/create`)

**Creation page → Use Template / Create from Scratch** → Builder (`/flows-v2/builder/new`)

**Flows list → Flow row** → Builder for that flow (`/flows-v2/builder/:id`)

**Builder topbar → View Analytics** → Full analytics page (`/flows-v2/builder/:id/analytics`)

---

## Page 1: Flows List

The Flows list (`/flows-v2`) is the hub for managing all journeys. It is the landing point from the side menu and provides performance context, AI-driven insights, and access to all flows.

### 1.1 Page Header

The page header shows the page title ("Flows") and a short description of what flows are. A **Create Flow** button on the right navigates to the flow creation page. This is the primary entry point for starting a new journey.

### 1.2 Performance Stats Row

A summary bar of six metrics across all active flows, displayed as cards. A date range selector (Today / Last 7 Days / Last 30 Days / This Month / All Time) controls the window for all metrics. A "View Full Analytics →" link navigates to the full analytics section.

| Metric | What it measures |
|--------|-----------------|
| Active Flows | Count of flows currently in "Live" status |
| Revenue Attributed | Total INR revenue generated by all flows in the selected period |
| Deliverability | Aggregate delivery rate across all channels and flows |
| Users in Flows | Count of users currently mid-journey (live indicator) |
| AI Sessions | Total AI Calling + AI Chatbot sessions initiated from flows |
| Conv. Rate | Aggregate conversion rate across all flows |

### 1.3 Performance Context Strip (Rishi)

A dismissible alert banner surfaced by **Rishi**, the Flow Intelligence agent. It highlights specific flows that need attention (e.g., a flow with low deliverability or a flow that has had no conversions in 7 days). Each alert names the specific flow and the problem. A **Review** action scrolls to the relevant flow row. A dismiss button removes the strip for the session.

This strip does not appear when there are no issues to surface.

### 1.4 AI Analytics Zone (Rishi)

A dismissible card showing a critical performance signal from Rishi — more detailed than the context strip. It identifies a specific flow, the exact failure metric, and the estimated revenue at risk. Two actions are available:

- **Fix now** — opens the AI conversation panel pre-seeded with context about the issue and pins the Rishi agent.
- **View analytics** — navigates to the full analytics page for that flow.

Rishi surfaces this signal from cross-module monitoring. When a critical alert is raised here, it is also escalated to Agent Home.

### 1.5 Growth Engine (Aryan)

A section showing three AI-recommended flow opportunities for the current store, surfaced by **Aryan**, the Growth Agent. Each card has:

- A tier label: **START** (net-new flow to build), **IMPROVE** (enhancement to an existing flow), or **SCALE** (proven pattern to expand)
- Flow name and a data-driven rationale (e.g., "312 similar sellers use this. 2,400 users dropped off in the last 7 days with no recovery flow active.")
- Channel indicators
- A CTA button: "Build with Aryan", "Improve with Aryan", or "Scale with Aryan"

Clicking a CTA opens the AI conversation panel with a pre-seeded brief for that flow, pinned to Aryan.

A "See all opportunities →" link opens a full list of Aryan's recommendations.

### 1.6 AI Flow Assist

An inline prompt input that lets marketers describe a flow in plain text and have it built immediately. Quick-start chips provide one-click prompts for common use cases (e.g., "Re-Engage Inactive Users — Multi-Channel", "Abandoned Cart Reminder", "Post-Delivery Review Request").

Submitting a prompt opens the AI conversation panel seeded with the marketer's description and instructs Dev to design the full flow sequence. This is the fastest path from intent to a built flow.

### 1.7 Flows Table

A data table listing all flows. It combines seed/demo flows (pre-populated examples), API-fetched flows, and local-only flows (created but not yet synced).

**Table Controls:**
- Search by flow name
- Filter by status: All / Live / Draft / Completed / In Progress
- Filter by lifecycle stage: Acquisition / Engagement / Conversion / Retention / Re-engagement
- Export as CSV
- Toggle between absolute numbers and percentage view for delivery metrics

**Table Columns:**

| Column | Content |
|--------|---------|
| Journey Name | Flow name (clickable → opens builder), health indicator dot, lifecycle stage chip, audience type tag, last updated timestamp |
| Channels | Icon chips for each channel used in the flow |
| Sent | Total messages sent across all nodes |
| Delivered | Delivered count or % of sent (toggleable) |
| Opened | Opened count or % of sent |
| Clicked | Clicked count or % of sent |
| Orders | Purchase count attributed |
| Revenue | INR revenue attributed |
| Spent | Estimated cost |
| Status | Toggle (live/paused) + status label with dot indicator |
| Actions | Edit, Analytics, More menu |

**Health Indicators:**
Each flow row has a color-coded health dot indicating delivery health:
- Critical — delivery failure rate above 30%
- Warning — delivery health needs attention
- Healthy — operating within normal range

**Lifecycle Stages:** Acquisition, Engagement, Conversion, Retention, Re-engagement. Assigned by the marketer when creating the trigger, used for filtering.

**Audience Types:**
- All Users — no audience restriction
- Engage360 Identified — users identified via Engage360 tracking
- Known Users — users with known profile data

**Row Actions (More menu):**
Edit, View Analytics, Duplicate, Rename, Archive, Delete, Test, View All Chat

**Pagination:** Rows per page selector (10 / 25 / 50). Shows count of filtered vs. total flows.

---

## Page 2: Flow Creation

The flow creation page (`/flows-v2/create`) is an intermediate step between the flows list and the builder. Its purpose is to give marketers a starting point — either a template or a blank canvas — rather than dropping them straight onto an empty canvas.

### 2.1 AI-Recommended Templates

Three AI-curated template cards at the top of the page, personalized based on the store's current gaps. Each card shows:
- Flow name and description
- An AI-generated insight badge (e.g., "High conversion potential", "3.2x ROI expected")
- Channels used
- A "Use Template" button

These are the highest-confidence recommendations for this specific store at this moment.

### 2.2 Template Library

A searchable library of pre-built flow templates, organized into five categories. Search filters by template name and description. Categories:

| Category | Templates |
|----------|-----------|
| Recommended | Blank canvas, Onboard Customers (Single Channel), Onboard Customers (Multi-channel) |
| Engagement Templates | Abandoned Cart Reminder (Single Channel), Abandoned Cart Reminder (Multi-Channel), Browse Abandonment (Multi-Channel) |
| Conversion Templates | Checkout Recovery (WhatsApp + Email), COD Confirmation (AI Calling) |
| Retention Templates | Post-Purchase Review Request, Post-Purchase Upsell (Bundles) |
| Re-engagement Templates | Win-Back 30 Day Lapsed, Win-Back 60 Day Lapsed |

Each template card shows its name, category, description, and channel icons. Clicking a template loads it pre-populated in the builder.

The **Blank Canvas** option creates an empty builder session without any pre-loaded nodes.

### 2.3 Create from Scratch

A button in the page header that bypasses the template library and goes directly to the empty builder at `/flows-v2/builder/new`.

---

## Page 3: Flow Builder

The Flow Builder (`/flows-v2/builder/:id`) is the canvas-based journey authoring environment. It replaces the app's standard chrome entirely with its own four-panel environment: Top Bar, Node Palette, Canvas, and Right Panel.

### 3.1 Top Bar

The top bar is a persistent header that provides all controls for the journey as a whole.

#### Journey Identity (Left)

| Control | Function |
|---------|----------|
| Back arrow | Returns to `/flows-v2`. No confirmation prompt — autosave keeps work safe. |
| Flow name | Inline-editable. Click to edit, Enter or blur to save, Escape to cancel. Disabled until the flow has been created server-side (i.e., until the first node is dropped). |
| Active toggle | Controls publish / pause / resume. Disabled while a lifecycle mutation is in-flight. |
| Status badge | Read-only. Reflects `meta.status`: Draft, Active, Paused, Test, Inactive. |
| Test Flow button | Puts the flow into test mode. Does not publish to production. Marks the flow to run only for designated test profiles. |

#### Autosave Indicator (Center)

Displays the current save state. Updates in real time as the debounce loop runs.

| State | Trigger |
|-------|---------|
| Blank | Session start, before any change |
| Saving… | During the 1,500ms debounce window or while the API call is in-flight |
| Just saved / Saved Xs ago | After a successful save. Relative timestamp refreshes every 30 seconds. |
| Save failed | API error. Canvas remains usable. Next edit restarts the debounce. |

#### Actions (Right)

| Control | Function |
|---------|----------|
| View Analytics | Opens the full analytics page for this flow. Disabled until the flow has a server ID. |
| Save Journey | Forces an immediate save outside the autosave debounce. |
| More (⋯) | Dropdown: Download Report. |

---

### 3.2 Node Palette

The node palette is the left-edge panel from which marketers add nodes to the canvas. It can be in collapsed (icon rail) or expanded (full panel) mode.

#### Modes

**Collapsed:** Shows only category icons with a count badge. Hovering any icon expands the full panel.

**Hover mode (default):** Expands when the cursor enters and collapses after the cursor leaves. In hover mode, only one category section is open at a time.

**Pinned mode:** The panel stays permanently expanded. Toggled by clicking the pin button. All categories are open by default; individual categories can still be collapsed.

#### Search

A search input filters all nodes by name across all categories simultaneously. As the user types, the first matching category auto-expands.

#### Recently Used

Shows the last 4 nodes dragged onto the canvas in the current session. Per-session only; not persisted. Allows quick reuse of frequently-used nodes without navigating the category list.

#### Category Accordion

Nodes are organized into 10 categories. In V2, only nodes on the V2 allow-list are shown. A category that has no visible nodes is hidden entirely.

| Category | V2 Nodes Visible |
|----------|-----------------|
| Communication | WhatsApp, Email, RCS, SMS, Web Push, Onsite, In-App, AI Calling, AI Chatbot |
| Flow Control | Conditional Split, Delay, Start Flow |
| Action, Shopify, Integrations, etc. | Hidden in V2 (available in V1) |

Nodes marked as "coming soon" are shown in the palette but are not interactive.

#### Adding Nodes

**Click:** Places the node at a pre-calculated position on the canvas. The position cascades automatically to avoid overlap with existing nodes.

**Drag:** Drag from the palette and drop at any point on the canvas. The node is placed at the drop position.

Both paths add the node to the canvas immediately and trigger autosave.

---

### 3.3 Canvas

The canvas is the central panel where the journey graph is composed. It is a ReactFlow-based interactive surface supporting pan, zoom, and node manipulation.

#### Node Composition

Nodes represent steps in the journey. They are connected by edges that define the execution path. Each node has:
- Input handles (incoming connections from upstream nodes)
- Output handles (outgoing connections to downstream nodes)
- Labeled handles on branching nodes (e.g., "yes" / "no" on Conditional Split)

#### Edge Routing and Branching

Edges connect node outputs to node inputs. On branching nodes, each output handle produces a named edge representing a specific outcome:
- Positive branches (e.g., "yes", "delivered", "read") — visually distinct from negative branches
- Negative branches (e.g., "no", "failed", "no response") — visually distinct
- Neutral sequential edges — connect non-branching nodes

This visual distinction lets marketers immediately see the decision logic without reading labels.

#### Canvas Interactions

| Interaction | Behaviour |
|-------------|-----------|
| Click a node | Selects it. Opens the Right Panel to that node's Config tab. |
| Click canvas background | Deselects. Right Panel returns to Flow Settings view. |
| Drag from handle to handle | Creates an edge between two nodes. |
| Drag a node | Moves it. Position change is persisted via autosave. |
| Backspace / Delete key | Deletes the selected node. Asks for confirmation if the node has connected edges. The start-trigger node cannot be deleted this way. |
| Scroll or pinch | Zoom in/out. |
| Drag canvas | Pan the view. |

#### Empty Canvas State

When no nodes are on the canvas, a centred prompt appears: "Drag a node from the left panel, or click one to add it. Then connect channels and logic to build your journey." This does not block drops.

#### Fit View on Load

When a saved flow is opened, the canvas automatically frames to show all nodes with padding on every side. This ensures the full journey is immediately visible regardless of how many nodes it contains.

#### Canvas Overlays

- **Background grid** — a subtle dot grid that provides visual reference for spacing and alignment.
- **Controls** — standard zoom in/out and fit-view controls.
- **Mini-map** — a small overview of the full canvas in the corner. Pannable and zoomable, useful for navigating large journeys.

---

### 3.4 Node Types

The builder supports the following node types in V2:

**Communication Nodes** — send a message to the user via a specific channel:

| Node | Channel |
|------|---------|
| WhatsApp | WhatsApp Business messages (9 template styles) |
| Email | Email with template editor |
| RCS | Rich Communication Services messages |
| SMS | Standard SMS |
| Web Push | Browser push notification |
| Onsite | On-site pop-up or banner |
| In-App | In-app message (mobile/web) |
| AI Calling | Outbound AI voice call |
| AI Chatbot | AI conversational agent (chat) |

**Flow Control Nodes** — modify the journey's execution path:

| Node | Function |
|------|---------|
| Conditional Split | Branches the journey based on user attributes, events, or delivery outcomes |
| Delay | Holds users for a defined time before proceeding to the next step |
| Start Flow | Triggers a separate flow from within this journey |

**Structural Nodes** (non-removable):

| Node | Function |
|------|---------|
| Start Trigger | The root of every journey. Defines who enters and when. Cannot be deleted. |
| Exit | Marks the end of a journey path. |

---

### 3.5 Start Trigger

When a new flow is opened for the first time, a trigger configuration wizard opens as a blocking modal. The canvas is not usable until the trigger is configured or the user navigates back. Cancelling on a new flow returns to the flows list.

The wizard has two steps:

**Step 1 — When (Trigger Events)**
- Select one or more trigger groups from the event catalogue. Events are organized into headers (Broadcast, Customer, Order, Product, etc.) and specific event types within each.
- Each trigger group can have filter conditions (attribute + operator + value).
- Multiple groups combine with AND / OR via a combinator.
- An Exit Trigger can optionally be defined — when a user fires this event, they leave the journey immediately regardless of their current step.

**Step 2 — Who (Audience Targeting)**
- **Include** conditions define which users can enter.
- **Exclude** conditions define who is explicitly blocked from entering.
- Three condition types: **User Property** (attribute-based, e.g. city = Mumbai), **User Behavior** (event-frequency, e.g. "added to cart > 2 times in last 7 days"), **User Affinity** (predicted interest scores).
- Conditions within a section combine with AND / OR.
- **Re-entry limit** — controls how many times a user can enter the flow (e.g., "at most 1 time per 7 days").
- **Global control group** — exclude a percentage of users for holdout / incrementality analysis.
- **Flow control group** — exclude users who are currently in another specified active flow.
- A live audience count estimate is shown at the bottom.

**Broadcast path:**
When the selected trigger belongs to the Broadcast category, Step 2 is replaced with a Broadcast Config step:
- Send now or schedule (date and time picker)
- Audience: All users or a filtered segment

After completing the wizard, a non-removable Start Trigger node appears on the canvas. It shows the configured event name and audience summary. An Edit button re-opens the wizard at any time.

---

### 3.6 Right Panel

The right panel is always present and provides three tabs. The active tab's content changes based on context.

#### Config Tab

When no node is selected, the Config tab shows **Flow Settings**:
- Journey name (editable, synced with the topbar name field)
- Description (free text, for internal documentation)
- Audience segment (read-only display of the trigger audience, including an estimated user count)

When a node is selected, the Config tab shows that node's configuration panel. Each node type has a dedicated configuration experience. All configuration changes write back to the store and trigger autosave.

The following nodes have dedicated right panel components:
WhatsApp, Email, SMS, RCS, Web Push, Onsite, In-App, AI Calling, AI Chatbot, Conditional Split, Delay, Start Flow, Razorpay, AI Predict, Next Best Action, Smart Flow Optimizer.

Unrecognized node types show a generic panel with a label field and a Delete button.

#### AI (Dev) Tab

A conversational interface for issuing high-level structural modifications to the journey. This is not for configuring individual nodes — it is for describing changes to the journey shape in plain language.

**Suggested prompts** (pre-written, one-click):
- "Add a 24h wait after WhatsApp"
- "Add an email fallback if no purchase"
- "Move SMS before email"
- "Add an A/B split on the message"

**How it works:**
1. Marketer types an instruction or clicks a suggested prompt.
2. System sends the message along with the current flow graph to the Dev AI.
3. If the response contains a graph modification, the current state is snapshotted and the canvas is replaced with the new graph.
4. A toast notification confirms the change with an **Undo** option.
5. Pressing Undo reverts the canvas to the pre-modification snapshot.

This is a single-level undo, scoped only to AI modifications. There is no general undo stack.

#### Analytics Tab

Shows journey performance data.

**Draft state:** A placeholder message explains that data is only collected once the flow is published.

**Published state:**

*KPIs (four cards):*
- Entered — total users who have started this journey
- Completed — total who have reached an exit point
- Conversion % — percentage of entered users who converted
- Revenue — total INR revenue attributed to this journey

*7-day entry trend:* A line chart showing daily entries across the last 7 days. Helps identify whether a journey's audience intake is growing, stable, or declining.

*Per-node delivery breakdown:* A list of all canvas nodes sorted by their position in the journey (top to bottom). Each row shows:
- Node name
- Users in vs. users out
- Delivery rate as a percentage
- A progress bar reflecting the delivery rate

This breakdown helps marketers identify the specific node where users drop off, so they can focus optimization on the highest-attrition step.

---

## Autosave & Persistence

The autosave system ensures no work is lost regardless of browser events or connectivity issues.

**How it works:**
- Any change to nodes or edges starts a 1,500ms debounce timer.
- On expiry, `updateFlow()` is called with the current graph.
- The first render after loading an existing flow does not trigger a save (guard prevents immediately re-saving data just loaded from the server).
- If nodes and edges haven't changed since the last successful save, autosave skips the API call.
- On API error, the indicator shows "Save failed" but the canvas remains fully usable.
- Flow metadata (name, description) has its own parallel autosave on a 1,500ms debounce.

**New flow bootstrap:**
On `/flows-v2/builder/new`, autosave is dormant until the first node is dropped. Dropping the first node triggers a `createFlow()` API call. On success, the URL updates to `/flows-v2/builder/:newId` without adding a history entry.

**Hydration guard:**
When loading an existing flow, the server data hydrates the store exactly once (guarded by the flow ID). Rapid navigation between flows does not cause stale state to bleed across sessions.

**Store reset on navigation:**
When the marketer navigates away from the builder, the store is fully reset. Returning to any flow always starts from a clean state.

---

## Flow Lifecycle

| Status | Meaning | Who can enter |
|--------|---------|--------------|
| Draft | Not published. Canvas is editable. | Nobody |
| Active (Live) | Published and running. | All users matching the trigger |
| Paused | No new entries. In-flight users continue to completion. | Nobody new |
| Test | Running in test mode only. | Designated test profiles only |
| Completed | A one-time broadcast that has finished sending. | Nobody |
| Inactive | Manually deactivated. | Nobody |

**Lifecycle transitions:**
- Draft → Active: `publishFlow()` — becomes live immediately.
- Active → Paused: `pauseFlow()` — stops new entries, does not interrupt in-flight users.
- Paused → Active: `resumeFlow()` — resumes accepting new entries.
- Any → Test: Test Flow button in topbar — runs for test users only without affecting production.

---

## AI Agent Integration

The Flow Builder ecosystem is integrated with three AI agents that each serve a distinct purpose:

### Dev (Flow Modification Agent)
Lives inside the builder's AI (Dev) tab. Accepts natural-language instructions and modifies the journey graph in response. Provides a single-step undo for every modification. Surfaced as a chat interface inside the right panel.

### Rishi (Flow Intelligence Agent)
Lives on the flows list page. Monitors the performance of all active flows across delivery, revenue, and engagement signals. Surfaces critical issues proactively (e.g., "Cart Recovery WhatsApp delivery failed 44% in last 24h — ₹84,200 revenue at risk"). Provides a direct "Fix now" action that opens a pre-seeded conversation. Issues escalated by Rishi also appear in Agent Home for cross-module awareness.

### Aryan (Growth Agent)
Lives on the flows list page. Analyzes the store's current flow portfolio and segment data to identify missing journeys with high expected impact. Recommends new flows under START / IMPROVE / SCALE tiers. Provides a pre-seeded conversation brief so the marketer can begin building immediately. Surfaced as growth cards and a "See all opportunities" view.

All three agents integrate with the centralized AI conversation panel (`openWith()`), which accepts a seed message, a pinned agent, and a source identifier for tracking.

---

## Seed Flows (Demo Journeys)

The product ships with pre-populated demo flows that appear on the flows list before a seller has built any real journeys. These flows:
- Show realistic names (Cart Recovery, Welcome Series, COD Confirmation, etc.)
- Have pre-set lifecycle stages, channels, and health indicators
- Display sample performance metrics (Sent, Delivered, Revenue, etc.)
- Are marked with a "Demo" tag in the flows table
- Can be opened in the builder to explore how a real flow is structured

Seed flows are filtered out of the table when real API flows with the same ID are returned. They serve as onboarding scaffolding and discovery aids.

---

## Flow Management Actions

Available from the flows table row's More menu:

| Action | Behaviour |
|--------|-----------|
| Edit | Opens the builder for that flow |
| View Analytics | Opens the full analytics page |
| Duplicate | Creates a copy of the flow as a new draft. Copy inherits all nodes, edges, and configuration. |
| Rename | Inline rename without opening the builder |
| Archive | Moves the flow to an archived state (not deleted, not visible in the default table view) |
| Delete | Permanently removes the flow. Irreversible. |
| Test | Puts the flow into test mode |
| View All Chat | Opens the conversation history for this flow's Dev AI interactions |

---

## Edge Cases & Constraints

| Scenario | Behaviour |
|----------|-----------|
| New flow, first node drop | `createFlow()` is called. The node is shown on canvas immediately (optimistic). URL updates to real ID on success. |
| Hydrating an existing flow | Hydration runs once per flow ID. Subsequent renders of the same flow do not re-hydrate. |
| Autosave when no flowId | Debounce fires but the API call is skipped until the flow is created. |
| Autosave on first load | The initial server snapshot is stored as baseline. Autosave does not fire an identical write on the first render. |
| Deleting a node with connections | `confirm()` dialog required before deletion. Node and edges remain if cancelled. |
| Deleting the Start Trigger node | Not permitted via keyboard. No delete option shown in its right panel. |
| Lifecycle toggle mid-mutation | Toggle disabled while a `publishFlow()`, `pauseFlow()`, or `resumeFlow()` call is in-flight. |
| Flow name edit before flowId | Name input disabled until flow is created server-side. |
| Autosave API error | Status shows "Save failed". Canvas remains fully usable. Next edit restarts the debounce. |
| Dev AI returns no modification | Conversation thread updates with Dev's text response. Canvas is unchanged. No snapshot is taken. |
| Dev AI undo after a second edit | Undo reverts only the most recent AI modification. There is no stacked undo history. |
| Navigating back mid-edit | No confirmation prompt. Autosave is continuous. If `autosaveStatus === "error"`, changes since the last successful save may be lost. |
| Store reset on unmount | Store is cleared when the marketer navigates away. Re-entering any flow always starts fresh. |
| Seed flows in table | Seed flows are shown until API flows with matching IDs are returned. They are always marked "Demo" and never overwrite real data. |
| Template loaded from creation page | Template pre-populates nodes and edges in the builder. Behaves identically to a manually-built flow from that point forward. |

---

## Non-Functional Requirements

### Performance
- The flows table must load within 2 seconds for up to 200 flows.
- The builder canvas must become interactive in under 2 seconds for flows with up to 50 nodes.
- Autosave API calls should complete within 1 second on a standard connection.
- Canvas pan and zoom must not stutter on modern desktop browsers.

### Reliability
- Autosave failures must not block building or configuration.
- The hydration guard must prevent stale state when navigating rapidly between flows.
- Store reset on unmount must be consistent — no state bleed between different flows.

### Usability
- All primary actions (add node, connect, configure, publish) must be completable without leaving the canvas.
- The flows table must support both absolute and percentage views for metric columns.
- Flow creation must be accessible via both a template path and a blank canvas path.
- Marketers must be able to see which flows need attention without opening each one individually (Rishi strip).

### Security
- Flow data is scoped to the authenticated organization. Cross-org access is not permitted.
- Node configuration data (template content, credentials) must not be logged in production environments.

---

## User Stories

### Flows List

**US-01**
*As a marketer, I want to see a summary of all my flows' performance on the list page so that I can get a quick health check without opening each flow.*

**US-02**
*As a marketer, I want to be alerted when a live flow is experiencing delivery failures so that I can act before significant revenue is lost.*

**US-03**
*As a marketer, I want AI-recommended flow opportunities specific to my store so that I know which journeys to build next.*

**US-04**
*As a marketer, I want to search and filter my flows by status and lifecycle stage so that I can find the flow I'm looking for quickly.*

**US-05**
*As a marketer, I want to toggle a flow's live/paused status directly from the table so that I don't have to open the builder for simple lifecycle changes.*

**US-06**
*As a marketing ops person, I want to export the flows table as CSV so that I can include it in reporting.*

**US-07**
*As a marketer, I want to see flows in both absolute numbers and percentage view so that I can compare performance across flows of different sizes.*

### Flow Creation

**US-08**
*As a marketer, I want to see AI-recommended templates based on my store's data so that I start from a high-confidence proven structure rather than a blank canvas.*

**US-09**
*As a marketer, I want to search the template library by use case so that I can find a relevant starting point quickly.*

**US-10**
*As a marketer, I want to describe a flow in plain text and have it built automatically so that I can go from intent to a draft flow in seconds.*

**US-11**
*As a marketer, I want a blank canvas option so that I can build a completely custom flow without being constrained by a template.*

### Journey Building

**US-12**
*As a marketer, I want to drag nodes from a categorized palette onto the canvas so that I can compose a journey visually.*

**US-13**
*As a marketer, I want to click a node in the palette to add it at a sensible position so that I can build quickly without precise dragging.*

**US-14**
*As a marketer, I want to connect nodes by dragging between their handles so that I can define the execution path of the journey.*

**US-15**
*As a marketer, I want to search for a node by name in the palette so that I don't have to scan all categories.*

**US-16**
*As a marketer, I want to see my recently used nodes at the top of the palette so that I can reuse them quickly.*

**US-17**
*As a marketer, I want the palette to expand on hover and stay expanded when pinned so that I can work in the mode that suits me.*

### Configuration

**US-18**
*As a marketer, I want to click a node and see its configuration panel on the right so that I can configure it without navigating away from the canvas.*

**US-19**
*As a marketer, I want to edit the journey name directly from the top bar so that I can rename flows without going to a settings page.*

**US-20**
*As a marketer, I want to see the audience segment and estimated reach in the config panel so that I understand who will enter this journey before publishing.*

**US-21**
*As a marketer, I want to delete a node with the Backspace key so that I can remove steps quickly without right-click menus.*

### Autosave & Lifecycle

**US-22**
*As a marketer, I want the system to autosave every change so that I never lose my work if I close the tab or get disconnected.*

**US-23**
*As a marketer, I want to see the save status in the topbar so that I always know whether my last change was persisted.*

**US-24**
*As a marketer, I want to publish a journey with one click so that it goes live immediately.*

**US-25**
*As a marketer, I want to pause a live journey so that new users stop entering while I make changes, without interrupting users already in the flow.*

**US-26**
*As a marketer, I want to test a flow before publishing so that I can verify it with test users before it reaches real customers.*

### AI (Dev) Assistant

**US-27**
*As a marketer, I want to type a natural-language instruction so that the AI can make structural changes to my journey without me manually moving nodes.*

**US-28**
*As a marketer, I want suggested prompts in the AI tab so that I can discover what the assistant can do without guessing.*

**US-29**
*As a marketer, I want a one-click undo after an AI modification so that I can revert if the change isn't what I wanted.*

### Analytics

**US-30**
*As a marketer, I want to see KPIs for a journey directly in the builder so that I don't have to navigate to a separate page for a quick check.*

**US-31**
*As a marketer, I want to see a 7-day entry trend so that I can spot whether the journey's reach is growing or shrinking.*

**US-32**
*As a marketer, I want per-node delivery rates sorted by journey position so that I can identify exactly where users are dropping off.*

**US-33**
*As a marketer, I want the analytics tab to show a placeholder on draft flows so that I understand why data isn't available yet.*

---

## Success Metrics

| Metric | Target (90 days post-launch) |
|--------|------------------------------|
| Flows created and published per week | > 50 |
| % of sessions with at least one successful autosave | > 95% |
| Autosave API success rate | > 99% |
| Median time from "Create Flow" to first publish | < 15 minutes |
| % of new flows started from a template | > 50% |
| % of flows using 3+ node types | > 60% |
| AI Flow Assist prompts submitted per week | > 100 |
| AI (Dev) tab sessions per week in builder | > 30 |
| Rishi alert "Fix now" click-through rate | > 40% |
| Aryan growth card CTA click-through rate | > 25% |
