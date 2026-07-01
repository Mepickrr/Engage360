# Start Trigger: Evaluate Section, Exit Condition Attrs, Abandoned Payment

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add evaluate time-range + attribute filters to the start trigger's EVALUATE block (abandoned events only), attribute filters to exit conditions, add Abandoned Payment as a first-class event, and hide control group checkboxes in Step 2.

**Architecture:** All changes are in the shared trigger components under `src/components/flows/builder/trigger/` — both `FlowBuilder.jsx` and `FlowBuilderV2.jsx` share these, so changes apply automatically to both builders. Data additions go into `src/data/eventCatalogue.json` and `src/components/flows/builder/triggerEventProperties.js`. Canvas preview changes are in `triggerNodeUtils.js` and `StartTriggerNode.jsx`.

**Tech Stack:** React 19, Radix UI (Select), Tailwind CSS, Lucide React icons, CRACO/CRA build. No test files exist in this project — verification is done by running the dev server and testing manually.

## Global Constraints

- Use `npm start` (runs `craco start`) to launch the dev server — do NOT use `yarn start`
- All Tailwind classes must match existing patterns in the file being edited — never invent new ones
- `attributesPool` passed to `AttributeConditionRow` must only contain non-evaluate attrs: `getAttrPool(eventName).filter(a => !a.is_evaluate)`
- `emptyCondition()` is already exported from `Step1WhenContent.jsx` — reuse it, don't duplicate
- `getAttrPool` is already defined in `Step1WhenContent.jsx` — reuse it, don't move it
- The `advance_evaluate: true` flag on event cards in `eventCatalogue.json` is the sole gate for showing the EVALUATE block — do not add new flags
- JSON edits to `eventCatalogue.json` must keep it valid JSON — verify with `python3 -c "import json; json.load(open('src/data/eventCatalogue.json'))"`

---

## File Map

| File | Change |
|---|---|
| `src/data/eventCatalogue.json` | Add Abandoned Payment card + `attributes_by_event` entry |
| `src/components/flows/builder/triggerEventProperties.js` | Add `"abandoned payment"` to `CATALOGUE` |
| `src/components/flows/builder/trigger/Step2WhoContent.jsx` | Hide global_control + flow_control with `{false && ...}` |
| `src/components/flows/builder/trigger/Step1WhenContent.jsx` | Update `emptyGroup` + `emptyEventAction`; add evaluate time range UI; add exit condition attribute rows |
| `src/components/flows/builder/triggerNodeUtils.js` | Add `evaluateLine` to `summariseNewFormat` trigger group map |
| `src/components/flows/builder/nodes/StartTriggerNode.jsx` | Render `evaluateLine` in `TriggerGroupRow` |

---

### Task 1: Add Abandoned Payment to Event Catalogue and Properties

**Files:**
- Modify: `src/data/eventCatalogue.json`
- Modify: `src/components/flows/builder/triggerEventProperties.js`

**Interfaces:**
- Produces: Event name `"Abandoned Payment"` available in the event picker with `advance_evaluate: true` and 10 evaluate attributes in `attributes_by_event`

- [ ] **Step 1: Add Abandoned Payment card to `eventCatalogue.json`**

Find the `"Shopping behaviour"` array under `"Ecommerce"` — it already contains `"Abandoned Cart"` and `"Abandoned Checkout"`. Add this object immediately after `"Abandoned Checkout"`:

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

Also find the `"ALL"` header's `"Shopping behaviour"` array (same file, same structure) and add the identical object there as well.

- [ ] **Step 2: Add `attributes_by_event` entry for Abandoned Payment**

In the `"attributes_by_event"` object (bottom of `eventCatalogue.json`), add a `"Abandoned Payment"` key with this value (identical structure to `"Abandoned Cart"`):

```json
"Abandoned Payment": [
  {
    "name": "Product Viewed",
    "data_type": "string",
    "selection_option": "Single select",
    "examples": ["First Product View", "Last Product View"],
    "operators": ["is"],
    "is_evaluate": true
  },
  {
    "name": "Frequent Product View",
    "data_type": "string",
    "selection_option": "Single select",
    "examples": ["Maximum Product Viewed", "Least Product Viewed"],
    "operators": ["is"],
    "is_evaluate": true
  },
  {
    "name": "Product Viewed Price",
    "data_type": "string",
    "selection_option": "Single select",
    "examples": ["Most Priced Product", "Least Priced Product"],
    "operators": ["is"],
    "is_evaluate": true
  },
  {
    "name": "Product Quantity",
    "data_type": "string",
    "selection_option": "Single select",
    "examples": ["Highest Quantity", "Least Quantity"],
    "operators": ["is"],
    "is_evaluate": true
  },
  {
    "name": "Discount",
    "data_type": "string",
    "selection_option": "Single select",
    "examples": ["AttemptClicked", "Selected", "Removed"],
    "operators": ["is"],
    "is_evaluate": true
  },
  {
    "name": "Frequent Product Add to Cart",
    "data_type": "string",
    "selection_option": "Single select",
    "examples": ["Most Product Add to Cart", "Least Product Add to Cart"],
    "operators": ["is"],
    "is_evaluate": true
  },
  {
    "name": "Frequent Product Remove from Cart",
    "data_type": "string",
    "selection_option": "Single select",
    "examples": ["Most Product Remove from Cart", "Least Product Remove from Cart"],
    "operators": ["is"],
    "is_evaluate": true
  },
  {
    "name": "UTM Source",
    "data_type": "string",
    "selection_option": "Value",
    "examples": [],
    "operators": ["Is", "Is Not", "Contains", "Doesn't Contain", "Starts With", "Ends With", "Exists", "Doesn't Exist"],
    "is_evaluate": true
  },
  {
    "name": "UTM Medium",
    "data_type": "string",
    "selection_option": "Value",
    "examples": [],
    "operators": ["Is", "Is Not", "Contains", "Doesn't Contain", "Starts With", "Ends With", "Exists", "Doesn't Exist"],
    "is_evaluate": true
  },
  {
    "name": "UTM Campaign",
    "data_type": "string",
    "selection_option": "Value",
    "examples": [],
    "operators": ["Is", "Is Not", "Contains", "Doesn't Contain", "Starts With", "Ends With", "Exists", "Doesn't Exist"],
    "is_evaluate": true
  }
]
```

- [ ] **Step 3: Validate JSON is still valid**

```bash
python3 -c "import json; json.load(open('src/data/eventCatalogue.json')); print('OK')"
```

Expected output: `OK`

- [ ] **Step 4: Add `"abandoned payment"` to `triggerEventProperties.js` CATALOGUE**

In `src/components/flows/builder/triggerEventProperties.js`, find the `"abandoned cart"` entry (currently not present — `eventCatalogue.json` is the primary source for abandoned events, so this entry serves as a fallback). Add this after the existing `CATALOGUE` entries for ecommerce, before the `// ── Evaluate computations ───` section. Mirror the structure of any other event:

```js
"abandoned payment": [
  a("Product Price",    "product_price",  "Numeric", N),
  a("Currency",         "currency",       "String",  S),
  a("UTM Source",       "utm_source",     "String",  S),
  a("UTM Medium",       "utm_medium",     "String",  S),
  a("UTM Campaign",     "utm_campaign",   "String",  S),
  b("Product Name",     "product_name",   "product_picker"),
  b("Product Id",       "product_id",     "product_picker"),
  b("SKU ID",           "sku_id",         "sku_picker"),
],
```

- [ ] **Step 5: Commit**

```bash
git add src/data/eventCatalogue.json src/components/flows/builder/triggerEventProperties.js
git commit -m "feat: add Abandoned Payment event to catalogue and properties"
```

---

### Task 2: Hide Control Groups in Step 2

**Files:**
- Modify: `src/components/flows/builder/trigger/Step2WhoContent.jsx:147-164`

**Interfaces:**
- Consumes: nothing from other tasks
- Produces: `global_control` and `flow_control` checkboxes no longer render (data fields remain in state)

- [ ] **Step 1: Wrap both control group labels in `{false && (...)}`**

In `Step2WhoContent.jsx`, find the two label elements (lines ~147–164):

```jsx
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!audience.global_control}
            onChange={(e) => setAudience({ ...audience, global_control: e.target.checked })}
            className="accent-primary"
          />
          <span className="text-sm font-medium">Global control group</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!audience.flow_control}
            onChange={(e) => setAudience({ ...audience, flow_control: e.target.checked })}
            className="accent-primary"
          />
          <span className="text-sm font-medium">Flow control group</span>
        </label>
```

Replace with:

```jsx
        {false && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!audience.global_control}
              onChange={(e) => setAudience({ ...audience, global_control: e.target.checked })}
              className="accent-primary"
            />
            <span className="text-sm font-medium">Global control group</span>
          </label>
        )}
        {false && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!audience.flow_control}
              onChange={(e) => setAudience({ ...audience, flow_control: e.target.checked })}
              className="accent-primary"
            />
            <span className="text-sm font-medium">Flow control group</span>
          </label>
        )}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/flows/builder/trigger/Step2WhoContent.jsx
git commit -m "feat: hide global and flow control group checkboxes in Step 2"
```

---

### Task 3: Evaluate Section — Mandatory Time Range

**Files:**
- Modify: `src/components/flows/builder/trigger/Step1WhenContent.jsx`

**Interfaces:**
- Consumes: nothing from other tasks
- Produces: `group.evaluateTime: { value: number, unit: "Minute"|"Hour"|"Day" }` stored in triggerGroups state; consumed by Task 5 (canvas preview)

- [ ] **Step 1: Update `emptyGroup` to include `evaluateTime`**

Find `emptyGroup` (line ~40):

```js
function emptyGroup(eventName) {
  return {
    event: eventName,
    conditions: [],
    evaluate: [],
    combinator: "AND",
  };
}
```

Replace with:

```js
function emptyGroup(eventName) {
  return {
    event: eventName,
    conditions: [],
    evaluate: [],
    evaluateTime: { value: 1, unit: "Hour" },
    combinator: "AND",
  };
}
```

- [ ] **Step 2: Add time range row to the EVALUATE block UI**

Find the EVALUATE block (lines ~183–226):

```jsx
              {/* EVALUATE block (Abandoned* events) */}
              {ev?.advance_evaluate && evalPool.length > 0 && (
                <div className="mt-4 border-t border-dashed border-border pt-3">
                  <div className="text-[11px] uppercase tracking-wide text-text-muted font-semibold mb-2">
                    Evaluate
                  </div>
                  <div className="space-y-2">
```

Replace the entire EVALUATE block with:

```jsx
              {/* EVALUATE block (Abandoned* events) */}
              {ev?.advance_evaluate && (
                <div className="mt-4 border-t border-dashed border-border pt-3">
                  <div className="text-[11px] uppercase tracking-wide text-text-muted font-semibold mb-2">
                    Evaluate
                  </div>
                  {/* Mandatory time range */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-text-secondary">Evaluate events within</span>
                    <input
                      type="number"
                      min={1}
                      value={group.evaluateTime?.value ?? 1}
                      onChange={(e) =>
                        updateGroup(gi, {
                          evaluateTime: { ...(group.evaluateTime || { unit: "Hour" }), value: Number(e.target.value) },
                        })
                      }
                      className="w-16 px-2 py-1.5 text-sm rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
                    />
                    <select
                      value={group.evaluateTime?.unit || "Hour"}
                      onChange={(e) =>
                        updateGroup(gi, {
                          evaluateTime: { ...(group.evaluateTime || { value: 1 }), unit: e.target.value },
                        })
                      }
                      className="h-9 text-sm rounded-md border border-border bg-surface px-2 focus:outline-none focus:border-primary/60"
                    >
                      <option value="Minute">Minute</option>
                      <option value="Hour">Hour</option>
                      <option value="Day">Day</option>
                    </select>
                  </div>
                  {/* Attribute evaluate rules */}
                  {evalPool.length > 0 && (
                    <>
                      <div className="space-y-2">
                        {(group.evaluate || []).map((c, ci) => (
                          <AttributeConditionRow
                            key={ci}
                            testId={`trigger-eval-${gi}-${ci}`}
                            condition={c}
                            attributesPool={evalPool}
                            onChange={(nc) =>
                              updateGroup(gi, {
                                evaluate: (group.evaluate || []).map((x, i) =>
                                  i === ci ? nc : x,
                                ),
                              })
                            }
                            onRemove={() =>
                              updateGroup(gi, {
                                evaluate: (group.evaluate || []).filter(
                                  (_, i) => i !== ci,
                                ),
                              })
                            }
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateGroup(gi, {
                            evaluate: [...(group.evaluate || []), emptyCondition()],
                          })
                        }
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add evaluate rule
                      </button>
                    </>
                  )}
                </div>
              )}
```

Note the gate changed from `ev?.advance_evaluate && evalPool.length > 0` to just `ev?.advance_evaluate` — the time range must show even when there are no attribute rules yet.

- [ ] **Step 3: Verify visually**

Run `npm start`, open a flow, click the start trigger, select "Abandoned Cart". Confirm:
- EVALUATE section appears
- "Evaluate events within 1 Hour" time range row is present and editable
- Changing the number and unit persists when you reopen
- "+ Add evaluate rule" button still works and shows attribute rows
- Selecting "Product viewed" (a non-abandoned event) → EVALUATE section does NOT appear

- [ ] **Step 4: Commit**

```bash
git add src/components/flows/builder/trigger/Step1WhenContent.jsx
git commit -m "feat: add mandatory evaluate time range to abandoned event trigger groups"
```

---

### Task 4: Exit Condition Attribute Filters

**Files:**
- Modify: `src/components/flows/builder/trigger/Step1WhenContent.jsx`

**Interfaces:**
- Consumes: `emptyCondition()` (already exported from this file), `getAttrPool()` (already defined in this file), `AttributeConditionRow` (already imported)
- Produces: `exitTrigger.events[i].conditions: Array<{ property: string, operator: string, value: any }>` stored in exit trigger state

- [ ] **Step 1: Update `emptyEventAction` to include `conditions`**

`emptyEventAction` is imported from `./audience/EventActionRow`. Open `src/components/flows/builder/trigger/audience/EventActionRow.jsx` and find (line ~99):

```js
export function emptyEventAction() {
  return { qualifier: "has_done", event: "" };
}
```

Replace with:

```js
export function emptyEventAction() {
  return { qualifier: "has_done", event: "", conditions: [] };
}
```

- [ ] **Step 2: Add attribute rows inside `ExitTriggerSection`**

In `Step1WhenContent.jsx`, find the `events.map((row, i) => ...)` block inside `ExitTriggerSection` (lines ~307–330):

```jsx
          <div className="space-y-2">
            {events.map((row, i) => (
              <EventActionRow
                key={i}
                value={row}
                onChange={(v) =>
                  update({
                    events: events.map((x, idx) => (idx === i ? v : x)),
                  })
                }
                onRemove={
                  events.length > 1
                    ? () =>
                        update({
                          events: events.filter((_, idx) => idx !== i),
                        })
                    : undefined
                }
                testId={`exit-row-${i}`}
              />
            ))}
          </div>
```

Replace with:

```jsx
          <div className="space-y-3">
            {events.map((row, i) => {
              const exitAttrPool = row.event
                ? getAttrPool(row.event).filter((a) => !a.is_evaluate)
                : [];
              return (
                <div key={i}>
                  <EventActionRow
                    value={row}
                    onChange={(v) =>
                      update({
                        events: events.map((x, idx) => (idx === i ? { ...v, conditions: x.conditions || [] } : x)),
                      })
                    }
                    onRemove={
                      events.length > 1
                        ? () =>
                            update({
                              events: events.filter((_, idx) => idx !== i),
                            })
                        : undefined
                    }
                    testId={`exit-row-${i}`}
                  />
                  {row.event && (
                    <div className="mt-2 ml-2 pl-3 border-l border-border">
                      <div className="text-[11px] uppercase tracking-wide text-text-muted font-semibold mb-2">
                        With attribute
                      </div>
                      <div className="space-y-2">
                        {(row.conditions || []).map((c, ci) => (
                          <React.Fragment key={ci}>
                            {ci > 0 && (
                              <CombinatorPill
                                value="AND"
                                onChange={() => {}}
                                testId={`exit-attr-combinator-${i}-${ci}`}
                              />
                            )}
                            <AttributeConditionRow
                              testId={`exit-attr-${i}-${ci}`}
                              condition={c}
                              attributesPool={exitAttrPool}
                              onChange={(nc) =>
                                update({
                                  events: events.map((x, idx) =>
                                    idx === i
                                      ? {
                                          ...x,
                                          conditions: (x.conditions || []).map((cc, cii) =>
                                            cii === ci ? nc : cc,
                                          ),
                                        }
                                      : x,
                                  ),
                                })
                              }
                              onRemove={() =>
                                update({
                                  events: events.map((x, idx) =>
                                    idx === i
                                      ? {
                                          ...x,
                                          conditions: (x.conditions || []).filter(
                                            (_, cii) => cii !== ci,
                                          ),
                                        }
                                      : x,
                                  ),
                                })
                              }
                            />
                          </React.Fragment>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          update({
                            events: events.map((x, idx) =>
                              idx === i
                                ? { ...x, conditions: [...(x.conditions || []), emptyCondition()] }
                                : x,
                            ),
                          })
                        }
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
                        data-testid={`exit-add-attr-${i}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add condition
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
```

- [ ] **Step 3: Verify visually**

Run `npm start`. Open a flow, click the start trigger. Scroll to the "Exit Trigger" section at the bottom of Step 1:
- Click "+ Add Exit Trigger"
- Select an exit event (e.g. "Order placed")
- Confirm "With attribute" section appears below the event row
- Click "+ Add condition" → an attribute row appears with property/operator/value dropdowns
- Confirm property dropdown is populated with that event's attributes
- Confirm removing the attribute row works (trash icon)
- Confirm clearing the exit event hides the "With attribute" section
- Confirm an event with NO attributes (e.g. "Segment entry") shows the "With attribute" header with empty pool — this is acceptable, user just can't add rows (the `+ Add condition` can still show since the pool is empty the Select will be empty, which is fine)

- [ ] **Step 4: Commit**

```bash
git add src/components/flows/builder/trigger/audience/EventActionRow.jsx
git add src/components/flows/builder/trigger/Step1WhenContent.jsx
git commit -m "feat: add event attribute filters to exit condition rows"
```

---

### Task 5: Canvas Preview — Evaluate Time Range

**Files:**
- Modify: `src/components/flows/builder/triggerNodeUtils.js:194-208`
- Modify: `src/components/flows/builder/nodes/StartTriggerNode.jsx:147-183`

**Interfaces:**
- Consumes: `group.evaluateTime: { value: number, unit: string }` produced by Task 3
- Produces: `triggerGroups[i].evaluateLine: string | null` consumed by `TriggerGroupRow` in `StartTriggerNode.jsx`

- [ ] **Step 1: Add `evaluateLine` to `summariseNewFormat` in `triggerNodeUtils.js`**

Find the `triggerGroups` map in `summariseNewFormat` (lines ~194–208):

```js
  const triggerGroups = shownGroups.map((group) => {
    const eventName = group.event || "Event";
    const conditions = (group.conditions || []).filter((c) => c.property);
    const allFilters = conditions.map((c) => fmtConditionLine(c)).filter(Boolean);
    const firstFilter = allFilters[0] || null;
    const extraFilterCount = Math.max(0, allFilters.length - 1);
    return {
      events: [eventName],
      eventExtra: 0,
      firstFilter,
      extraFilterCount,
      allFilters,
      filterCombinator: group.combinator || "AND",
      hasEvaluate: (group.evaluate || []).length > 0,
    };
  });
```

Replace with:

```js
  const triggerGroups = shownGroups.map((group) => {
    const eventName = group.event || "Event";
    const conditions = (group.conditions || []).filter((c) => c.property);
    const allFilters = conditions.map((c) => fmtConditionLine(c)).filter(Boolean);
    const firstFilter = allFilters[0] || null;
    const extraFilterCount = Math.max(0, allFilters.length - 1);
    return {
      events: [eventName],
      eventExtra: 0,
      firstFilter,
      extraFilterCount,
      allFilters,
      filterCombinator: group.combinator || "AND",
      hasEvaluate: (group.evaluate || []).length > 0,
      evaluateLine: group.evaluateTime
        ? `Evaluate within ${group.evaluateTime.value} ${group.evaluateTime.unit}`
        : null,
    };
  });
```

- [ ] **Step 2: Render `evaluateLine` in `TriggerGroupRow` in `StartTriggerNode.jsx`**

Find `TriggerGroupRow` (lines ~147–183). Find the closing `</div>` after the `ConditionTree` block:

```jsx
      {/* Conditions with tree connector */}
      {allFilters.length > 0 && (
        <ConditionTree
          conditions={allFilters}
          combinator={group.filterCombinator || "AND"}
          accent={PRIMARY}
        />
      )}
    </div>
```

Replace with:

```jsx
      {/* Conditions with tree connector */}
      {allFilters.length > 0 && (
        <ConditionTree
          conditions={allFilters}
          combinator={group.filterCombinator || "AND"}
          accent={PRIMARY}
        />
      )}
      {/* Evaluate time range */}
      {group.evaluateLine && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-text-muted flex-shrink-0" />
          <span className="text-[10px] text-text-muted">{group.evaluateLine}</span>
        </div>
      )}
    </div>
```

`Clock` is already imported at the top of `StartTriggerNode.jsx` — no new import needed.

- [ ] **Step 3: Verify visually**

Run `npm start`. Open a flow:
1. Click the start trigger, select "Abandoned Cart", set evaluate time to `2 Hours`, click Finish.
2. Close the wizard — on the canvas node, the trigger group row should show `🕐 Evaluate within 2 Hour` below the event name.
3. Reopen, change to `30 Minutes`, finish — canvas updates accordingly.
4. Open a non-abandoned event (e.g. "Product viewed"), finish — canvas node shows NO evaluate line.

- [ ] **Step 4: Commit**

```bash
git add src/components/flows/builder/triggerNodeUtils.js
git add src/components/flows/builder/nodes/StartTriggerNode.jsx
git commit -m "feat: show evaluate time range in start trigger canvas node preview"
```

---

## Self-Review

**Spec coverage check:**
- ✅ 1.1 Exit condition attribute filters — Task 4
- ✅ 1.2 Evaluate section only for abandoned events — Task 3 (gate: `ev?.advance_evaluate`)
- ✅ 1.2 Evaluate time range (mandatory, integer + Minute/Hour/Day) — Task 3
- ✅ 1.2 Evaluate section visible in canvas preview — Task 5
- ✅ 1.2 Evaluate attribute conditions — Task 3 (preserved from existing code)
- ✅ Abandoned Payment added everywhere — Task 1
- ✅ Hide control groups — Task 2
- ✅ Applies to both flow builders — shared components, no extra work needed

**Type consistency:**
- `group.evaluateTime` set in `emptyGroup()` (Task 3) → read in `triggerNodeUtils.js` (Task 5) ✅
- `exitTrigger.events[i].conditions` set in `emptyEventAction()` (Task 4) → read/written in `ExitTriggerSection` (Task 4) ✅
- `evaluateLine` set in `summariseNewFormat` (Task 5 Step 1) → read in `TriggerGroupRow` (Task 5 Step 2) ✅

**Placeholder scan:** None found.
