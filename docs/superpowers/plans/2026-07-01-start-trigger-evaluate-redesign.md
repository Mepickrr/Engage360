# Start Trigger Evaluate Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the evaluate section's open-ended attribute condition rows with a single two-level cascading select (parameter → value), and update all four abandoned event attribute mappings.

**Architecture:** Three files change: the JSON data catalogue (new attribute categories per event), the Step1WhenContent UI component (two-level selects replacing multi-row attribute conditions), and the canvas preview utility (updated evaluateLine logic). No other files need changes.

**Tech Stack:** React 19, plain JSON, Tailwind CSS.

## Global Constraints

- `group.evaluate` shape changes from array → single `{ parameter, value }` object or null
- `emptyGroup()` must use `evaluate: null` (not `[]`)
- Level 2 select is disabled until Level 1 is selected
- Changing Level 1 clears Level 2 (sets `value: ""`)
- UTM Source/Medium/Campaign entries are REMOVED from all 4 abandoned events
- All new evaluate attributes: `is_evaluate: true`, `selection_option: "Single select"`, `data_type: "string"`
- No extra files, no extra features, no backwards-compat shims

---

### Task 1: Update eventCatalogue.json attributes_by_event

**Files:**
- Modify: `src/data/eventCatalogue.json`

**Interfaces:**
- Produces: `attributes_by_event["Abandoned Cart"]`, `attributes_by_event["Abandoned Payment"]`, `attributes_by_event["Abandoned Checkout"]`, `attributes_by_event["Abandoned Product"]` — each entry: `{ name, data_type: "string", selection_option: "Single select", operators: ["is"], examples: [...], is_evaluate: true }`

- [ ] **Step 1: Replace Abandoned Cart entries**

New Abandoned Cart (7 entries, NO UTM entries):
```json
[
  { "name": "Cart Viewed", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["First Cart View", "Last Cart View"], "is_evaluate": true },
  { "name": "Cart Session", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["Maximum Cart Session", "Least Cart Session"], "is_evaluate": true },
  { "name": "Cart Viewed Price", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["Most Priced Cart", "Least Priced Cart"], "is_evaluate": true },
  { "name": "Cart Quantity", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["Highest Quantity", "Least Quantity"], "is_evaluate": true },
  { "name": "Discount", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["AttemptClicked", "Selected", "Removed"], "is_evaluate": true },
  { "name": "Frequent Product Add to Cart", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["Most Product Add to Cart", "Least Product Add to Cart"], "is_evaluate": true },
  { "name": "Frequent Product Remove from Cart", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["Most Product Remove from Cart", "Least Product Remove from Cart"], "is_evaluate": true }
]
```

- [ ] **Step 2: Replace Abandoned Payment entries**

New Abandoned Payment (7 entries, NO UTM entries):
```json
[
  { "name": "Product Viewed", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["First Product View", "Last Product View"], "is_evaluate": true },
  { "name": "Frequent Product View", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["Maximum Product Viewed", "Least Product Viewed"], "is_evaluate": true },
  { "name": "Product Viewed Price", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["Most Priced Product", "Least Priced Product"], "is_evaluate": true },
  { "name": "Product Quantity", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["Highest Quantity", "Least Quantity"], "is_evaluate": true },
  { "name": "Discount", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["AttemptClicked", "Selected", "Removed"], "is_evaluate": true },
  { "name": "Frequent Product Add to Cart", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["Most Product Add to Cart", "Least Product Add to Cart"], "is_evaluate": true },
  { "name": "Frequent Product Remove from Cart", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["Most Product Remove from Cart", "Least Product Remove from Cart"], "is_evaluate": true }
]
```

- [ ] **Step 3: Replace Abandoned Checkout entries**

New Abandoned Checkout (8 entries — includes Payment Gateway, NO UTM entries):
```json
[
  { "name": "Payment Gateway", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["Frequently selected mode"], "is_evaluate": true },
  { "name": "Product Viewed", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["First Product View", "Last Product View"], "is_evaluate": true },
  { "name": "Frequent Product View", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["Maximum Product Viewed", "Least Product Viewed"], "is_evaluate": true },
  { "name": "Product Viewed Price", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["Most Priced Product", "Least Priced Product"], "is_evaluate": true },
  { "name": "Product Quantity", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["Highest Quantity", "Least Quantity"], "is_evaluate": true },
  { "name": "Discount", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["AttemptClicked", "Selected", "Removed"], "is_evaluate": true },
  { "name": "Frequent Product Add to Cart", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["Most Product Add to Cart", "Least Product Add to Cart"], "is_evaluate": true },
  { "name": "Frequent Product Remove from Cart", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["Most Product Remove from Cart", "Least Product Remove from Cart"], "is_evaluate": true }
]
```

- [ ] **Step 4: Replace Abandoned Product entries**

New Abandoned Product (4 entries only — reduced set, NO UTM entries):
```json
[
  { "name": "Product Viewed", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["First Product View", "Last Product View"], "is_evaluate": true },
  { "name": "Frequent Product View", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["Maximum Product Viewed", "Least Product Viewed"], "is_evaluate": true },
  { "name": "Product Viewed Price", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["Most Priced Product", "Least Priced Product"], "is_evaluate": true },
  { "name": "Product Quantity", "data_type": "string", "selection_option": "Single select", "operators": ["is"], "examples": ["Highest Quantity", "Least Quantity"], "is_evaluate": true }
]
```

- [ ] **Step 5: Commit**

```bash
git add src/data/eventCatalogue.json
git commit -m "feat: update abandoned event evaluate attributes — new categories, remove UTM"
```

---

### Task 2: Update Step1WhenContent.jsx — two-level cascading select

**Files:**
- Modify: `src/components/flows/builder/trigger/Step1WhenContent.jsx`

**Interfaces:**
- Consumes: `catalogueData.attributes_by_event[eventName]` — array of `{ name, examples, is_evaluate }` from Task 1
- `group.evaluate` shape: `{ parameter: string, value: string } | null`
- `group.evaluateTime`: `{ value: number, unit: "Minute"|"Hour"|"Day" }` — unchanged

- [ ] **Step 1: Update emptyGroup to use evaluate: null**

Find `emptyGroup` function and change `evaluate: []` to `evaluate: null`:

```js
function emptyGroup(eventName) {
  return {
    event: eventName,
    conditions: [],
    evaluate: null,
    evaluateTime: { value: 1, unit: "Hour" },
    combinator: "AND",
  };
}
```

- [ ] **Step 2: Replace EVALUATE block attribute rows with two-level cascading select**

Find the EVALUATE block (lines ~184–259 in Step1WhenContent.jsx). Replace the `{evalPool.length > 0 && (...)}` section — the `AttributeConditionRow` rows and "+ Add evaluate rule" button — with:

```jsx
{/* Two-level cascading evaluate select */}
{evalPool.length > 0 && (
  <div className="flex items-center gap-2 flex-wrap">
    <span className="text-sm text-text-secondary">Evaluate by</span>
    <select
      value={group.evaluate?.parameter || ""}
      onChange={(e) => {
        const v = e.target.value;
        updateGroup(gi, { evaluate: v ? { parameter: v, value: "" } : null });
      }}
      className="h-9 text-sm rounded-md border border-border bg-surface px-2 focus:outline-none focus:border-primary/60"
    >
      <option value="">Select parameter…</option>
      {evalPool.map((a) => (
        <option key={a.name} value={a.name}>{a.name}</option>
      ))}
    </select>
    {group.evaluate?.parameter && (
      <>
        <span className="text-text-muted">→</span>
        <select
          value={group.evaluate?.value || ""}
          onChange={(e) =>
            updateGroup(gi, {
              evaluate: { ...group.evaluate, value: e.target.value },
            })
          }
          className="h-9 text-sm rounded-md border border-border bg-surface px-2 focus:outline-none focus:border-primary/60"
        >
          <option value="">Select value…</option>
          {(evalPool.find((a) => a.name === group.evaluate.parameter)?.examples || []).map(
            (ex) => (
              <option key={ex} value={ex}>{ex}</option>
            )
          )}
        </select>
      </>
    )}
  </div>
)}
```

- [ ] **Step 3: Remove unused imports if AttributeConditionRow is no longer used elsewhere**

Check if `AttributeConditionRow` is used anywhere else in this file. If only used in the evaluate block (now removed), remove its import. Also check `emptyCondition` — remove if unused.

- [ ] **Step 4: Verify the file builds (no syntax errors)**

```bash
cd /Users/meenalkamalakar/Documents/dowl && npx tsc --noEmit 2>&1 | head -20 || echo "no tsc"
```

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/trigger/Step1WhenContent.jsx
git commit -m "feat: replace evaluate attribute rows with two-level cascading select"
```

---

### Task 3: Update triggerNodeUtils.js — new evaluateLine logic

**Files:**
- Modify: `src/components/flows/builder/triggerNodeUtils.js`

**Interfaces:**
- Consumes: `group.evaluate` — `{ parameter, value } | null` (from Task 2)
- `group.evaluateTime` — `{ value: number, unit: string }` — unchanged

- [ ] **Step 1: Update evaluateLine in summariseNewFormat**

Find the current evaluateLine (around line 208):
```js
evaluateLine: (group.evaluateTime?.value > 0)
  ? `Evaluate within ${group.evaluateTime.value} ${group.evaluateTime.unit}`
  : null,
```

Replace with:
```js
evaluateLine: (group.evaluateTime?.value > 0 && group.evaluate?.value)
  ? `Evaluate: ${group.evaluate.value}`
  : (group.evaluateTime?.value > 0)
  ? `Evaluate within ${group.evaluateTime.value} ${group.evaluateTime.unit}`
  : null,
```

- [ ] **Step 2: Update the comment on line 15 to reflect new evaluate shape**

Find:
```
// Wizard produces: { kind, triggerGroups: [{ event, conditions, evaluate, evaluateTime, combinator }],
```

Replace `evaluate` description if there's one. Just update to note the new shape if the comment is detailed enough. If it just lists fields, leave it.

- [ ] **Step 3: Commit**

```bash
git add src/components/flows/builder/triggerNodeUtils.js
git commit -m "feat: update evaluateLine to show selected evaluate value"
```
