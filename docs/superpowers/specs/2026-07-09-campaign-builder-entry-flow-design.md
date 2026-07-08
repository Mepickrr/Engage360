# Campaign Builder — "+ New Campaign" Entry Flow

**Status:** Design spec, scoped to the entry flow only (button click → landing canvas state).

**Relationship to prior spec:** This builds on `Campaign Builder.md` (the original Broadcast/Campaign product spec) but supersedes it on one point (Section 0): primary channel is no longer hardcoded to WhatsApp. Everything else in that doc (naming, data model, Trigger Condition semantics, channel field-applicability table) still applies conceptually — this spec re-grounds the *implementation mechanism* in the existing Flow Builder codebase instead of a bespoke linear-list UI.

## 0. Context (as found in the codebase)

- `src/pages/Campaigns.jsx` is a static mock page today. Its "New campaign" button (`data-testid="campaigns-new-btn"`) only calls `previewToast()` — there is no real creation flow.
- `src/pages/FlowBuilderV2.jsx` is the working reference implementation for a canvas-based builder: on `/flows-v2/builder/new` it opens `StartTriggerWizard`, and on completion places a `start-trigger-node` on the canvas, then autosaves via `createFlow`/`updateFlow`.
- `StartTriggerWizard.jsx` already has a "broadcast" path: if the selected event card's header is `"Broadcast"` (from `eventCatalogue.json`), it either routes to `BroadcastSourceStep1/2` (CSV/segment audience) or straight to `BroadcastConfig` (schedule + audience, no channel field — implicitly WhatsApp-only today).
- Channel nodes (`WhatsAppNode/`, and the equivalent Email/SMS/RCS/AI Calling nodes) are self-contained folders: canvas visual (`index.jsx`) + config panel (`<Channel>RightPanel.jsx`) + defaults (`data/*.js`). `WhatsAppRightPanel.jsx` already implements a `fallback: { enabled, template }` toggle backed by a shared `TemplatePicker`.

## 1. Goal of this design

Define what happens from the seller clicking **"+ New Campaign"** through landing in a working builder canvas with the first (primary) step already configured and wired — reusing Flow Builder's existing canvas machinery rather than building a parallel linear-list UI.

**Explicitly out of scope for this pass** (follow-up design docs): Save Draft / Save & Schedule modal, Audience Summary Card, per-step config sections beyond content reuse (Delivery Optimization, Template Resilience UTM/validity-window details), campaign list/data persistence wiring beyond the tagging note in Section 7.

## 2. Entry point

`Campaigns.jsx`'s "New campaign" button navigates to a new route, e.g. `/campaigns-v2/builder/new`, served by a new page component `CampaignBuilderV2.jsx`.

`CampaignBuilderV2.jsx` reuses `FlowBuilderV2`'s infrastructure as-is: `useFlowBuilderStore`, `Canvas`, `NodePalette`, `RightPanel`, `BuilderTopbar`, the autosave debounce logic, and the `createFlow`/`fetchFlow`/`updateFlow` calls. The only behavioral difference on `isNew`:

- Flow Builder opens the full `StartTriggerWizard` (event catalogue picker → step1/step2).
- Campaign Builder opens a new, lightweight **`CampaignChannelPickerModal`** instead.

Canvas + right panel stay pointer-blocked underneath while the modal is open, matching `FlowBuilderV2.jsx`'s existing `pointerEvents: "none"` pattern during `triggerModalOpen`.

## 3. Channel picker modal

A single-step modal, shown immediately on landing at the `/new` route:

- 5 channel cards: **WhatsApp, Email, RCS, SMS, AI Voice**.
- "Continue" is disabled until one card is selected.
- Closing without selecting (back arrow / escape) navigates back to `/campaigns`, mirroring `FlowBuilderV2.jsx`'s `triggerConfigured` ref check on `onClose`.
- This supersedes the original spec's V1 WhatsApp-only lock — all 5 channels are selectable as primary.

## 4. Canvas landing state (auto-wired on "Continue")

Selecting a channel and clicking "Continue" closes the modal and places two nodes plus a connecting edge on the canvas in one action:

1. **`start-trigger-node`** (same node type Flow Builder uses), with
   `data.config = { kind: "broadcast", broadcast: { schedule_kind: "now", audience_kind: "all" } }` — reusing `BroadcastConfig`'s existing state shape verbatim, since it already models schedule + audience with no channel dependency.
2. **Primary channel node** — the exact same node component Flow Builder uses for that channel (`whatsapp` / `email` / `rcs` / `sms` / `aicallingv2`), with `data.isPrimary = true` and `data.locked = true`.
3. An edge connecting `start-trigger-node → primary channel node`.

**Locking rule:** `data.locked = true` marks a node as non-deletable and non-draggable-before-start, per the original spec's "Step 0 is fixed" rule (Section 4.2). `Canvas.jsx`/`RightPanel.jsx` must check this flag and refuse delete/reorder-above-start actions for locked nodes. This is the only Canvas/RightPanel behavior change needed for entry-flow purposes — everything else (adding nodes, editing content) uses existing, unmodified affordances.

Broadcast name defaults to `"Untitled Broadcast {n}"`, editable later (per original spec Section 4.1); not part of the entry modal.

## 5. Canvas remains a constrained tree, not a general flow

The canvas is literally Flow Builder's `Canvas`/`NodePalette`/`ReactFlowProvider`, not a bespoke component — but the campaign's underlying data model (Broadcast → SequenceStep[], per the original spec's Section 2) is still a tree, not a general graph:

- Follow-up nodes may branch (e.g. two SMS follow-ups off one WhatsApp send with different trigger conditions) — matches the original spec's repeatable-channel rule (Section 4.2).
- No loops, no multi-parent merges. Each follow-up node has exactly one incoming edge, carrying its Trigger Condition.
- Node palette / add-node interaction is unchanged from what Flow Builder already provides today — not redesigned as part of this pass.

## 6. Trigger Condition on edges (not nodes)

A follow-up step's Trigger Condition (reference step, delay/behavior — the original spec's Section 5) is **not** a separate node. It's carried by the connecting edge:

- The edge renders a small badge (e.g. `ON FAILED`, `+2h DELAY`, `ON 12 Aug 9:00 AM`), matching the step-card badge concept from the original spec's Section 4.2.
- Clicking the badge opens a config popover for that condition — same fields as the original Trigger Condition component (reference step / condition type / behavior / delay), extended per Section 6 below.

### 6.1 Timing mode: relative delay vs. specific date/time

`TriggerCondition` gains a mode toggle, either/or (not combined):

- **"Delay after previous step"** (existing behavior) — `delay: { value: number, unit: 'minutes' | 'hours' | 'days' }`, relative to the reference step.
- **"On a specific date & time"** (new) — `fire_at: <ISO datetime>`, an absolute picker, independent of when the reference step actually fires.

Switching modes clears the other mode's fields. This applies only to non-primary (follow-up) steps — the primary step's timing is governed by the Broadcast's own `schedule` (Section 4 above), not a Trigger Condition.

## 7. Per-step content configuration reuses Flow Builder nodes directly

No new content-picker UI is built for the Campaign Builder. Each node's `RightPanel` is the same component Flow Builder already ships:

- **WhatsApp** → `WhatsAppRightPanel.jsx`, including its existing standard-template picker and `fallback: { enabled, template }` toggle (this satisfies the original spec's Section 1 "Fallback Template" concept — no new component needed).
- **Email / SMS / RCS** → their respective existing `<Channel>RightPanel.jsx` content pickers.
- **AI Voice** → the existing AI Calling node's script/voice-line config.

The "same node components, campaign-mode flag" approach (confirmed earlier) means a context flag distinguishes Campaign vs. Flow usage so campaign-only fields (audience badge, trigger-condition badge, `isPrimary`/`locked` behavior) render alongside the untouched content UI — the actual template/script selection never forks between the two builders.

## 8. Open item: distinguishing Campaigns from Flows in storage

Today `createFlow`/`fetchFlow` (`src/lib/flowsApi.js`) and `Campaigns.jsx`'s list are both mock/static — there's no real backend field distinguishing a "Campaign" doc from a "Flow" doc. This design assumes a `type: 'campaign'` field gets passed to `createFlow` when a Campaign Builder session is bootstrapped, so `Campaigns.jsx` can eventually list real campaign docs instead of static `ROWS`. Wiring this end-to-end (API shape, list page query) is flagged as a follow-up design item, not solved here.

## 9. Out of scope (follow-up design passes)

- Save Draft / Save & Schedule modal (original spec Section 8).
- Audience Summary Card, live recalculation, AI suggestions (original spec Section 3).
- Delivery Optimization / Template Resilience / Compliance sections beyond the content-reuse note in Section 7 (original spec Sections 4.3 B/C/D).
- Full add-follow-up node UX (kept exactly as Flow Builder already implements it).
- Campaign list page real data wiring (Section 8 above).
