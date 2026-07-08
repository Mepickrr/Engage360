# Campaign Builder — "+ New Campaign" Entry Flow

**Status:** Design spec, scoped to the entry flow only (button click → landing builder state).

**Relationship to prior spec:** This builds on `Campaign Builder.md` (the original Broadcast/Campaign product spec) and, after reviewing a reference screenshot of the actual target UI, **confirms** rather than overrides its Section 4 architecture: a linear left Sequence Panel (step cards), not a node-and-edge canvas. It supersedes the original doc on one point only (Section 0): primary channel is no longer hardcoded to WhatsApp. Everything else in that doc (naming, data model, Trigger Condition semantics, channel field-applicability table) still applies directly.

**Reference:** seller-facing screenshot showing 3 columns — left: step cards (`WhatsApp Broadcast` / `PRIMARY`, `AI Voice Call Follow-up 1` / `ON FAILED`, dashed "Add a follow-up" button); center: "Broadcast Details" config sections (Broadcast Name, Quality Rating/Messaging Limit, Send To, Don't Send To, UTM Tracking, Enable Follow-ups, Smart Sender); right: "Broadcast Content" template preview.

## 0. Context (as found in the codebase)

- `src/pages/Campaigns.jsx` is a static mock page today. Its "New campaign" button (`data-testid="campaigns-new-btn"`) only calls `previewToast()` — there is no real creation flow.
- No dedicated Broadcast/Campaign builder page exists yet anywhere in the repo. `src/pages/FlowBuilderV2.jsx` is the closest working precedent for a builder page's plumbing (route param handling, `isNew` bootstrap, autosave debounce, `createFlow`/`fetchFlow`/`updateFlow`), but its `Canvas`/`NodePalette`/`ReactFlowProvider` machinery is graph-based and is **not** reused here — only its non-visual patterns (routing, autosave, entry-modal-on-`isNew`) carry over.
- `StartTriggerWizard.jsx` already has a "broadcast" path: if the selected event card's header is `"Broadcast"` (from `eventCatalogue.json`), it either routes to `BroadcastSourceStep1/2` (CSV/segment audience) or straight to `BroadcastConfig` (schedule + audience, no channel field — implicitly WhatsApp-only today). This component's *state shape* (schedule + audience) is reused; its *UI flow* (event catalogue picker) is not — the Campaign Builder needs a much shorter, dedicated entry modal (Section 3).
- Channel node config panels (`WhatsAppNode/WhatsAppRightPanel.jsx`, and the equivalent Email/SMS/RCS/AI Calling panels) are self-contained: each already renders sender identity, content/template picker, and (for WhatsApp) a `fallback: { enabled, template }` toggle backed by a shared `TemplatePicker`. These panels are reused for the Campaign Builder's center config column — this is the "easily transferable to Flow Builder" part of the ask.

## 1. Goal of this design

Define what happens from the seller clicking **"+ New Campaign"** through landing in a working Campaign Builder with the primary step already configured — a 3-column linear layout (Sequence Panel / Config Panel / Content Preview), matching the reference screenshot and the original spec's Section 4.

**Explicitly out of scope for this pass** (follow-up design docs): Save Draft / Save & Schedule modal, Audience Summary Card, full config-section behavior beyond noting which components are reused (Delivery Optimization, Template Resilience, Compliance details), campaign list/data persistence wiring beyond the tagging note in Section 8.

## 2. Entry point

`Campaigns.jsx`'s "New campaign" button navigates to a new route, e.g. `/campaigns/builder/new`, served by a new page component `CampaignBuilderPage.jsx`.

`CampaignBuilderPage.jsx` is a **new, self-contained page** — it does not mount Flow Builder's `Canvas`/`NodePalette`/`ReactFlowProvider`. It reuses only:
- The routing/bootstrap pattern from `FlowBuilderV2.jsx` (`isNew = !id || id === "new"`, entry modal shown on new, autosave debounce, `createFlow`/`fetchFlow`/`updateFlow`).
- A new `useCampaignBuilderStore` (same zustand shape/spirit as `useFlowBuilderStore`, but modeling `sequence: SequenceStep[]` per the original spec's Section 2 data model, not `nodes`/`edges`).

On `isNew`, instead of Flow Builder's full `StartTriggerWizard`, it opens a lightweight **`CampaignChannelPickerModal`** (Section 3). The 3-column layout underneath stays pointer-blocked while the modal is open, matching `FlowBuilderV2.jsx`'s existing pattern.

## 3. Channel picker modal

A single-step modal, shown immediately on landing at the `/new` route:

- 5 channel cards: **WhatsApp, Email, RCS, SMS, AI Voice**.
- "Continue" is disabled until one card is selected.
- Closing without selecting (back arrow / escape) navigates back to `/campaigns`, mirroring `FlowBuilderV2.jsx`'s `triggerConfigured` ref check on `onClose`.
- This supersedes the original spec's V1 WhatsApp-only lock — all 5 channels are selectable as primary.

## 4. Landing state: primary step card (auto-created on "Continue")

Selecting a channel and clicking "Continue" closes the modal and initializes the sequence with a single, fixed primary step:

```
sequence: [{
  id: <generated>,
  order_index: 0,
  channel: <selected channel>,
  is_primary: true,
  trigger_condition: null,
  audience: { mode: 'manual', segments_or_lists: [], suppression_lists: [] },
  channel_config: <channel's default config, from that channel's existing Flow Builder node defaults, e.g. defaultWANodeData for WhatsApp>,
  content: null,
}]
```

This matches the original spec's `SequenceStep` model (Section 2) exactly. The Left Sequence Panel renders it as the first card: channel icon, `PRIMARY` badge, name (`"WhatsApp Broadcast"` style, editable), placeholder date until schedule is set, `NO TEMPLATE SELECTED` amber state until content is chosen — per the screenshot and original spec Section 4.2.

**Fixed-step rule:** the primary card is not draggable and has no delete affordance, per the original spec's "Step 0 is fixed" rule. This is enforced in the Left Sequence Panel component, not inherited from Flow Builder.

Broadcast name defaults to `"Untitled Broadcast {n}"`, editable inline in both the Header and this card's bound field (same field, per the original spec's Section 4.1 anti-divergence note) — not part of the entry modal itself.

## 5. Sequence panel behavior beyond the primary step

Everything below is existing original-spec behavior (Sections 4.2, 5), now confirmed as the target rather than reconsidered:

- "Add a follow-up" (dashed button, per screenshot) opens a channel picker excluding WhatsApp if already primary; other channels are repeatable (e.g. two SMS follow-ups with different trigger conditions).
- Follow-up cards show a trigger-summary badge (`ON FAILED`, `+2h DELAY`, or an absolute-date badge per Section 6.1) sourced from that step's `trigger_condition`.
- Steps 1..n are drag-reorderable among themselves only; reordering rewrites `trigger_condition.reference_step_id` to "immediately prior" only if the seller hasn't manually overridden it (original spec's explicit reorder rule).

## 6. Trigger Condition, with a new timing mode

The Trigger Condition component (original spec Section 5) is unchanged in structure — reference step, condition type, behavior, delay — with one addition:

### 6.1 Timing mode: relative delay vs. specific date/time

`TriggerCondition` gains a mode toggle, either/or (not combined):

- **"Delay after previous step"** (existing) — `delay: { value: number, unit: 'minutes' | 'hours' | 'days' }`, relative to the reference step.
- **"On a specific date & time"** (new) — `fire_at: <ISO datetime>`, an absolute picker, independent of when the reference step actually fires.

Switching modes clears the other mode's fields. Applies only to non-primary (follow-up) steps — the primary step's timing is governed by the Broadcast's own `schedule`, not a Trigger Condition.

## 7. Per-step content configuration reuses Flow Builder panels directly

No new content-picker UI is built for the Campaign Builder's center/right columns. The center "Broadcast Details" column and right "Broadcast Content" preview column embed the same components Flow Builder already ships per channel:

- **WhatsApp** → `WhatsAppRightPanel.jsx`'s standard-template picker and `fallback: { enabled, template }` toggle (satisfies the original spec's Section 1 "Fallback Template" concept — no new component needed).
- **Email / SMS / RCS** → their respective existing `<Channel>RightPanel.jsx` content pickers.
- **AI Voice** → the existing AI Calling node's script/voice-line config.

These components currently assume they're rendering inside Flow Builder's node-based `RightPanel` shell. Embedding them in the Campaign Builder's column layout requires extracting the *content-picker sub-section* of each (template/script selection + fallback) so it can render standalone, keyed off `SequenceStep.channel_config`/`content` instead of a flow node's `data`. This extraction is the concrete "easily transferable to Flow Builder panel" mechanism — same underlying component, two different shells.

## 8. Open item: distinguishing Campaigns from Flows in storage

Today `createFlow`/`fetchFlow` (`src/lib/flowsApi.js`) and `Campaigns.jsx`'s list are both mock/static, and model `nodes`/`edges` — the Campaign Builder's `sequence: SequenceStep[]` is a different shape entirely, not a variant of a Flow doc. This design assumes a separate `createCampaign`/`fetchCampaign` API pair (or a clearly distinct `type: 'campaign'` document shape) so `Campaigns.jsx` can eventually list real campaign docs instead of static `ROWS`. Wiring this end-to-end (API shape, list page query) is flagged as a follow-up design item, not solved here.

## 9. Out of scope (follow-up design passes)

- Save Draft / Save & Schedule modal (original spec Section 8).
- Audience Summary Card, live recalculation, AI suggestions (original spec Section 3).
- Delivery Optimization / Template Resilience / Compliance sections beyond the content-reuse note in Section 7 (original spec Sections 4.3 B/C/D).
- Campaign list page real data wiring (Section 8 above).
