# Start Trigger: Evaluate Section Redesign

**Date:** 2026-07-01
**Applies to:** Flow Builder V1 (`FlowBuilder.jsx`) and Flow Builder V2 (`FlowBuilderV2.jsx`) — both share the same trigger components under `src/components/flows/builder/trigger/`.

---

## Overview

Replace the evaluate section's open-ended attribute condition rows with a single two-level cascading select (parameter → value). Update all four abandoned event mappings with the new category data.

---

## What Changes

### 1. Data Shape — `group.evaluate`

**Before:** array of condition objects
```js
group.evaluate = [{ property: "Product Viewed", operator: "is", value: "Last Product View" }]
```

**After:** single object or null
```js
group.evaluate = { parameter: "Cart Viewed", value: "Last Cart View" }
// or null if not yet configured
```

`emptyGroup()` changes `evaluate: []` → `evaluate: null`.

`group.evaluateTime` is unchanged: `{ value: 1, unit: "Hour" }`.

---

### 2. UI — EVALUATE Block (`Step1WhenContent.jsx`)

**Before:** multiple `AttributeConditionRow` rows + "+ Add evaluate rule" button

**After:** single two-level cascading select row:

```
EVALUATE  ─────────────────────────────────────────────
Evaluate events within  [1] [Hour ▾]

Evaluate by  [Cart Viewed ▾]  →  [Last Cart View ▾]
```

**Behaviour:**
- Level 1 (`Select`): shows all `is_evaluate: true` attribute `name` values for the event (the parameter)
- Level 2 (`Select`): shows the `examples` array for the selected parameter; disabled until Level 1 is selected
- Changing Level 1 clears Level 2 (sets `group.evaluate.value = ""`)
- No "+ Add evaluate rule" button
- The whole row is shown whenever `ev?.advance_evaluate` is true (same gate as the time range)

**State update:**
```js
// Level 1 change
updateGroup(gi, { evaluate: { parameter: v, value: "" } })

// Level 2 change
updateGroup(gi, { evaluate: { ...group.evaluate, value: v } })
```

---

### 3. Canvas Preview (`triggerNodeUtils.js`)

`evaluateLine` shows the selected **value** (most actionable):
```js
evaluateLine: (group.evaluateTime?.value > 0 && group.evaluate?.value)
  ? `Evaluate: ${group.evaluate.value}`
  : (group.evaluateTime?.value > 0)
  ? `Evaluate within ${group.evaluateTime.value} ${group.evaluateTime.unit}`
  : null,
```

- If a value is selected: `Evaluate: Last Cart View`
- If only time range set (no selection yet): `Evaluate within 1 Hour`
- If neither: null

`StartTriggerNode.jsx` requires no changes — it already renders `group.evaluateLine`.

---

### 4. Data Update — `eventCatalogue.json` `attributes_by_event`

Replace all four abandoned event entries with the new mapping. All entries have `is_evaluate: true`, `selection_option: "Single select"`, `data_type: "string"`. The `examples` array is the Level 2 options. **UTM Source/Medium/Campaign entries are removed** — they belonged to the old attribute-condition approach and are not part of the evaluate-by concept.

#### Abandoned Cart

| name | examples |
|---|---|
| Cart Viewed | ["First Cart View", "Last Cart View"] |
| Cart Session | ["Maximum Cart Session", "Least Cart Session"] |
| Cart Viewed Price | ["Most Priced Cart", "Least Priced Cart"] |
| Cart Quantity | ["Highest Quantity", "Least Quantity"] |
| Discount | ["AttemptClicked", "Selected", "Removed"] |
| Frequent Product Add to Cart | ["Most Product Add to Cart", "Least Product Add to Cart"] |
| Frequent Product Remove from Cart | ["Most Product Remove from Cart", "Least Product Remove from Cart"] |

#### Abandoned Payment

| name | examples |
|---|---|
| Product Viewed | ["First Product View", "Last Product View"] |
| Frequent Product View | ["Maximum Product Viewed", "Least Product Viewed"] |
| Product Viewed Price | ["Most Priced Product", "Least Priced Product"] |
| Product Quantity | ["Highest Quantity", "Least Quantity"] |
| Discount | ["AttemptClicked", "Selected", "Removed"] |
| Frequent Product Add to Cart | ["Most Product Add to Cart", "Least Product Add to Cart"] |
| Frequent Product Remove from Cart | ["Most Product Remove from Cart", "Least Product Remove from Cart"] |

#### Abandoned Checkout

| name | examples |
|---|---|
| Payment Gateway | ["Frequently selected mode"] |
| Product Viewed | ["First Product View", "Last Product View"] |
| Frequent Product View | ["Maximum Product Viewed", "Least Product Viewed"] |
| Product Viewed Price | ["Most Priced Product", "Least Priced Product"] |
| Product Quantity | ["Highest Quantity", "Least Quantity"] |
| Discount | ["AttemptClicked", "Selected", "Removed"] |
| Frequent Product Add to Cart | ["Most Product Add to Cart", "Least Product Add to Cart"] |
| Frequent Product Remove from Cart | ["Most Product Remove from Cart", "Least Product Remove from Cart"] |

#### Abandoned Product

| name | examples |
|---|---|
| Product Viewed | ["First Product View", "Last Product View"] |
| Frequent Product View | ["Maximum Product Viewed", "Least Product Viewed"] |
| Product Viewed Price | ["Most Priced Product", "Least Priced Product"] |
| Product Quantity | ["Highest Quantity", "Least Quantity"] |

---

### 5. Files Changed

| File | Change |
|---|---|
| `src/data/eventCatalogue.json` | Replace `attributes_by_event` for all 4 abandoned events |
| `src/components/flows/builder/trigger/Step1WhenContent.jsx` | Replace evaluate rows with two-level cascading select; update `emptyGroup` |
| `src/components/flows/builder/triggerNodeUtils.js` | Update `evaluateLine` logic |

`StartTriggerNode.jsx`, `Step2WhoContent.jsx`, `EventActionRow.jsx` — no changes needed.

---

### 6. Out of Scope

- `triggerEventProperties.js` — the `CATALOGUE` entries for abandoned events are not used for evaluate (the JSON catalogue is the source of truth); no change needed
- No API integration — all data remains static
- No changes to exit condition attribute filters (Task 4 from previous plan)
- No changes to control group hiding (Task 2 from previous plan)
