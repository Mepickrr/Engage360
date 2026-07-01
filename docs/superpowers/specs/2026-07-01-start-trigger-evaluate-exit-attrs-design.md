# Start Trigger: Evaluate Section, Exit Condition Attribute Filters, Abandoned Payment

**Date:** 2026-07-01  
**Applies to:** Flow Builder V1 (`FlowBuilder.jsx`) and Flow Builder V2 (`FlowBuilderV2.jsx`) — both share the same trigger components under `src/components/flows/builder/trigger/`.

---

## Overview

Three changes to the Start Trigger wizard and canvas node:

1. **Exit condition attribute filters** — users can filter on event attributes for exit trigger events, matching the same "With attribute" UX as the main trigger.
2. **Evaluate section: time range + attribute conditions** — abandoned events get a mandatory "Evaluate events within [N] [Unit]" time range, plus the existing attribute evaluate rows. Hidden for all non-abandoned events.
3. **Abandoned Payment event** — add as a first-class event across the catalogue, attribute pool, and evaluate data.
4. **Hide control groups** — Global control group and Flow control group checkboxes in Step 2 are hidden (not deleted).

---

## 1. Data Shape Changes

### 1a. Exit trigger event row

```js
// Before
{ qualifier: "has_done", event: "" }

// After
{ qualifier: "has_done", event: "", conditions: [] }
```

`conditions` follows the same schema as trigger group conditions: `{ property, operator, value }`.

### 1b. Trigger group — evaluate time range

`emptyGroup()` gains `evaluateTime`:

```js
{
  event: eventName,
  conditions: [],
  evaluate: [],
  evaluateTime: { value: 1, unit: "Hour" },  // new
  combinator: "AND",
}
```

`group.evaluate` (array of attribute condition objects) is unchanged. `evaluateTime` sits alongside it.

**Persistence:** `StartTriggerWizard` hydrates `evaluateTime` from `initialConfig` on edit.

---

## 2. UI Changes

### 2a. Exit Condition Attribute Filters

**File:** `src/components/flows/builder/trigger/Step1WhenContent.jsx`  
**Location:** `ExitTriggerSection` component

Each exit event row renders the `EventActionRow` as before, then immediately below (when `row.event` is set) renders a "With attribute" block:

```
[Has Done ▾] [Event picker ▾]  [trash]
  With attribute
  [Property ▾] [Operator ▾] [Value        ] [trash]
  + Add condition
```

- Attribute pool: `getAttrPool(row.event)` filtered to `!a.is_evaluate` (same as `propPool` in main trigger).
- "+ Add condition" adds `{ property: "", operator: "", value: "" }` to `row.conditions`.
- The attribute block only renders when `row.event` is non-empty.
- Style matches the main trigger's "With attribute" section exactly.

**Data update:** `update({ events: events.map(...) })` — same update pattern already used.

`emptyEventAction()` updated to return `{ qualifier: "has_done", event: "", conditions: [] }`.

### 2b. Evaluate Section

**File:** `src/components/flows/builder/trigger/Step1WhenContent.jsx`  
**Location:** EVALUATE block inside each trigger group

Only shown when `ev?.advance_evaluate` is true (Abandoned Cart, Abandoned Checkout, Abandoned Product, Abandoned Payment).

Layout:

```
EVALUATE  ─────────────────────────────────────────────
Evaluate events within  [1  ] [Hour ▾]

[Property ▾] [Operator ▾] [Value           ] [trash]
+ Add evaluate rule
```

- Time range row is always visible when the EVALUATE block is open (mandatory).
- Number input: min=1, type=number, stored in `group.evaluateTime.value`.
- Unit select: options = `["Minute", "Hour", "Day"]`, stored in `group.evaluateTime.unit`.
- Attribute rows and "+ Add evaluate rule" button remain unchanged.

### 2c. Hide Control Groups (Step 2)

**File:** `src/components/flows/builder/trigger/Step2WhoContent.jsx`

Wrap both labels with `{false && (...)}` — state fields `global_control` / `flow_control` remain in `emptyAudience()` and the data shape, just not rendered.

---

## 3. Canvas Preview Update

**File:** `src/components/flows/builder/triggerNodeUtils.js`  
**Function:** `summariseNewFormat`

In the `triggerGroups` map, when `group.evaluateTime` is set, add an `evaluateLine` field:

```js
evaluateLine: group.evaluateTime
  ? `Evaluate within ${group.evaluateTime.value} ${group.evaluateTime.unit}`
  : null,
```

**File:** `src/components/flows/builder/nodes/StartTriggerNode.jsx`

Render `evaluateLine` in the trigger group summary block, below existing filter lines, when non-null.

---

## 4. Abandoned Payment Event

### 4a. `src/data/eventCatalogue.json`

Add card in the same header/section as Abandoned Cart and Abandoned Checkout:

```json
{
  "name": "Abandoned Payment",
  "description": "When a user abandons the payment step without completing purchase",
  "source": "Shopify",
  "device_tag": ["iOS", "Android", "Website"],
  "attribute_allowed": true,
  "advance_evaluate": true,
  "audience_qualification_allow": true,
  "time_attribute_allow": false,
  "header": "Ecommerce",
  "section": "Shopping behaviour"
}
```

Also add to the `"ALL"` section mirror (same structure as Cart/Checkout/Product).

### 4b. `attributes_by_event` in `eventCatalogue.json`

Add `"Abandoned Payment"` key with the same 10 evaluate attributes as Abandoned Cart:

| Attribute | data_type | selection_option | examples | operators | is_evaluate |
|---|---|---|---|---|---|
| Product Viewed | string | Single select | [First Product View, Last Product View] | ["is"] | true |
| Frequent Product View | string | Single select | [Maximum Product Viewed, Least Product Viewed] | ["is"] | true |
| Product Viewed Price | string | Single select | [Most Priced Product, Least Priced Product] | ["is"] | true |
| Product Quantity | string | Single select | [Highest Quantity, Least Quantity] | ["is"] | true |
| Discount | string | Single select | [AttemptClicked, Selected, Removed] | ["is"] | true |
| Frequent Product Add to Cart | string | Single select | [Most Product Add to Cart, Least Product Add to Cart] | ["is"] | true |
| Frequent Product Remove from Cart | string | Single select | [Most Product Remove from Cart, Least Product Remove from Cart] | ["is"] | true |
| UTM Source | string | Value | [] | [Is, Is Not, Contains, Doesn't Contain, Starts With, Ends With, Exists, Doesn't Exist] | true |
| UTM Medium | string | Value | [] | [Is, Is Not, Contains, Doesn't Contain, Starts With, Ends With, Exists, Doesn't Exist] | true |
| UTM Campaign | string | Value | [] | [Is, Is Not, Contains, Doesn't Contain, Starts With, Ends With, Exists, Doesn't Exist] | true |

### 4c. `src/components/flows/builder/triggerEventProperties.js`

Add `"abandoned payment"` entry to `CATALOGUE` — mirror of `"abandoned cart"` (same properties).

---

## 5. Files Changed

| File | Change |
|---|---|
| `src/data/eventCatalogue.json` | Add Abandoned Payment card + attributes_by_event entry |
| `src/components/flows/builder/triggerEventProperties.js` | Add "abandoned payment" catalogue entry |
| `src/components/flows/builder/trigger/Step1WhenContent.jsx` | Exit condition attrs + evaluate time range + update emptyGroup/emptyEventAction |
| `src/components/flows/builder/trigger/Step2WhoContent.jsx` | Hide global_control + flow_control |
| `src/components/flows/builder/triggerNodeUtils.js` | Add evaluateLine to triggerGroups summary |
| `src/components/flows/builder/nodes/StartTriggerNode.jsx` | Render evaluateLine in canvas node |

---

## 6. Out of Scope

- No changes to `StartTriggerWizard.jsx` data flow (evaluateTime is inside triggerGroups, already passed through)
- No API integration — all data remains static/mock
- No changes to audience filter builder or broadcast config
