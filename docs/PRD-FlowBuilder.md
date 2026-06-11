# PRD — Flow Builder Layout & Interaction Model

**Version:** 2.0  
**Author:** Product — Engage 360  
**Last Updated:** June 2026

---

## 1. Overview

The Flow Builder is a full-screen, canvas-based flow authoring environment accessed at `/flows-v2/builder/:id`. It completely replaces the product's standard app chrome — no sidebar navigation, no page header — and takes over the entire viewport with its own four-panel layout.

Its job is to let a marketer go from intent ("I want to recover abandoned carts") to a live, multi-channel automated flow without ever leaving the browser tab. Every configuration decision — which message to send, when to wait, how to branch on delivery outcomes — is made inline, directly on or adjacent to the canvas.

The V2 builder is the production-forward version. It shares all infrastructure with V1 (`/flows/builder/:id`) but uses a `FlowVariantContext` and `allowedNodeIds` prop to expose a curated subset of nodes and template styles, without forking any shared component.

---

## 2. Layout Structure

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Top Bar — 52px, full width, always visible                                │
│  [← Back] [Flow Name ▾] [●Live] [Draft] [Test] ···     Saved     [Save ▼] │
├─────────────┬──────────────────────────────────────┬───────────────────────┤
│             │                                      │                       │
│  Node       │   Canvas (ReactFlow)                 │   Right Panel         │
│  Palette    │                                      │   360px               │
│             │   drag-and-drop node graph           │                       │
│  52–268px   │   dot-grid background                │   Config / AI / Stats │
│  collapsible│   zoom · pan · minimap               │                       │
│             │                                      │                       │
└─────────────┴──────────────────────────────────────┴───────────────────────┘
```

The canvas and right panel are wrapped together inside a single `ReactFlowProvider`. The node palette is a sibling — it renders entirely outside ReactFlow's coordinate system and communicates drops to the canvas via the browser's native drag-and-drop API.

The full page height is `calc(100vh - 3rem)` — subtracting the product's outer shell nav height. Overflow is hidden; all scrolling is managed per-panel.

---

## 3. Top Bar

The top bar is the persistent control surface for the flow as a whole. It is 52px tall, always on top, and never scrolls away. It is divided into three groups.

### 3.1 Left Group — flow Identity

**Back arrow** — navigates to `/flows-v2` without confirmation. No dirty-state warning; autosave keeps work safe. In V1 the base path is `/flows`.

**Flow name** — an inline-editable text button. In display mode it truncates at 240px. Clicking it converts to a borderless input with a primary-colored underline. Pressing Enter or blurring commits and calls `updateFlow()`. Pressing Escape cancels. The field is disabled until the flow has a server ID (i.e. until the first node has been dropped and the create API has resolved).

**Active toggle** — a small pill toggle (36×20px) to the right of the name. It drives the three main lifecycle transitions:
- Draft → Active: calls `publishFlow()`. Toast: "Flow is now live 🚀"
- Active → Paused: calls `pauseFlow()`. Toast: "Flow paused"
- Paused → Active: calls `resumeFlow()`. Toast: "Flow resumed"

The toggle is disabled while any of these mutations is in-flight to prevent double-firing.

**Status badge** — a color-coded pill immediately after the toggle. Read-only; driven purely by `meta.status`:

| Status | Color | Meaning |
|--------|-------|---------|
| Draft | Slate | Not yet published; no users can enter |
| Active | Emerald | Live; users enter on trigger |
| Paused | Amber | No new entries; in-flight users continue |
| Test | Violet | Test mode; test users only |
| Inactive | Slate/muted | Manually deactivated |

**Test Flow button** — an outlined pill (`FlaskConical` icon). Sets local status to "test" and shows a toast. It does not publish to production; it flags the flow so it only runs for designated test profiles.

### 3.2 Center — Autosave Indicator

The center of the topbar is reserved for a single-line save status. It is intentionally minimal — it should not draw attention unless something is wrong.

The autosave loop fires 1,500ms after any change to nodes or edges. States cycle as follows:

- **Saving…** — a spinning `Loader2` icon + "Saving…" text. Appears during the debounce window and during the API call itself.
- **Just saved** — immediately after a successful save.
- **Saved Xs ago / Saved Nm ago** — relative timestamp. Recomputes every 30 seconds. Thresholds: < 5s → "Just saved", < 60s → "Saved Xs ago", < 1h → "Saved Nm ago".
- **Save failed** — red text with a `CircleAlert` icon. Appears on API error. The canvas remains fully usable; the indicator is informational, not a blocker.
- **Idle (blank)** — shown before the first save event of the session.

### 3.3 Right Group — Actions

**View Analytics** — navigates to `/flows/builder/:id/analytics`. Disabled until the flow has an ID.

**Save flow** — a filled primary button. Triggers an immediate `updateFlow()` call outside the autosave debounce, for moments when the marketer wants to force-save before navigating away. Shows a `Loader2` spinner while pending.

**⋯ More** — opens a dropdown with one action: **Download Report**. The dropdown closes on outside click.

---

## 4. Node Palette

The node palette occupies the left edge of the builder. It is a collapsible accordion panel that collapses to a 52px icon rail when unpinned and expands to 268px on hover or when pinned. Width transition uses `cubic-bezier(0.4, 0, 0.2, 1)` over 220ms.

### 4.1 Pin vs. Hover Mode

The panel has two operating modes:

**Hover mode (default when unpinned):** The panel expands when the cursor enters and collapses 280ms after the cursor leaves (the delay prevents accidental collapse when dragging slowly). In hover mode, only one category accordion is open at a time.

**Pin mode:** The panel stays permanently expanded. All category accordions default to open. Individual categories can still be collapsed by clicking their header row. Toggled by clicking the pin button in the palette header.

The pin button changes icon between `Pin` (pinnable) and `Lock` (pinned) to reflect current state.

### 4.2 Collapsed State (52px)

When collapsed, the panel shows only a column of category icon buttons. Each icon has a small count badge in the bottom-right corner showing how many nodes that category contains. Hovering any icon triggers the hover-mode expansion.

### 4.3 Expanded State (268px)

The expanded panel has four sections stacked vertically, each revealed with a `max-height` + opacity transition:

**Header row** — pin button on the left, "COMPONENTS" label in small uppercase tracking.

**Search** — a full-width input with a `Search` icon. Filters nodes by name across all categories simultaneously. As the user types, the category accordion auto-expands to reveal the first category with a matching result.

**Recently Used** — a horizontal scroll row showing the last 4 nodes the marketer dragged onto the canvas. Each chip shows the node's icon and short name. Tracked per-session in local component state (not persisted). Initially shows "Drop a node to track it here" in italic placeholder text.

**Category Accordion** — a vertical list of categories. Each category row shows:
- A colored icon in a rounded 30×30px square using the category's color ramp
- Category name
- Node count
- A `ChevronDown` that rotates 180° when the section is open
- A left-edge color accent bar when the section is open

The 10 categories and their accent colors:

| Category | Accent |
|----------|--------|
| Communication | Purple |
| Action | Coral |
| Shopify | Green |
| Integrations | Blue |
| Flow Control | Teal |
| Google Sheets | Green |
| User Profile | Pink |
| Ticket | Amber |
| Notes | Amber |
| Shiprocket Checkout | Teal |

Nodes within an open category render in a 2-column grid. Each node chip is a 26px icon + 10px name label, with a hover scale (1.03×) and press scale (0.97×). Nodes marked `comingSoon` render at 50% opacity with a "Coming soon" badge and are non-interactive.

In V2, the palette receives an `allowedNodeIds` prop. Any node whose ID is not in that list is hidden entirely. The category is still shown if it has at least one visible node; otherwise the category row itself is hidden.

### 4.4 Adding Nodes to the Canvas

Two interaction patterns, both produce the same result in the store:

**Click** — places the node on the canvas at a cascading grid position. The formula is `x = 100 + (index % 3) * 240`, `y = 200 + floor(index / 3) * 160`, where `index` is the current node count. This creates an automatic 3-column staircase layout.

**Drag** — drag from the palette and drop anywhere on the canvas. The drop target position is converted from screen to canvas coordinates by subtracting the canvas wrapper's bounding rect (`wrapperRef.getBoundingClientRect()`), with a −80/−20 pixel center offset so the node's visual center lands near the cursor tip.

Both actions call `onCanvasDrop(newNode)` on the parent page, which calls `upsertNode` on the store and triggers the autosave debounce.

---

## 5. Canvas

The canvas is the central panel. It fills all remaining horizontal space between the palette and the right panel. It is a ReactFlow instance with a dot-grid background, zoom/pan controls, and a minimap.

### 5.1 Visual Chrome

**Background** — ReactFlow `<Background>` component, dot style, gap 20px, size 1px, color `#CBD5E1`. The dots give visual scale for judging spacing without cluttering the authoring surface.

**Controls** — positioned bottom-left. The "toggle interactivity" button is hidden (`showInteractive={false}`) since the builder doesn't need a lock mode.

**MiniMap** — positioned bottom-right. Both pannable and zoomable. Node color is `#CBD5E1`; mask color is `rgba(241,245,249,0.7)` (light slate overlay). The minimap is the fastest way to navigate a large multi-branch flow without losing local context.

**Fit view on load** — the `fitView` prop is set with `padding: 0.25`. When a saved flow is hydrated from the server, the canvas automatically reframes to show all nodes with 25% breathing room on each edge.

**Empty overlay** — when `nodes.length === 0`, a centered frosted-glass card reads: "Drag a node from the left panel, or click one to add it / Then connect channels and logic to build your flow." The card has `pointer-events: none` so it does not interfere with drops onto the empty canvas.

### 5.2 Node Rendering

Each node type is registered in a `nodeTypes` map that wires the type string to its React component. There are 22 registered types:

| Type string | Renderer |
|-------------|----------|
| `start-trigger` | `StartTriggerNode` — flow root, non-deletable |
| `whatsapp` | `WhatsAppNode` |
| `email` | `EmailNode` |
| `sms` | `SMSNode` |
| `rcs` | `RCSNode` |
| `push` | `PushNode` |
| `onsite` | `OnsiteNode` |
| `inapp` | `InAppNode` |
| `aicalling` | `AiCallingNode` |
| `aichatbot` | `AiChatbotNode` |
| `conditionalsplit` | `ConditionalSplitNode` |
| `wait` | `LogicNode` |
| `aipredict` | `AiPredictNode` |
| `startflow` | `StartFlowNode` |
| `razorpay` | `RazorpayNode` |
| `nextbestaction` | `NextBestActionNode` |
| `smartflowoptimizer` | `SmartFlowOptimizerNode` |
| `action` / `channel` / `note` | `ChannelNode` — generic fallback for Shopify, Integrations, AI actions, sticky notes |
| `end` / `goal` | `ExitNode` |

### 5.3 Edge Rendering

All edges use the `smoothstep` type — a curved path that flows naturally between nodes regardless of handle orientation.

Edge styling is dynamically computed from the edge's `sourceHandle` or `label`:
- Handle/label `"yes"` → stroke `#10B981` (emerald/green)
- Handle/label `"no"` → stroke `#EF4444` (red)
- Anything else → stroke `#94A3B8` (slate/neutral)

Every edge has a closed `ArrowClosed` marker at the target end in the same color as its stroke (`strokeWidth: 1.5`). Labels (where present) appear in 11px semibold text inside a white background pill, matching the stroke color. This color convention makes yes/no split outcomes instantly readable in a crowded graph; slate communicates neutral sequential flow.

### 5.4 Interaction Model

**Selecting a node** — clicking any node sets `selectedNodeId` in the Zustand store and opens the right panel to that node's Config tab. Clicking the canvas background deselects and returns the right panel to the FlowSettings view.

**Connecting nodes** — dragging from any output handle to another node's input handle creates a new edge. The edge ID is auto-generated as `e{n}-{source}-{target}`.

**Moving nodes** — standard ReactFlow drag. Position changes are written back to the store via `applyNodeChanges`, which triggers the autosave debounce.

**Deleting nodes** — Backspace or Delete key removes the currently selected node. Ignored when the keyboard focus is in an input, textarea, or contentEditable. If the node has connected edges, a `window.confirm()` asks "Delete this node and its connections?" before proceeding. The `start-trigger` node is not removable by this shortcut. Deletion removes the node and all its incident edges simultaneously.

**ID generation** — `nextId()` generates sequential IDs by finding the highest existing integer ID and incrementing, avoiding collisions with pre-existing nodes.

### 5.5 Autosave Loop

The autosave loop is wired in the page component (`FlowBuilderV2.jsx`) and subscribes to the Zustand `nodes` and `edges` slices. On any change:

1. If `flowId` is not yet set, bail — the flow hasn't been created server-side yet.
2. On the first run after hydration, record the current snapshot as the "already saved" baseline and bail — prevents immediately re-saving data just loaded from the server.
3. If nodes and edges are reference-equal to the last saved snapshot, bail — no change.
4. Otherwise, reset a 1,500ms debounce timer. On expiry: set status to "saving", call `updateFlow(flowId, { nodes, edges })`. On success: update the last-saved snapshot reference, set status to "saved", reset to "idle" after 1,500ms. On failure: set status to "error".
5. If the save response carries a new ID (a seed flow converted to a real flow), update the store ID and replace the URL via React Router.

Meta autosave (name and description) runs on a parallel 1,500ms debounce keyed to `meta.name|meta.description` — same guard pattern, same debounce, separate `lastMetaRef`.

---

## 6. Right Panel

The right panel is a 360px fixed-width aside permanently on the right edge. It cannot be collapsed. It is always in the DOM. Its content shifts based on `selectedNodeId` and the active tab.

The panel is structured as a three-tab sheet:

```
┌────────────────────────────────────┐
│  Config  │  AI (Dev)  │  Analytics │  ← 40px tab strip (h-10)
├────────────────────────────────────┤
│                                    │
│  (active tab content)              │
│  fills remaining height            │
│  scrolls independently             │
│                                    │
└────────────────────────────────────┘
```

The tab strip uses a bottom-border active indicator. Tab labels: "Config", "AI (Dev)", "Analytics".

### 6.1 Config Tab

The Config tab is the primary node-configuration surface. Its content is driven entirely by which node is currently selected.

**No node selected — Flow Settings view:**

When nothing is selected on the canvas, the Config tab renders `<FlowSettings>`:
- **Name** — same inline-editable field as the topbar, kept in sync via `patchMeta`
- **Description** — multi-line textarea for internal documentation
- **Audience segment** — read-only label of the segment name configured in the trigger wizard, plus an estimated user count formatted in Indian numbering (e.g. "~12,400 users")

This makes the Config tab useful as a flow-settings sidebar even when the marketer isn't inside a node.

**Node selected — Node Configuration view:**

Each node type has a dedicated right panel component. The Config tab acts as a router: it reads `node.type`, maps it to the matching panel component, and mounts it as `absolute inset-0 overflow-hidden flex flex-col` so each panel can independently manage its internal scroll height. The types with dedicated panels:

WhatsApp, AiCalling, AiChatbot, RCS, AiPredict, StartFlow, Razorpay, SMS, Push (web push), Onsite, InApp, NextBestAction, SmartFlowOptimizer, Email, ConditionalSplit.

For any unrecognized node type, the generic `<NodeConfig>` fallback renders a label text field and a "Delete" text button that calls `removeNode(id)`.

All panels write back to the store exclusively via `updateNodeData(nodeId, patch)` — a shallow merge into `node.data`. This triggers the canvas to re-render the node card and restarts the autosave debounce.

### 6.2 AI (Dev) Tab

The AI tab surfaces a conversational interface for asking "Dev" — the AI assistant — to make structural changes to the flow as a whole. It is not for configuring individual nodes; it is for issuing high-level intent about the flow shape.

**Header** — a circular grey avatar badge ("D") and the label "Ask Dev to modify this flow".

**Suggested prompts** — four pill buttons above the input field that submit pre-written instructions with a single click:
- "Add a 24h wait after WhatsApp"
- "Add an email fallback if no purchase"
- "Move SMS before email"
- "Add an A/B split on the message"

These serve as entry-point examples for marketers discovering the feature.

**Message thread** — a scrollable list of chat messages loaded from `fetchFlowConversation(flowId)`. User messages are right-aligned in a light-purple bubble. Dev responses are left-aligned next to the "D" avatar. The thread auto-scrolls to the bottom when new messages arrive or while a response is streaming.

**Input** — a `textarea` that auto-expands (min 34px, max 100px). Enter submits; Shift+Enter inserts a newline. A send arrow button appears to the right.

**Modification flow:**
1. On submit, `sendFlowMessage(flowId, content)` is called.
2. If the response includes a `modification` object (with updated `nodes` and `edges`):
   - `takeAiSnapshot()` is called first to snapshot the current canvas state.
   - Nodes and edges are replaced in the store with the AI's new graph.
   - A toast notification confirms "Dev updated the flow" with an **Undo** action.
3. Pressing Undo calls `restoreAiSnapshot()`, reverting to the pre-modification state.

This is a single-level undo scoped exclusively to AI modifications — not a general undo stack. It is the only undo path in the builder.

### 6.3 Analytics Tab

The Analytics tab shows flow-level and node-level performance data. Content is conditional on `meta.status`.

**Draft state** — a single placeholder: "Analytics will light up once this flow is published. Drafts don't collect performance data yet." The tab is always clickable; there is no disabled state, so marketers can discover what they'll see before going live.

**Active / Paused / Inactive state:**

*KPI grid (2×2):*
- **Entered** — total users who have started this flow
- **Completed** — total who reached an Exit node or the flow's end
- **Conversion %** — formatted to 1 decimal place
- **Revenue** — INR formatted: values ≥ 1,00,000 displayed as "₹2.40L"; smaller values use `en-IN` locale

*7-day entry trend chart:*
A Recharts `LineChart` showing daily entries across Mon–Sun. Line color: `#6C3AE8` (primary purple), 2px stroke. Dots are 2px radius, active dots 4px. Y axis auto-scales; X axis shows abbreviated day names. Background uses light slate `CartesianGrid` dashes.

*Per-node delivery breakdown:*
A vertical list of all canvas nodes sorted by their Y position (top-to-bottom flow order). Each row shows:
- Node label (truncated)
- Users in → users out with a computed delivery rate %
- A slim horizontal progress bar (primary purple fill, slate background) proportional to the delivery rate

The delivery rate models attrition: each step retains 65–96% of the previous step's audience, with the rate decaying as the flow progresses. This is a visualization model pending real per-node delivery data from the backend.

---

## 7. State Architecture

All mutable state lives in a single Zustand store (`useFlowBuilderStore`). The store is the single source of truth for everything visible in the builder.

**State slices:**

| Slice | Type | Purpose |
|-------|------|---------|
| `flowId` | `string \| null` | Current flow's server ID |
| `meta` | `{ name, description, status, audience }` | flow metadata |
| `nodes` | `Node[]` | ReactFlow node array |
| `edges` | `Edge[]` | ReactFlow edge array |
| `selectedNodeId` | `string \| null` | Drives right panel content |
| `autosaveStatus` | `"idle" \| "saving" \| "saved" \| "error"` | Topbar indicator |
| `preAiSnapshot` | `{ nodes, edges } \| null` | Single-level AI undo buffer |
| `aiCallingGlobal` | object | Flow-level AI Calling voice/tone config |
| `aiChatbotGlobal` | object | Flow-level AI Chatbot persona/tools config |

**Key design principles:**

- **No local state for node data.** Every node's configuration lives in `node.data` in the store. Right panel components read from the store and write via `updateNodeData`. The canvas card and right panel always reflect the same data without prop threading.
- **Autosave is page-driven, not canvas-driven.** `FlowBuilderV2.jsx` subscribes to `nodes` and `edges` and runs the debounced save. The canvas component does not own persistence.
- **`FlowVariantContext` is the only React context.** It carries V2 feature flags (`allowedTemplateStyleIds`) from the page to the WhatsApp node without prop drilling. Node data is never passed through context.
- **Reset on unmount.** `store.reset()` is called in a `useEffect` cleanup when the builder page unmounts. Navigating away and back always produces a clean slate.

---

## 8. Flow Lifecycle

### 8.1 Creating a New Flow

New flows start at `/flows-v2/builder/new`. At this point the store has no `flowId` and the autosave loop is dormant. The canvas and right panel have `pointer-events: none` while the trigger wizard is open.

Dropping the first node (after the trigger is configured) calls `onCanvasDrop(newNode)`. Because `flowId` is null, this triggers `createFlow({ name: "Untitled flow", nodes, edges })` as a background mutation. On success: the URL is replaced with `/flows-v2/builder/:newId` (using `replace: true` so the browser back button goes to `/flows-v2`, not a dead `/new` URL), and the autosave loop takes over.

### 8.2 Loading an Existing Flow

When navigating to `/flows-v2/builder/:id`, a `useQuery` fetches the flow. On success, `hydrate(flow)` replaces all store state. A `hydratedIdRef` guard ensures `hydrate` is called only once per flow ID — subsequent renders of the same flow do not re-hydrate and wipe local edits made since load.

### 8.3 V2 vs. V1 Differences

The V2 builder is a thin configuration layer on top of identical infrastructure.

| Area | V1 | V2 |
|------|----|----|
| Route | `/flows/builder/:id` | `/flows-v2/builder/:id` |
| Back navigation | `/flows` | `/flows-v2` |
| Visible nodes | All 40+ palette nodes | 12 nodes via `allowedNodeIds` prop |
| WhatsApp template styles | All 9 styles | 5 styles via `FlowVariantContext` |

No component is forked. All filtering is additive — removing items from a list — so V1 never regresses when V2 adds nodes to its allow-list.

---

## 9. Open Questions

1. **Undo/Redo** — The current undo is a single-level snapshot scoped to AI modifications. Is there appetite for a full CTRL+Z stack covering manual node moves and configuration edits?
2. **Concurrent editing** — Two users opening the same flow simultaneously results in last-write-wins. Should the builder show a presence indicator or a "someone else is editing" warning?
3. **Right panel width on small screens** — The right panel is always 360px wide. Should it collapse to zero width on viewports narrower than ~1200px to give the canvas more room?
4. **Dirty state on navigation** — The back arrow navigates immediately because autosave is continuous. But if `autosaveStatus === "error"`, the user could lose recent changes. Should the back arrow show a confirmation in error state?
5. **Per-node analytics data schema** — The per-node breakdown currently uses a modeled attrition function. When real delivery data is available from the backend, what is the shape — does it arrive via `meta.performance` or as a separate API call per node?
