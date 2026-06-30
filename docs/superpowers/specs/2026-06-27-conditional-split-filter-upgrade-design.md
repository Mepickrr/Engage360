# Conditional Split Node — Filter Tab Upgrade

**Date:** 2026-06-27
**Status:** Approved for implementation
**Audience:** Engineering
**Scope:** Filter tab upgrade for ConditionalSplitNode in Flow Builder v1 and Flow Builder v2

---

## Table of Contents

1. [Why This Matters](#1-why-this-matters)
2. [What Changes](#2-what-changes)
3. [Architecture](#3-architecture)
4. [Data Model](#4-data-model)
5. [Component Tree](#5-component-tree)
6. [EventPropertyConditions — Spec](#6-eventpropertyconditions--spec)
7. [AudienceFilterBuilder — Extraction Spec](#7-audiencefilterbuilder--extraction-spec)
8. [v2 Parity — Canvas & Right Panel](#8-v2-parity--canvas--right-panel)
9. [States & Edge Cases](#9-states--edge-cases)
10. [Out of Scope](#10-out-of-scope)
11. [Open Questions](#11-open-questions)

---

## 1. Why This Matters

The Conditional Split node is the most strategically important node in the Flow Builder. Every meaningful journey branches — by RFM segment, by order value, by whether a customer has purchased before, by what they did on the trigger event. Without a powerful filter UI, sellers fall back to flat property/value conditions that cannot express nuanced audience logic.

The current Filter tab in v1 uses a generic `FilterConditionRow` (property → operator → value) that combines user attributes and flow variables in a flat dropdown. It cannot express behavioral conditions, affinity-based splits, or event-scoped attributes. It is fundamentally weaker than the audience filter the same seller just configured in the start trigger two steps earlier.

This upgrade brings the conditional split's Filter tab to full parity with the start trigger's audience qualification UI — same components, same data richness, same mental model. A seller who knows how to configure the trigger audience now knows how to configure a conditional split branch, because it looks and works identically.

---

## 2. What Changes

### Current state (v1)
- Filter tab uses `FilterGroupCard` + `FilterConditionRow`: a flat property/operator/value row inside each branch
- Properties sourced from a combined dropdown of user attributes + expression variables
- No behavioral conditions, no affinity, no event-scoped filtering
- Data shape: `filterGroups[].conditions[]` (flat)

### Current state (v2)
- The `condition` node type uses a primitive `ConfigTab` entry: three plain inputs — field (text), operator (dropdown), value (text)
- No dedicated right panel, no branching UI, no filter tabs

### After this upgrade (both versions)
- Filter tab uses `AudienceFilterBuilder` — the same block-based audience filter as the start trigger
- Five block types per branch: User property, User behavior, User affinity, Event property, Custom segment
- Blocks within a branch combined with AND / OR
- Branches combined with AND / OR
- Event property block auto-reads the start trigger event from the flow store — no extra seller configuration required
- v2 gets a dedicated `ConditionalSplitNode` canvas renderer and right panel — full parity with v1

---

## 3. Architecture

### Approach: Lift & Share

Extract the audience filter components from `Step2WhoContent.jsx` into a shared `AudienceFilterBuilder` component. Both the start trigger and the conditional split import this. A new `EventPropertyConditions` component joins the existing four block type renderers.

```
src/components/flows/builder/trigger/audience/
├── AudienceFilterBuilder.jsx         ← NEW (extracted from Step2WhoContent)
├── EventPropertyConditions.jsx       ← NEW
├── UserPropertyConditions.jsx        (existing, unchanged)
├── UserBehaviorConditions.jsx        (existing, unchanged)
├── UserAffinityConditions.jsx        (existing, unchanged)
└── CombinatorPill.jsx                (existing, unchanged)

app/frontend/src/components/flows/trigger/audience/
├── AudienceFilterBuilder.jsx         ← NEW (mirrored for v2)
├── EventPropertyConditions.jsx       ← NEW (mirrored for v2)
├── UserPropertyConditions.jsx        (existing, unchanged)
├── UserBehaviorConditions.jsx        (existing, unchanged)
└── UserAffinityConditions.jsx        (existing, unchanged)

src/components/flows/builder/nodes/ConditionalSplitNode/1
├── index.jsx                         (existing canvas node — unchanged)
├── ConditionalSplitRightPanel.jsx    (FilterTab updated; A/B and Expression unchanged)
└── data/mockData.js                  (data shape updated)

app/frontend/src/components/flows/builder/nodes/ConditionalSplitNode/  ← NEW FOLDER
├── index.jsx                         ← NEW (canvas node, mirrors v1)
├── ConditionalSplitRightPanel.jsx    ← NEW (full right panel, mirrors v1)
└── data/mockData.js                  ← NEW (same shape as v1)
```

`Step2WhoContent.jsx` is updated to import `AudienceFilterBuilder` in place of the inlined `ConditionBlockList` — zero behavioral change to the trigger.

---

## 4. Data Model

### Filter group shape — OLD
```js
filterGroups: [
  {
    id: "fg_1",
    label: "Branch 1",
    combinator: "AND",
    conditions: [
      { id, condType, property, operator, value }
    ]
  }
]
```

### Filter group shape — NEW
```js
filterGroups: [
  {
    id: "fg_1",
    label: "Branch 1",
    blocksCombinator: "AND",        // combinator between blocks within this branch
    blocks: [
      {
        id: "blk_1",
        type: "property",           // "property" | "behavior" | "affinity" | "event_property" | "segment"
        combinator: "AND",          // combinator between conditions within this block
        conditions: [],             // used by property / behavior / affinity / event_property
        segments: [],               // used by segment type only
      }
    ]
  }
]
```

### Updated `defaultConditionalSplitData` in `mockData.js`
```js
export const defaultConditionalSplitData = {
  label: "Conditional Split",
  mode: null,
  filterGroups: [
    {
      id: "fg_default",
      label: "Branch 1",
      blocksCombinator: "AND",
      blocks: [
        {
          id: "blk_default",
          type: "property",
          combinator: "AND",
          conditions: [{ property: "", operator: "", value: "" }],
          segments: [],
        }
      ]
    }
  ],
  abPaths: [
    { id: "path_a", label: "A", percentage: 50 },
    { id: "path_b", label: "B", percentage: 50 },
  ],
  abRandomise: false,
  expressions: [newExpression(0)],
  wiredPorts: [],
};
```

### `newFilterGroup` factory update
```js
export function newFilterGroup(index = 0) {
  return {
    id: `fg_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    label: `Branch ${index + 1}`,
    blocksCombinator: "AND",
    blocks: [newBlock()],
  };
}

export function newBlock() {
  return {
    id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    type: "property",
    combinator: "AND",
    conditions: [{ property: "", operator: "", value: "" }],
    segments: [],
  };
}
```

### Migration
No migration needed. The conditional split is prototype-only with no backend persistence. The data shape change is safe to make directly.

---

## 5. Component Tree

```
ConditionalSplitRightPanel
├── Header (label input + Delete)
├── Mode selector tabs (Filter | A/B Test | Expression)
└── FilterTab                              ← updated
    ├── FilterGroupCard (per branch)
    │   ├── Branch header
    │   │   ├── Collapse toggle
    │   │   ├── Label input ("Branch 1")
    │   │   └── Remove button (if > 1 branch)
    │   └── AudienceFilterBuilder          ← NEW shared component
    │       ├── ConditionBlock (per block)
    │       │   ├── BlockTypePicker (tab strip)
    │       │   │   User property | User behavior | User affinity | Event property | Custom segment
    │       │   ├── Remove block button
    │       │   └── Body (switches on block.type)
    │       │       ├── type="property"        → UserPropertyConditions
    │       │       ├── type="behavior"        → UserBehaviorConditions
    │       │       ├── type="affinity"        → UserAffinityConditions
    │       │       ├── type="event_property"  → EventPropertyConditions (NEW)
    │       │       └── type="segment"         → SegmentList
    │       ├── CombinatorPill (AND / OR between blocks)
    │       └── AddBlockMenu
    │           └── dropdown: 5 block type options
    ├── CombinatorPill (AND / OR between branches)
    ├── + Add branch button
    └── Else pill (grey, read-only — "Users that don't match any branch")
```

### `AudienceFilterBuilder` props interface
```js
// blockSet shape
{
  blocks: Block[],
  blocksCombinator: "AND" | "OR"
}

<AudienceFilterBuilder
  blockSet={{ blocks: group.blocks, blocksCombinator: group.blocksCombinator }}
  onChange={(next) => updateGroup(group.id, next)}
  testIdPrefix={`fg-${group.id}`}
  blockTypes={BLOCK_TYPES}         // allows caller to restrict available types if needed
/>
```

### Block type registry
```js
const BLOCK_TYPES = [
  { id: "property",       label: "User property" },
  { id: "behavior",       label: "User behavior" },
  { id: "affinity",       label: "User affinity" },
  { id: "event_property", label: "Event property" },
  { id: "segment",        label: "Custom segment" },
];
```

---

## 6. EventPropertyConditions — Spec

### Purpose
Filter on attributes of the specific start trigger event that brought the customer into this journey. For example: "cart_abandoned where cart_value > 500" or "purchase where payment_method = COD."

This is distinct from `UserBehaviorConditions` which filters on historical event frequency. `EventPropertyConditions` is scoped to the one event instance at journey entry.

### Data source
```js
const triggerEvent = useFlowBuilderStore(s =>
  s.nodes.find(n => n.type === "trigger")?.data?.event_name ?? null
);
```

### Three render states

| State | Condition | UI |
|---|---|---|
| No trigger event | `triggerEvent === null` | Muted placeholder: _"Add a start trigger event to use this filter."_ Block body is non-interactive. |
| Trigger event exists | `triggerEvent !== null` | Teal badge showing event name (e.g. `cart_abandoned`). Below: qualifier + frequency + count + time range + attribute filters (same as `UserBehaviorConditions` with event pre-filled). |
| Trigger event changes | `triggerEvent` changes value | Conditions reset — event-specific attributes are invalidated. |

### Relationship to `UserBehaviorConditions`
`EventPropertyConditions` renders the same UI as `UserBehaviorConditions` with one difference: the event `TwoPanelDropdown` is replaced by a read-only teal badge. All other fields — qualifier (Has Executed / Has Not Executed), frequency, count, time range, attribute filters — are identical and fully functional.

Internally, conditions are initialized with `event` pre-set to `triggerEvent`, so `getAttrPool(c.event)` resolves correctly without any changes to the existing attribute pool logic.

### Auto-reset on trigger event change
```js
useEffect(() => {
  if (triggerEvent && prevTriggerEvent && triggerEvent !== prevTriggerEvent) {
    // reset conditions — attributes no longer valid
    onChange({ ...block, conditions: [defaultEventCondition(triggerEvent)] });
  }
}, [triggerEvent]);
```

---

## 7. AudienceFilterBuilder — Extraction Spec

### What moves out of `Step2WhoContent.jsx`
| Component | Destination |
|---|---|
| `ConditionBlockList` | `AudienceFilterBuilder.jsx` (renamed to `AudienceFilterBuilder`, exported as default) |
| `ConditionBlock` | `AudienceFilterBuilder.jsx` (internal) |
| `BlockTypePicker` | `AudienceFilterBuilder.jsx` (internal) |
| `AddBlockMenu` | `AudienceFilterBuilder.jsx` (internal) |
| `SegmentList` | `AudienceFilterBuilder.jsx` (internal) |

### What stays in `Step2WhoContent.jsx`
- `AudienceKindBlock`
- `SaveAsSegmentButton`
- Include / Exclude / Limit / Count / Control group UI
- The `emptyConditionBlock` import from `triggerHelpers`

### Updated `Step2WhoContent.jsx` call site
```jsx
// Before (inlined):
<ConditionBlockList
  blockSet={audience.include || { blocks: [...], blocksCombinator: "AND" }}
  onChange={(b) => setAudience({ ...audience, include: b })}
  testIdPrefix="audience-include"
/>

// After (shared):
<AudienceFilterBuilder
  blockSet={audience.include || { blocks: [...], blocksCombinator: "AND" }}
  onChange={(b) => setAudience({ ...audience, include: b })}
  testIdPrefix="audience-include"
/>
```

Zero behavioral change to the trigger. The extraction is a pure refactor at the call site.

### `blockTypes` prop
`AudienceFilterBuilder` requires a `blockTypes` prop — there is no default, so callers must be explicit.

The start trigger (`Step2WhoContent`) passes the original four types — "Event property" does not apply there because the trigger *is* where the event is configured:
```js
// Step2WhoContent — 4 types, no event_property
const TRIGGER_BLOCK_TYPES = [
  { id: "property",  label: "User property" },
  { id: "behavior",  label: "User behavior" },
  { id: "affinity",  label: "User affinity" },
  { id: "segment",   label: "Custom segment" },
];
```

The conditional split passes all five:
```js
// ConditionalSplitRightPanel — all 5 types
const SPLIT_BLOCK_TYPES = [
  { id: "property",       label: "User property" },
  { id: "behavior",       label: "User behavior" },
  { id: "affinity",       label: "User affinity" },
  { id: "event_property", label: "Event property" },
  { id: "segment",        label: "Custom segment" },
];
```

---

## 8. v2 Parity — Canvas & Right Panel

### New folder: `app/frontend/src/components/flows/builder/nodes/ConditionalSplitNode/`

**`index.jsx`** — Canvas node renderer. Identical to v1's canvas node:
- Empty state: dashed border, GitFork icon, "Click to configure"
- Configured state: gradient header, mode badge (Filter / A/B Test / Expression), dynamic output ports

**`ConditionalSplitRightPanel.jsx`** — Full right panel. Identical to v1. Imports audience components from `app/frontend/src/components/flows/trigger/audience/`.

**`data/mockData.js`** — Same schema as v1's updated mockData.

### `ConfigTab.jsx` routing
The existing pattern for the webhook node is reused:
```jsx
if (node?.type === "condition") {
  return (
    <div className="absolute inset-0 overflow-hidden flex flex-col">
      <ConditionalSplitRightPanel
        node={node}
        updateNodeData={updateNodeData}
        removeNode={removeNode}
      />
    </div>
  );
}
```

### `LogicNode.jsx` update
The `condition` entry in `KIND_META` is removed. The `condition` type is no longer rendered by `LogicNode` — it uses its own dedicated canvas node. The v2 node type registry maps `condition` to the new `ConditionalSplitNode` renderer.

### Output ports
v2's current `condition` node has two hardcoded ports (yes/no at 30% and 70% left). The new canvas node renders dynamic ports from `data.filterGroups` (Filter mode) or `data.abPaths` (A/B mode) — same logic as v1.

---

## 9. States & Edge Cases

| Situation | Behavior |
|---|---|
| No trigger event; Event property tab selected | Body shows placeholder: "Add a start trigger event to use this filter." Non-interactive. Branch can still be published using other block types. |
| Trigger event changes after Event property conditions are set | Event property block conditions reset. Warning shown in the block: "Trigger event changed — conditions cleared." |
| All blocks removed from a branch | Not possible — minimum one block per branch enforced. If the last block is removed, it resets to a default User property block. |
| Branch has zero filled conditions across all blocks | Branch card shows amber "Incomplete" badge. Journey publish validation catches it and surfaces the branch name in the error. |
| Event property block: trigger event has no catalogued attributes | Block body shows: "No attributes found for this event." Seller can still use other block types in the branch. |
| Seller switches branch type from old flat-conditions to new block structure | Not applicable — no migration needed (no persistence). |

---

## 10. Out of Scope

- **A/B Test tab and Expression tab:** Unchanged. This spec only touches the Filter tab.
- **Save as segment from conditional split:** The `SaveAsSegmentButton` is a trigger-specific feature. Not included in `AudienceFilterBuilder` for the conditional split context.
- **Backend API for conditional evaluation:** The node is UI-only. Runtime evaluation of filter conditions is a backend concern not covered here.
- **Segment block data:** `SegmentList` continues to use the same mock segments array. Real segment API integration is out of scope.
- **Re-entry / deduplication logic:** Journey-level execution concerns. Not part of this node spec.

---

## 11. Open Questions

| Question | Why it matters | Owner |
|---|---|---|
| Should `AudienceFilterBuilder` live in a truly shared `/shared/` or `/common/` path instead of the trigger's `audience/` folder? | The trigger folder is a reasonable home for now but signals that the component belongs to the trigger, which it no longer exclusively does. | Engineering |
| Should the `emptyConditionBlock` helper in `triggerHelpers.js` be moved to `AudienceFilterBuilder.jsx` since it's now shared? | Avoids trigger-specific naming for a shared utility. | Engineering |
| What happens to v2's `condition` node in existing saved flows (if any) when `LogicNode`'s `condition` kind is removed? | If any persisted flows use the old `condition` type, the canvas renderer would break. | Engineering |

---

*Files referenced:*
- `src/components/flows/builder/nodes/ConditionalSplitNode/ConditionalSplitRightPanel.jsx`
- `src/components/flows/builder/nodes/ConditionalSplitNode/index.jsx`
- `src/components/flows/builder/nodes/ConditionalSplitNode/data/mockData.js`
- `src/components/flows/builder/trigger/Step2WhoContent.jsx`
- `src/components/flows/builder/trigger/audience/UserPropertyConditions.jsx`
- `src/components/flows/builder/trigger/audience/UserBehaviorConditions.jsx`
- `src/components/flows/builder/trigger/audience/UserAffinityConditions.jsx`
- `app/frontend/src/components/flows/builder/nodes/LogicNode.jsx`
- `app/frontend/src/components/flows/builder/panels/ConfigTab.jsx`
- `app/frontend/src/components/flows/trigger/audience/UserPropertyConditions.jsx`
- `app/frontend/src/components/flows/trigger/audience/UserBehaviorConditions.jsx`
- `app/frontend/src/components/flows/trigger/audience/UserAffinityConditions.jsx`
