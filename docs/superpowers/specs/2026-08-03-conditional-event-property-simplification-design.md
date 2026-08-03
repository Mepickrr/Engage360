# Conditional Split — Event Property Block Simplification

**Date:** 2026-08-03
**Status:** Approved for implementation
**Audience:** Engineering
**Scope:** `EventPropertyConditions` component (Conditional Split node, Filter tab, Event property block) in Flow Builder v1 and v2
**Supersedes:** Section 6 ("EventPropertyConditions — Spec") of `2026-06-27-conditional-split-filter-upgrade-design.md`

---

## 1. Why This Matters

The 2026-06-27 upgrade gave the Conditional Split node's "Event property" filter block the same UI as `UserBehaviorConditions`: a qualifier (Has Executed / Has Not Executed), a frequency ("at least N times"), a time range ("in the last X days"), and attribute filters — with the only difference being the event is locked to the flow's start trigger event instead of pickable.

In practice this is the wrong mental model for this block. A contact reaching the Conditional Split node has, by definition, already fired the start trigger event exactly as configured — asking "has executed at least N times in the last X days" re-litigates something already guaranteed by flow entry. The qualifier/frequency/time-range UI is behavioral framing borrowed from `UserBehaviorConditions` that doesn't apply once the event is fixed rather than freely chosen.

What the seller actually needs here is simpler: given that the trigger event already fired (e.g. "Product Viewed"), branch on its attributes (e.g. product price, SKU) with AND/OR — nothing more.

---

## 2. What Changes

### Current state (both v1 and v2)
`EventPropertyConditions.jsx` (in `trigger/audience/` and `triggerV2/audience/`) renders, per condition row:
- Has Executed / Has Not Executed qualifier
- Frequency ("at least N")
- Time range ("in the last X days")
- Attribute filters (property / operator / value), combined with AND/OR

### After this change (both v1 and v2)
`EventPropertyConditions.jsx` renders, per condition row:
- Attribute filters (property / operator / value) only
- Combined with AND/OR via the existing `CombinatorPill`, unchanged

Removed entirely: the qualifier, frequency, and time-range rows. There is no replacement UI for them in this block — this is a deletion, not a relocation. (`UserBehaviorConditions` continues to own frequency/time-window behavior for freely-picked events elsewhere in the audience filter; it is untouched.)

Unchanged:
- The locked "Trigger event: <name>" badge at the top of the block.
- The "Add a start trigger event to use this filter" placeholder when no trigger event exists.
- The reset-on-trigger-event-change behavior.
- The attribute pool lookup (`getAttrPool(triggerEvent)`), including the `attributes_by_event` catalogue fallback.

---

## 3. Data Model

### Condition shape — OLD
```js
{
  id, property, operator, value,
  frequency: "at_least",       // removed
  count: 1,                     // removed
  time_range: { op: "in_last", n: 30, unit: "days" },  // removed
}
```

### Condition shape — NEW
```js
{
  id, property, operator, value,
}
```

### `defaultCondition()` (event-property block only)
```js
function defaultEventPropertyCondition() {
  return { id: `cond_${...}`, property: "", operator: "", value: "" };
}
```

### Backward compatibility
No migration. Already-saved blocks may still carry `frequency`/`count`/`time_range`/qualifier fields in stored JSON. `EventPropertyConditions` simply stops reading and writing those fields going forward — they become inert leftover data, not something to actively strip on load.

---

## 4. Component Changes

**File:** `src/components/flows/builder/trigger/audience/EventPropertyConditions.jsx` (v1)
**File:** `src/components/flows/builder/triggerV2/audience/EventPropertyConditions.jsx` (v2, factors the attribute sub-list into `AttributesSubList.jsx` — same removal applies there since it renders the same row)

Per file:
- Remove the qualifier control (Has Executed / Has Not Executed) and its state.
- Remove the frequency selector and count input.
- Remove the `TimeRangeRow` usage.
- Keep the trigger-event badge, empty-state placeholder, attribute condition rows, and `CombinatorPill`.
- Simplify `defaultCondition()` (or equivalent) to the new shape.
- Remove now-unused imports (`FREQUENCY_OPTIONS`, `TimeRangeRow`, `EXEC_QUALIFIERS`) if nothing else in the file uses them.

**File:** `src/components/flows/builder/nodes/ConditionalSplitNode/filterSummary.js`
- `summarizeExecutionCondition()` (or whatever function summarizes an event-property block for the collapsed branch card) is updated to describe attribute conditions directly instead of "Has Executed X at least Y times in the last Z days", e.g.:
  `"Product Viewed where Product Price > 100 AND SKU ID = X123"`
- If the block has no attribute conditions set, fall back to just the event name, e.g. `"Product Viewed"`.

---

## 5. States & Edge Cases

| Situation | Behavior |
|---|---|
| No trigger event; Event property block selected | Unchanged: placeholder "Add a start trigger event to use this filter." |
| Trigger event exists, no attribute conditions added yet | One empty condition row shown by default (property/operator/value blank). |
| Trigger event changes | Unchanged: conditions reset, since attributes are event-specific. |
| Trigger event has no catalogued attributes | Unchanged: "No attributes found for this event." |
| Old saved flow has a block with `frequency`/`time_range` set | Those fields are ignored on read; only `property`/`operator`/`value` are rendered and edited. Saving the block again will not remove the old fields from other parts of the object the component doesn't touch, but the component itself only writes the new shape for conditions it edits. |

---

## 6. Out of Scope

- `UserBehaviorConditions.jsx` — untouched; it still supports free event pick + qualifier + frequency + time range for the "User behavior" block type, which is a genuinely different, unlocked-event use case.
- Any change to how the trigger event itself is configured (`FlowTriggerModal.jsx`, `triggerNodeUtils.js`).
- Backend evaluation semantics — UI-only change, same as the 2026-06-27 spec.
- Data migration for previously-saved qualifier/frequency/time_range fields.

---

*Files referenced:*
- `src/components/flows/builder/trigger/audience/EventPropertyConditions.jsx`
- `src/components/flows/builder/triggerV2/audience/EventPropertyConditions.jsx`
- `src/components/flows/builder/triggerV2/audience/AttributesSubList.jsx`
- `src/components/flows/builder/nodes/ConditionalSplitNode/filterSummary.js`
- `src/components/flows/builder/nodes/ConditionalSplitNode/ConditionalFilterModal.jsx`
- `src/components/flows/builder/nodes/ConditionalSplitNode/ConditionalFilterModalV2.jsx`
