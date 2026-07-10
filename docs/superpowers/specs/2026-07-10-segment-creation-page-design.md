# Segment Creation Page Design

## Context

`src/pages/Segments.jsx` is currently a static preview page: a hardcoded `ROWS` array and a "New segment" button that only fires `previewToast()`. There is no segment creation UI and no `Segment` data model anywhere (frontend or backend).

Meanwhile, the flow builder's Start Trigger wizard (`StartTriggerWizard.jsx` → `Step2WhoContent.jsx`) already implements a full condition/rule builder — `AudienceFilterBuilder` — supporting exactly the filter categories this project needs (User property, User behavior, User affinity, Custom segment) combined with AND/OR logic, nested one level (blocks ↔ conditions within a block). This component was already proven reusable outside the trigger wizard once before: it was extracted into the Conditional Split node (`ConditionalSplitRightPanel.jsx`) by passing a different `blockTypes` prop, no changes to its internals (see `2026-06-27-conditional-split-filter-upgrade-design.md`).

This project reuses `AudienceFilterBuilder` a second time, to power a real Create Segment / segment detail page. Reference: [MoEngage Affinity Segments](https://help.moengage.com/hc/en-us/articles/360058291252-Affinity-Segments#h_01K4MMWKSJGJY3CS0T4F9BVBK9).

**Scope: frontend-only prototype.** Consistent with the rest of the app (`Segments.jsx`, `Audience.jsx`), this is UI/UX only — no backend `Segment` model or API. All persistence, user counts, and reachability numbers are mock/deterministic, computed client-side.

## Routing & Page Architecture

Two new routes, following the existing `/campaigns/builder/new` + `/campaigns/builder/:id` convention:

- `/segments/builder/new` — create mode
- `/segments/builder/:id` — view/edit mode, loads an existing segment from the mock store

Both are served by a single new page component, `SegmentBuilderPage` (`src/pages/SegmentBuilderPage.jsx`). Mode is derived from the presence of `:id` plus a local `isEditing` toggle (a saved segment opens read-only; clicking "Edit" flips `isEditing` true in place — no route change).

`Segments.jsx` changes:
- "New segment" button navigates to `/segments/builder/new` instead of calling `previewToast()`.
- Each row's `onClick` navigates to `/segments/builder/:id` instead of calling `previewToast()`.
- `ROWS` is replaced by `listSegments()` from the new shared mock store (see Data Model), so segments created via the builder actually appear in the list.

### Layout

`SegmentBuilderPage` renders:
- A header: segment name (editable in create/edit mode, plain text in read-only mode), back button to `/segments`.
- A two-column body:
  - **Left**: the filter builder — two `AudienceFilterBuilder` instances (Include / Exclude, Exclude behind a toggle), or `SegmentSummaryView` (read-only) when not editing.
  - **Right**: `SegmentReachabilityPanel`, sticky, always visible.
- An action bar (bottom or header-adjacent) whose buttons vary by mode (see Actions).

## Data Model

New module `src/data/segmentsData.js` holds the mock store, replacing both `Segments.jsx`'s `ROWS` and `AudienceFilterBuilder`'s hardcoded `MOCK_SEGMENTS`:

```js
// Segment
{
  id: "seg_...",
  name: "Cart Abandoners 48h",
  description: "",
  audience: {
    include: { blocks: [Block], blocksCombinator: "AND" },
    exclude_enabled: false,
    exclude: { blocks: [Block], blocksCombinator: "AND" },
  },
  userCount: 1840,
  reachability: { push: 0, email: 0, sms: 0, whatsapp: 0 },
  createdAt: "",
  updatedAt: "",
  owner: "",
  status: "active" | "stale",
}
```

`Block` and `blockSet` reuse the exact shape already defined by the trigger wizard (`StartTriggerWizard.jsx`'s `emptyAudience()`, `triggerHelpers.js`'s `emptyConditionBlock`):

```js
// Block
{
  id: "blk_...",
  type: "property" | "behavior" | "affinity" | "segment",
  combinator: "AND" | "OR",
  conditions: [{ property, operator, value }],  // property/behavior/affinity
  segments: [],                                  // segment-type block: array of other Segment.id
}
```

No arbitrary recursive nesting (no group-within-group beyond blockSet → block → conditions) — matches the trigger wizard's current depth.

Blocks of `type: "segment"` reference other segments' `id`s from this same store; a segment currently being created/edited excludes itself from the picker to avoid self-reference.

Exported API: `listSegments()`, `getSegment(id)`, `createSegment(data)`, `updateSegment(id, data)`. `AudienceFilterBuilder`'s segment-block picker is updated to call `listSegments()` instead of using its local `MOCK_SEGMENTS` constant — this is the only change to existing trigger-builder code.

## Component Reuse Plan

Reused unmodified:
- `AudienceFilterBuilder` — passed `blockTypes = [property, behavior, affinity, segment]` (no `event_property`; that block type depends on a trigger event instance, which doesn't exist outside a flow trigger/conditional split).
- `UserPropertyConditions`, `UserBehaviorConditions`, `UserAffinityConditions`
- `CombinatorPill`, `TwoPanelDropdown`
- Condition-to-text summary helpers from `triggerHelpers.js` (already built for `TriggerNode` card previews)

Not reused (flow-entry-specific, not audience-membership-specific): `AudienceKindBlock` (All Users/Identified/Known), limit-entry-frequency controls.

New components:
- `SegmentSummaryView` (`src/components/segments/SegmentSummaryView.jsx`) — read-only rendering of a saved segment's `audience` blockSets as plain-English text, built on top of the existing `triggerHelpers.js` summary functions rather than a new formatter.
- `SegmentReachabilityPanel` (`src/components/segments/SegmentReachabilityPanel.jsx`) — the live count/reachability panel described below.

## Live Reachability/Count Panel

`SegmentReachabilityPanel` recomputes whenever the current `blockSet`(s) change, debounced ~300ms so edits feel like they trigger a query rather than being instantaneous.

- **Total user count**: deterministic mock formula. Start from a fixed base pool (e.g. 50,000). For each condition in the active blocks, derive a stable multiplier from a hash of its `property` + `operator` + `value` (same inputs always produce the same multiplier). Apply multipliers across AND'd conditions (shrinking effect) and take a max-like combination across OR'd blocks (partial recovery), then round. Excluded blocks subtract a similarly derived count. Deterministic and reproducible — never `Math.random()`.
- **Channel reachability breakdown**: apply fixed opt-in percentages per channel (Push/Email/SMS/WhatsApp) against the total count. Reuse existing opt-in-rate constants from the codebase (`Audience.jsx` / analytics pages) if present, rather than inventing new ones — confirm during implementation.
- **Display**: total count as a large number ("~1,840 users"), one row per channel (icon, label, count, %) as small horizontal bars, and a "Stale" badge in saved/detail mode when `updatedAt` is older than a threshold.
- `Show Count` / `Show Reachability` actions (from the original action list) scroll to / expand this panel rather than triggering a separate computation, since it's always visible.

## Actions

**Create-mode action bar:**
| Action | Behavior |
|---|---|
| Reset Filter | Clears `include`/`exclude` blockSets and name field; confirms if state is non-empty. |
| Create Segment | Validates name set + ≥1 condition present; calls `createSegment()` stamping `userCount`/`reachability` from current panel values; navigates to `/segments` with success toast. |
| Create Campaign | Stub — `previewToast()`. |
| Show Count / Show Reachability | Scrolls to / expands the reachability panel. |

**Saved-detail-mode action bar** (segment loaded read-only):
| Action | Behavior |
|---|---|
| Refresh | Stub — `previewToast()`, panel numbers briefly show a "recomputing" loading state before re-settling on the same deterministic values. |
| Edit | Flips page to editable mode in place (`SegmentSummaryView` → `AudienceFilterBuilder`); action bar swaps to the create-mode set with "Create Segment" relabeled "Save Changes". |
| Export | Stub — `previewToast()`. |
| Create Campaign | Stub — `previewToast()`. |
| Show Sample Users | Opens a modal/drawer listing a handful of mock synthetic user rows (name, email, last-active) matching the filter's general shape; reuses row styling from `UserProfileDrawer` (`src/components/audience/UserProfileDrawer.jsx`) rather than building new row markup. |

## Out of Scope

- Backend `Segment` model, persistence, or real query execution.
- Arbitrary recursive nesting of condition groups beyond the existing 2-level depth.
- Wiring `Create Campaign` to the real campaign builder (deferred to a later project).
- `event_property` block type (trigger/conditional-split-only concept, not applicable to standalone segments).
