# Conditional Split Filter Tab Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat property/operator/value filter UI in the Conditional Split node with the same block-based audience filter used in the start trigger, adding a new "Event property" block type scoped to the flow's start trigger event — across both Flow Builder v1 (`src/`) and v2 (`app/frontend/src/`).

**Architecture:** Extract `ConditionBlockList` and related components from `Step2WhoContent.jsx` into a shared `AudienceFilterBuilder` component; create `EventPropertyConditions` as a fifth block type; update v1's `ConditionalSplitRightPanel` FilterTab to use these; create a full `ConditionalSplitNode` in v2 that imports the same shared components (both builders share the same `@/` alias pointing to `src/`).

**Tech Stack:** React 18, ReactFlow, Zustand (`useFlowBuilderStore`), Tailwind CSS, Lucide icons, `craco start` for dev server.

## Global Constraints

- `@/` alias resolves to `src/` — both v1 and v2 share this alias, so audience components created in `src/` are importable from v2 using `@/components/flows/builder/trigger/audience/...`
- All Tailwind classes must follow existing conventions (`text-primary`, `border-border`, `bg-surface`, `text-text-muted`, etc.)
- No new dependencies — all components use existing imports already in the codebase
- `filterGroups[].blocks` replaces `filterGroups[].conditions` — no migration needed (prototype-only, no persistence)
- Dev server: `yarn start` from the project root

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `src/components/flows/builder/nodes/ConditionalSplitNode/data/mockData.js` | Add `newBlock()`, update `newFilterGroup()`, update `defaultConditionalSplitData` |
| Create | `src/components/flows/builder/trigger/audience/AudienceFilterBuilder.jsx` | Shared block-based filter builder — replaces inlined ConditionBlockList |
| Modify | `src/components/flows/builder/trigger/Step2WhoContent.jsx` | Import AudienceFilterBuilder instead of inlined ConditionBlockList |
| Create | `src/components/flows/builder/trigger/audience/EventPropertyConditions.jsx` | New block type: filters on start trigger event attributes |
| Modify | `src/components/flows/builder/nodes/ConditionalSplitNode/ConditionalSplitRightPanel.jsx` | Replace FilterTab internals with AudienceFilterBuilder |
| Create | `app/frontend/src/components/flows/builder/nodes/ConditionalSplitNode/index.jsx` | v2 canvas node renderer (mirrors v1) |
| Create | `app/frontend/src/components/flows/builder/nodes/ConditionalSplitNode/ConditionalSplitRightPanel.jsx` | v2 full right panel (mirrors v1, adjusted imports) |
| Create | `app/frontend/src/components/flows/builder/nodes/ConditionalSplitNode/data/mockData.js` | v2 mock data (same shape as updated v1) |
| Modify | `app/frontend/src/components/flows/builder/Canvas.jsx` | Register `condition` → ConditionalSplitNode in nodeTypes |
| Modify | `app/frontend/src/components/flows/builder/panels/ConfigTab.jsx` | Route condition node to ConditionalSplitRightPanel |
| Modify | `app/frontend/src/components/flows/builder/nodes/LogicNode.jsx` | Remove `condition` from KIND_META |

---

## Task 1: Update v1 mockData.js — new data factories

**Files:**
- Modify: `src/components/flows/builder/nodes/ConditionalSplitNode/data/mockData.js`

**Interfaces:**
- Produces: `newBlock()`, updated `newFilterGroup(index)`, updated `defaultConditionalSplitData` — all consumed by Task 5

- [ ] **Step 1: Replace the mockData.js content**

Open `src/components/flows/builder/nodes/ConditionalSplitNode/data/mockData.js` and replace the entire file with:

```js
export const EXPRESSION_VARIABLE_GROUPS = [
  {
    id: "customer",
    label: "Customer variables",
    variables: [
      { key: "customer.id",          label: "Customer ID",     type: "Number", recommended: true  },
      { key: "customer.phone",       label: "Phone Number",    type: "String", recommended: true  },
      { key: "customer.email",       label: "Email",           type: "String", recommended: true  },
      { key: "customer.name",        label: "Full Name",       type: "String", recommended: true  },
      { key: "customer.first_name",  label: "First Name",      type: "String" },
      { key: "customer.last_name",   label: "Last Name",       type: "String" },
      { key: "customer.city",        label: "City",            type: "String" },
      { key: "customer.country",     label: "Country",         type: "String" },
      { key: "customer.tags",        label: "Tags",            type: "String" },
      { key: "customer.order_count", label: "Order Count",     type: "Number" },
      { key: "customer.total_spend", label: "Total Spend",     type: "Number" },
      { key: "customer.rfm",         label: "RFM Segment",     type: "String" },
      { key: "customer.is_new",      label: "Is New Customer", type: "Boolean"},
    ],
  },
  {
    id: "flow",
    label: "Flow variables",
    variables: [
      { key: "flow.orderId",       label: "Order ID",       type: "String", recommended: true },
      { key: "flow.paymentAmount", label: "Payment Amount", type: "Number", recommended: true },
      { key: "flow.orderAmount",   label: "Order Amount",   type: "Number", recommended: true },
      { key: "flow.paymentLink",   label: "Payment Link",   type: "String" },
      { key: "flow.paymentLinkId", label: "Payment Link ID",type: "String" },
    ],
  },
  {
    id: "local_responses",
    label: "Local User Responses",
    variables: [
      { key: "response.1", label: "Response 1", type: "String" },
      { key: "response.2", label: "Response 2", type: "String" },
      { key: "response.3", label: "Response 3", type: "String" },
    ],
  },
  {
    id: "store",
    label: "Store variables",
    variables: [
      { key: "store.name",     label: "Store Name", type: "String", recommended: true },
      { key: "store.currency", label: "Currency",   type: "String" },
      { key: "store.domain",   label: "Domain",     type: "String" },
      { key: "store.id",       label: "Store ID",   type: "String" },
    ],
  },
  {
    id: "global",
    label: "Global Variables",
    variables: [
      { key: "global.date",      label: "Current Date", type: "String", recommended: true },
      { key: "global.time",      label: "Current Time", type: "String", recommended: true },
      { key: "global.timestamp", label: "Timestamp",    type: "Number" },
    ],
  },
  {
    id: "session",
    label: "Session variables",
    variables: [
      { key: "session.platform",    label: "Platform",      type: "String" },
      { key: "session.referrer",    label: "Referrer URL",  type: "String" },
      { key: "session.device_type", label: "Device Type",   type: "String" },
      { key: "session.start_time",  label: "Session Start", type: "String" },
    ],
  },
];

export const EXPRESSION_OPERATORS = [
  { value: ">",        label: "> (greater than)"    },
  { value: "<",        label: "< (less than)"       },
  { value: ">=",       label: "≥ (greater or equal)"},
  { value: "<=",       label: "≤ (less or equal)"   },
  { value: "==",       label: "= (equals)"          },
  { value: "!=",       label: "≠ (not equals)"      },
  { value: "contains", label: "contains"            },
  { value: "%",        label: "% (modulo)"          },
];

export const PATH_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export function newBlock() {
  return {
    id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    type: "property",
    combinator: "AND",
    conditions: [],
    segments: [],
  };
}

export function newFilterGroup(index = 0) {
  return {
    id: `fg_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    label: `Branch ${index + 1}`,
    blocksCombinator: "AND",
    blocks: [newBlock()],
  };
}

export function newExpression(index = 0) {
  return {
    id: `expr_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    inputMode: "structured",
    variable: "",
    operator: ">",
    value: "",
    rawText: "",
  };
}

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
          conditions: [],
          segments: [],
        },
      ],
    },
  ],
  filterGroupsCombinator: "AND",
  abPaths: [
    { id: "path_a", label: "A", percentage: 50 },
    { id: "path_b", label: "B", percentage: 50 },
  ],
  abRandomise: false,
  expressions: [newExpression(0)],
  wiredPorts: [],
};
```

- [ ] **Step 2: Verify no syntax errors**

```bash
node -e "require('./src/components/flows/builder/nodes/ConditionalSplitNode/data/mockData.js')" 2>&1 || echo "Check for ES module syntax — if it errors, that is expected (ESM file)"
```

Expected: Either "Check for ES module syntax" (normal for ESM) or no output (CommonJS). No parse errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/flows/builder/nodes/ConditionalSplitNode/data/mockData.js
git commit -m "feat: update conditional split mockData to block-based filter shape

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Create AudienceFilterBuilder.jsx

**Files:**
- Create: `src/components/flows/builder/trigger/audience/AudienceFilterBuilder.jsx`

**Interfaces:**
- Consumes: `UserPropertyConditions`, `UserBehaviorConditions`, `UserAffinityConditions`, `EventPropertyConditions` (Task 4), `CombinatorPill` — all from `./` relative imports
- Produces: `default export AudienceFilterBuilder({ blockSet, onChange, testIdPrefix, blockTypes })` where `blockSet = { blocks: Block[], blocksCombinator: "AND"|"OR" }` and `blockTypes = [{ id: string, label: string }]`

- [ ] **Step 1: Create the file**

Create `src/components/flows/builder/trigger/audience/AudienceFilterBuilder.jsx` with this content:

```jsx
import React, { useState } from "react";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import CombinatorPill from "./CombinatorPill";
import UserPropertyConditions from "./UserPropertyConditions";
import UserBehaviorConditions from "./UserBehaviorConditions";
import UserAffinityConditions from "./UserAffinityConditions";
import EventPropertyConditions from "./EventPropertyConditions";

const MOCK_SEGMENTS = [
  "Top 10% buyers (90d)",
  "Lapsed VIPs (60d+)",
  "Cart abandoners (24h)",
  "First-time buyers (30d)",
  "Newsletter subscribers",
];

function emptyBlock(type = "property") {
  return {
    id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    type,
    combinator: "AND",
    conditions: [],
    segments: [],
  };
}

export default function AudienceFilterBuilder({
  blockSet,
  onChange,
  testIdPrefix,
  blockTypes,
}) {
  const blocks = blockSet.blocks?.length
    ? blockSet.blocks
    : [emptyBlock(blockTypes[0]?.id || "property")];
  const blocksCombinator = blockSet.blocksCombinator || "AND";

  const updateBlock = (id, updates) =>
    onChange({
      ...blockSet,
      blocks: blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    });

  const removeBlock = (id) =>
    onChange({ ...blockSet, blocks: blocks.filter((b) => b.id !== id) });

  const addBlock = (type) =>
    onChange({ ...blockSet, blocks: [...blocks, emptyBlock(type)] });

  const setCombinator = (v) =>
    onChange({ ...blockSet, blocksCombinator: v });

  return (
    <div className="space-y-1">
      {blocks.map((block, idx) => (
        <React.Fragment key={block.id}>
          {idx > 0 && (
            <div className="py-1">
              <CombinatorPill
                value={blocksCombinator}
                onChange={setCombinator}
                testId={`${testIdPrefix}-blocks-combinator`}
              />
            </div>
          )}
          <ConditionBlock
            block={block}
            onUpdate={(updates) => updateBlock(block.id, updates)}
            onRemove={blocks.length > 1 ? () => removeBlock(block.id) : null}
            testIdPrefix={`${testIdPrefix}-block-${idx}`}
            blockTypes={blockTypes}
          />
        </React.Fragment>
      ))}
      <div className="pt-2">
        <AddBlockMenu
          onAdd={addBlock}
          testIdPrefix={testIdPrefix}
          blockTypes={blockTypes}
        />
      </div>
    </div>
  );
}

function ConditionBlock({ block, onUpdate, onRemove, testIdPrefix, blockTypes }) {
  const handleTypeChange = (newType) => {
    onUpdate({ type: newType, conditions: [], segments: [], combinator: "AND" });
  };

  return (
    <div className="border border-border rounded-lg bg-surface">
      <div className="flex items-end bg-slate-50 border-b border-border pl-1">
        <div className="flex-1 overflow-x-auto">
          <BlockTypePicker
            value={block.type}
            onChange={handleTypeChange}
            blockTypes={blockTypes}
          />
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex-shrink-0 mb-1 mr-1 p-1 text-text-muted hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
            aria-label="Remove block"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="p-3">
        {block.type === "property" && (
          <UserPropertyConditions
            block={{ conditions: block.conditions || [], combinator: block.combinator || "AND" }}
            onChange={(b) => onUpdate({ conditions: b.conditions, combinator: b.combinator })}
            testIdPrefix={`${testIdPrefix}-property`}
          />
        )}
        {block.type === "behavior" && (
          <UserBehaviorConditions
            block={{ conditions: block.conditions || [], combinator: block.combinator || "AND" }}
            onChange={(b) => onUpdate({ conditions: b.conditions, combinator: b.combinator })}
            testIdPrefix={`${testIdPrefix}-behavior`}
          />
        )}
        {block.type === "affinity" && (
          <UserAffinityConditions
            block={{ conditions: block.conditions || [], combinator: block.combinator || "AND" }}
            onChange={(b) => onUpdate({ conditions: b.conditions, combinator: b.combinator })}
            testIdPrefix={`${testIdPrefix}-affinity`}
          />
        )}
        {block.type === "event_property" && (
          <EventPropertyConditions
            block={{ conditions: block.conditions || [], combinator: block.combinator || "AND" }}
            onChange={(b) => onUpdate({ conditions: b.conditions, combinator: b.combinator })}
            testIdPrefix={`${testIdPrefix}-event-property`}
          />
        )}
        {block.type === "segment" && (
          <SegmentList
            block={{ segments: block.segments || [] }}
            onChange={(b) => onUpdate({ segments: b.segments })}
            testIdPrefix={`${testIdPrefix}-segment`}
          />
        )}
      </div>
    </div>
  );
}

function BlockTypePicker({ value, onChange, blockTypes }) {
  return (
    <div className="flex">
      {blockTypes.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`px-3 py-2 text-[12px] font-medium whitespace-nowrap transition-colors border-b-2 ${
            t.id === value
              ? "text-primary border-primary"
              : "text-text-muted border-transparent hover:text-text-primary"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function AddBlockMenu({ onAdd, testIdPrefix, blockTypes }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        data-testid={`${testIdPrefix}-add-block`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover"
      >
        <Plus className="w-3.5 h-3.5" />
        Add condition block
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-1 z-20 bg-white border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
            {blockTypes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onAdd(t.id);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-primary-tint hover:text-primary transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SegmentList({ block, onChange, testIdPrefix }) {
  const segments = block.segments || [];

  React.useEffect(() => {
    if (segments.length === 0) {
      onChange({ ...block, segments: [""] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      {segments.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            value={s}
            onChange={(e) =>
              onChange({
                ...block,
                segments: segments.map((x, idx) =>
                  idx === i ? e.target.value : x,
                ),
              })
            }
            data-testid={`${testIdPrefix}-${i}`}
            className="h-9 text-sm flex-1 rounded-md border border-border bg-surface px-2"
          >
            <option value="">Select a segment</option>
            {MOCK_SEGMENTS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {segments.length > 1 && (
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...block,
                  segments: segments.filter((_, idx) => idx !== i),
                })
              }
              className="p-1.5 text-text-muted hover:text-rose-600 rounded-md"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange({ ...block, segments: [...segments, ""] })}
        data-testid={`${testIdPrefix}-add`}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
      >
        <Plus className="w-3.5 h-3.5" />
        Add segment (OR)
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit (EventPropertyConditions doesn't exist yet — that's fine, it will be added in Task 4)**

```bash
git add src/components/flows/builder/trigger/audience/AudienceFilterBuilder.jsx
git commit -m "feat: create shared AudienceFilterBuilder component

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Update Step2WhoContent.jsx to use AudienceFilterBuilder

**Files:**
- Modify: `src/components/flows/builder/trigger/Step2WhoContent.jsx`

**Interfaces:**
- Consumes: `AudienceFilterBuilder` from `./audience/AudienceFilterBuilder`

- [ ] **Step 1: Add import and TRIGGER_BLOCK_TYPES constant**

At the top of `src/components/flows/builder/trigger/Step2WhoContent.jsx`, add the import alongside existing imports:

```jsx
import AudienceFilterBuilder from "./audience/AudienceFilterBuilder";
```

Then add this constant at module scope (before the component, alongside where `BLOCK_TYPES` was defined):

```js
const TRIGGER_BLOCK_TYPES = [
  { id: "property", label: "User property" },
  { id: "behavior", label: "User behavior" },
  { id: "affinity", label: "User affinity" },
  { id: "segment",  label: "Custom segment" },
];
```

- [ ] **Step 2: Replace ConditionBlockList calls with AudienceFilterBuilder**

In `Step2WhoContent.jsx`, find both places where `<ConditionBlockList` is rendered (the include block and the exclude block) and replace each with `<AudienceFilterBuilder` with the same props plus `blockTypes={TRIGGER_BLOCK_TYPES}`:

```jsx
// Include block — replace:
<ConditionBlockList
  blockSet={audience.include || { blocks: [emptyConditionBlock("property")], blocksCombinator: "AND" }}
  onChange={(b) => setAudience({ ...audience, include: b })}
  testIdPrefix="audience-include"
/>

// With:
<AudienceFilterBuilder
  blockSet={audience.include || { blocks: [emptyConditionBlock("property")], blocksCombinator: "AND" }}
  onChange={(b) => setAudience({ ...audience, include: b })}
  testIdPrefix="audience-include"
  blockTypes={TRIGGER_BLOCK_TYPES}
/>
```

```jsx
// Exclude block — replace:
<ConditionBlockList
  blockSet={audience.exclude || { blocks: [emptyConditionBlock("behavior")], blocksCombinator: "AND" }}
  onChange={(b) => setAudience({ ...audience, exclude: b })}
  testIdPrefix="audience-exclude"
/>

// With:
<AudienceFilterBuilder
  blockSet={audience.exclude || { blocks: [emptyConditionBlock("behavior")], blocksCombinator: "AND" }}
  onChange={(b) => setAudience({ ...audience, exclude: b })}
  testIdPrefix="audience-exclude"
  blockTypes={TRIGGER_BLOCK_TYPES}
/>
```

- [ ] **Step 3: Remove the inlined functions from Step2WhoContent.jsx**

Delete these function definitions from `Step2WhoContent.jsx` — they are now owned by `AudienceFilterBuilder.jsx`:
- `ConditionBlockList`
- `ConditionBlock`
- `BlockTypePicker`
- `AddBlockMenu`
- `SegmentList`
- The `BLOCK_TYPES` constant (replaced by `TRIGGER_BLOCK_TYPES` above)
- The `MOCK_SEGMENTS` array (it's been moved into `AudienceFilterBuilder.jsx`)

- [ ] **Step 4: Run dev server and verify trigger Step 2 still works**

```bash
yarn start
```

Open the flow builder, click "Add trigger", navigate to Step 2 (Who). Verify:
- "User property", "User behavior", "User affinity", "Custom segment" tabs appear in the block type strip
- "Event property" tab does NOT appear (correct — trigger doesn't have it)
- Adding conditions within each tab works the same as before

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/trigger/Step2WhoContent.jsx
git commit -m "refactor: Step2WhoContent uses shared AudienceFilterBuilder

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Create EventPropertyConditions.jsx

**Files:**
- Create: `src/components/flows/builder/trigger/audience/EventPropertyConditions.jsx`

**Interfaces:**
- Consumes: `useFlowBuilderStore` from `@/store/flowBuilderStore` — reads `nodes.find(n => n.type === "trigger")?.data?.event_name`
- Consumes: `TimeRangeRow` from `./UserBehaviorConditions` (named export)
- Consumes: `AttributeConditionRow` from `../AttributeConditionRow`
- Consumes: `FREQUENCY_OPTIONS` from `../triggerHelpers`
- Consumes: `getAttrPool` pattern from `@/data/eventCatalogue.json` + `@/components/flows/builder/triggerEventProperties`
- Produces: `default export EventPropertyConditions({ block, onChange, testIdPrefix })` — same interface as `UserBehaviorConditions`

- [ ] **Step 1: Create the file**

Create `src/components/flows/builder/trigger/audience/EventPropertyConditions.jsx`:

```jsx
import React, { useEffect, useRef } from "react";
import { Trash2, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import catalogueData from "@/data/eventCatalogue.json";
import { getPropertiesForEvent } from "@/components/flows/builder/triggerEventProperties";
import CombinatorPill from "./CombinatorPill";
import AttributeConditionRow from "../AttributeConditionRow";
import { TimeRangeRow } from "./UserBehaviorConditions";
import { FREQUENCY_OPTIONS } from "../triggerHelpers";

const EXEC_QUALIFIERS = [
  { id: "has_executed",     label: "Has Executed" },
  { id: "has_not_executed", label: "Has Not Executed" },
];

function adaptTEPAttrs(props) {
  if (!props || props === "special") return [];
  return props.map((p) => ({
    name: p.name,
    data_type:
      p.type === "Numeric"
        ? "integer"
        : p.type === "DateTime"
        ? "datetime"
        : p.type === "Boolean"
        ? "boolean"
        : "string",
    operators: Array.isArray(p.ops) ? p.ops : [],
    selection_option: p.inputType === "B" ? "picker" : null,
    is_evaluate: false,
    examples: [],
  }));
}

function getAttrPool(eventName) {
  const fromJson = catalogueData.attributes_by_event?.[eventName];
  if (fromJson && fromJson.length > 0) return fromJson;
  return adaptTEPAttrs(getPropertiesForEvent(eventName));
}

function defaultCondition(eventName) {
  return {
    qualifier: "has_executed",
    event: eventName,
    frequency: "at_least",
    count: 1,
    time_range: { op: "in_last", n: 30, unit: "days" },
    attributes: [],
    attrs_open: false,
  };
}

export default function EventPropertyConditions({
  block,
  onChange,
  testIdPrefix,
}) {
  const triggerEvent = useFlowBuilderStore(
    (s) =>
      s.nodes.find((n) => n.type === "trigger")?.data?.event_name ?? null,
  );

  const prevTriggerEventRef = useRef(triggerEvent);
  const conditions = block.conditions || [];
  const combinator = block.combinator || "AND";

  const update = (next) => onChange({ ...block, ...next });
  const setCondition = (i, c) =>
    update({ conditions: conditions.map((x, idx) => (idx === i ? c : x)) });
  const addCondition = () =>
    update({
      conditions: [...conditions, defaultCondition(triggerEvent)],
    });
  const removeCondition = (i) =>
    update({ conditions: conditions.filter((_, idx) => idx !== i) });

  // Bootstrap first condition when trigger event is available
  useEffect(() => {
    if (!triggerEvent) return;
    if (conditions.length === 0) {
      onChange({
        ...block,
        combinator: block.combinator || "AND",
        conditions: [defaultCondition(triggerEvent)],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerEvent]);

  // Reset conditions when trigger event changes
  useEffect(() => {
    const prev = prevTriggerEventRef.current;
    if (triggerEvent && prev && triggerEvent !== prev) {
      onChange({
        ...block,
        conditions: [defaultCondition(triggerEvent)],
      });
    }
    prevTriggerEventRef.current = triggerEvent;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerEvent]);

  if (!triggerEvent) {
    return (
      <div className="py-6 text-center text-[12px] text-text-muted border border-dashed border-border rounded-lg">
        Add a start trigger event to use this filter.
      </div>
    );
  }

  const attrPool = getAttrPool(triggerEvent) || [];
  const propPool = attrPool.filter((a) => !a.is_evaluate);

  return (
    <div className="space-y-4">
      {/* Locked event badge */}
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <span>Trigger event:</span>
        <span className="px-2 py-0.5 text-[12px] font-medium rounded-full bg-teal-50 text-teal-700 border border-teal-200">
          {triggerEvent}
        </span>
      </div>

      {conditions.map((c, i) => {
        const freqMeta = FREQUENCY_OPTIONS.find((f) => f.id === c.frequency);
        return (
          <React.Fragment key={i}>
            {i > 0 && (
              <CombinatorPill
                value={combinator}
                onChange={(v) => update({ combinator: v })}
                testId={`${testIdPrefix}-combinator`}
              />
            )}
            <div
              className="border border-border rounded-lg p-3 bg-surface space-y-2"
              data-testid={`${testIdPrefix}-row-${i}`}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <Select
                  value={c.qualifier}
                  onValueChange={(v) => setCondition(i, { ...c, qualifier: v })}
                >
                  <SelectTrigger className="h-9 text-sm min-w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXEC_QUALIFIERS.map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        {q.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={c.frequency}
                  onValueChange={(v) => setCondition(i, { ...c, frequency: v })}
                >
                  <SelectTrigger className="h-9 text-sm min-w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {freqMeta?.needsCount && (
                  <>
                    <input
                      type="number"
                      min={1}
                      value={c.count || 1}
                      onChange={(e) =>
                        setCondition(i, {
                          ...c,
                          count: Number(e.target.value),
                        })
                      }
                      className="w-16 px-2 py-1.5 text-sm rounded-md border border-border bg-surface"
                    />
                    <span className="text-xs text-text-muted">times</span>
                  </>
                )}

                <div className="ml-auto">
                  <button
                    type="button"
                    onClick={() => removeCondition(i)}
                    className="p-1.5 text-text-muted hover:text-rose-600 rounded-md hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <TimeRangeRow
                value={c.time_range}
                onChange={(tr) => setCondition(i, { ...c, time_range: tr })}
                testIdPrefix={`${testIdPrefix}-tr-${i}`}
              />

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setCondition(i, { ...c, attrs_open: !c.attrs_open })
                  }
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary"
                >
                  <Plus className="w-3 h-3" />
                  Attributes ({(c.attributes || []).length})
                </button>
                {c.attrs_open && (
                  <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-border">
                    {(c.attributes || []).map((a, ai) => (
                      <AttributeConditionRow
                        key={ai}
                        condition={a}
                        attributesPool={propPool}
                        onChange={(na) =>
                          setCondition(i, {
                            ...c,
                            attributes: c.attributes.map((x, idx) =>
                              idx === ai ? na : x,
                            ),
                          })
                        }
                        onRemove={() =>
                          setCondition(i, {
                            ...c,
                            attributes: c.attributes.filter(
                              (_, idx) => idx !== ai,
                            ),
                          })
                        }
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setCondition(i, {
                          ...c,
                          attributes: [
                            ...(c.attributes || []),
                            { property: "", operator: "", value: "" },
                          ],
                        })
                      }
                      className="text-[11px] text-primary hover:text-primary-hover"
                    >
                      + Add attribute filter
                    </button>
                  </div>
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}

      <button
        type="button"
        onClick={addCondition}
        data-testid={`${testIdPrefix}-add-cond`}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
      >
        <Plus className="w-3.5 h-3.5" />
        Add condition
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify the trigger Step 2 still works (no import errors from AudienceFilterBuilder)**

```bash
yarn start
```

Open trigger config → Step 2. Should load without console errors. The "Event property" tab is not shown in the trigger (trigger passes only 4 block types) — confirm it doesn't appear.

- [ ] **Step 3: Commit**

```bash
git add src/components/flows/builder/trigger/audience/EventPropertyConditions.jsx
git commit -m "feat: add EventPropertyConditions block type

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Update v1 ConditionalSplitRightPanel — FilterTab

**Files:**
- Modify: `src/components/flows/builder/nodes/ConditionalSplitNode/ConditionalSplitRightPanel.jsx`

**Interfaces:**
- Consumes: `AudienceFilterBuilder` from `@/components/flows/builder/trigger/audience/AudienceFilterBuilder`
- Consumes: `CombinatorPill` from `@/components/flows/builder/trigger/audience/CombinatorPill`
- Consumes: `newFilterGroup`, `newExpression`, `PATH_LABELS`, `EXPRESSION_OPERATORS`, `EXPRESSION_VARIABLE_GROUPS` from `./data/mockData`

- [ ] **Step 1: Replace the FilterTab section in ConditionalSplitRightPanel.jsx**

The file has many sections — only the FilterTab and its helpers change. Keep the `ABTestTab`, `ExpressionTab`, and the main `ConditionalSplitRightPanel` export completely unchanged.

**Add these imports** at the top (alongside existing imports):

```jsx
import AudienceFilterBuilder from "@/components/flows/builder/trigger/audience/AudienceFilterBuilder";
import CombinatorPill from "@/components/flows/builder/trigger/audience/CombinatorPill";
```

**Remove these imports** (no longer needed after FilterTab rewrite):

```jsx
import userAttrsData from "@/data/userAttributes.json";
import TwoPanelDropdown from "@/components/flows/builder/trigger/TwoPanelDropdown";
import CombinatorPill from "@/components/flows/builder/trigger/audience/CombinatorPill";
import { userPropertyOperators, operatorHidesValue } from "@/components/flows/builder/trigger/triggerHelpers";
```

Note: `CombinatorPill` is still needed — keep its import (it was already there, just consolidate).

**Remove these functions** from the file entirely (they are replaced by AudienceFilterBuilder):
- `buildAttrIndex()`
- `buildFlowVarIndex()`
- `buildCombinedGroups()`
- `FilterConditionRow`
- `FilterGroupCard` (will be rewritten below)

**Add the `SPLIT_BLOCK_TYPES` constant** at module scope, below the existing `MODES` array:

```jsx
const SPLIT_BLOCK_TYPES = [
  { id: "property",       label: "User property" },
  { id: "behavior",       label: "User behavior" },
  { id: "affinity",       label: "User affinity" },
  { id: "event_property", label: "Event property" },
  { id: "segment",        label: "Custom segment" },
];
```

**Replace the `FilterTab` function** with:

```jsx
function FilterTab({ data, patch }) {
  const groups = useMemo(() => data.filterGroups ?? [], [data.filterGroups]);
  const groupsCombinator = data.filterGroupsCombinator ?? "AND";

  const updateGroup = useCallback(
    (id, next) =>
      patch({ filterGroups: groups.map((g) => (g.id === id ? { ...g, ...next } : g)) }),
    [groups, patch],
  );

  const removeGroup = useCallback(
    (id) => {
      const next = groups.filter((g) => g.id !== id);
      patch({ filterGroups: next.length ? next : [newFilterGroup(0)] });
    },
    [groups, patch],
  );

  const addGroup = useCallback(() => {
    patch({ filterGroups: [...groups, newFilterGroup(groups.length)] });
  }, [groups, patch]);

  return (
    <div className="space-y-3">
      {groups.map((group, gi) => (
        <React.Fragment key={group.id}>
          {gi > 0 && (
            <div className="py-1">
              <CombinatorPill
                value={groupsCombinator}
                onChange={(v) => patch({ filterGroupsCombinator: v })}
                testId="filter-groups-combinator"
              />
            </div>
          )}
          <FilterGroupCard
            group={group}
            index={gi}
            onChange={(next) => updateGroup(group.id, next)}
            onRemove={() => removeGroup(group.id)}
            canRemove={groups.length > 1}
          />
        </React.Fragment>
      ))}

      <button
        type="button"
        onClick={addGroup}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700"
      >
        <Plus className="w-3.5 h-3.5" />
        Add branch
      </button>

      <div className="flex items-center gap-2 mt-1 p-2 bg-slate-50 rounded-md border border-border">
        <div className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
        <span className="text-[11px] text-text-secondary">
          <span className="font-medium">Else</span> — users that don't match any branch
        </span>
      </div>
    </div>
  );
}
```

**Add the new `FilterGroupCard` function** (replaces the old one):

```jsx
function FilterGroupCard({ group, index, onChange, onRemove, canRemove }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-border">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="text-text-muted"
        >
          {collapsed ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5" />
          )}
        </button>
        <input
          type="text"
          value={group.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="flex-1 min-w-0 text-sm font-medium bg-transparent focus:outline-none"
        />
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-md text-text-muted hover:text-rose-600 hover:bg-rose-50"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="p-3">
          <AudienceFilterBuilder
            blockSet={{
              blocks: group.blocks || [],
              blocksCombinator: group.blocksCombinator || "AND",
            }}
            onChange={(next) =>
              onChange({
                blocks: next.blocks,
                blocksCombinator: next.blocksCombinator,
              })
            }
            testIdPrefix={`fg-${group.id}`}
            blockTypes={SPLIT_BLOCK_TYPES}
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify existing imports at the top of the file are correct**

The file should now import:
```jsx
import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Trash2, Plus, ChevronDown, ChevronUp, X } from "lucide-react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import {
  EXPRESSION_VARIABLE_GROUPS,
  EXPRESSION_OPERATORS,
  PATH_LABELS,
  newFilterGroup,
  newExpression,
} from "./data/mockData";
import AudienceFilterBuilder from "@/components/flows/builder/trigger/audience/AudienceFilterBuilder";
import CombinatorPill from "@/components/flows/builder/trigger/audience/CombinatorPill";
import TwoPanelDropdown from "@/components/flows/builder/trigger/TwoPanelDropdown";
```

Note: `TwoPanelDropdown` is still needed by `ExpressionTab` — keep it. Remove `userAttrsData`, `userPropertyOperators`, `operatorHidesValue`.

- [ ] **Step 3: Run dev server and verify the Filter tab in v1**

```bash
yarn start
```

Open the v1 flow builder. Drag a Conditional Split node onto the canvas. Click it to open the right panel. Select "Filter" mode. Verify:
- Branch 1 card appears with collapse toggle and label input
- Inside the branch: five tab types show in the strip (User property, User behavior, User affinity, Event property, Custom segment)
- "User property" tab works — can select attributes and operators
- "User behavior" tab works — shows event picker, frequency, time range
- "User affinity" tab works — shows affinity type, event picker
- "Event property" tab: if no trigger node on canvas, shows "Add a start trigger event to use this filter." placeholder; if a trigger node exists with event set, shows event badge and condition rows
- "Custom segment" tab shows segment dropdown
- "Add condition block" dropdown opens with 5 options
- "Add branch" adds another FilterGroupCard
- AND/OR combinator appears between branches when 2+ exist
- Else pill shows at bottom

- [ ] **Step 4: Commit**

```bash
git add src/components/flows/builder/nodes/ConditionalSplitNode/ConditionalSplitRightPanel.jsx
git commit -m "feat: upgrade conditional split filter tab to block-based audience filter

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Create v2 ConditionalSplitNode

**Files:**
- Create: `app/frontend/src/components/flows/builder/nodes/ConditionalSplitNode/index.jsx`
- Create: `app/frontend/src/components/flows/builder/nodes/ConditionalSplitNode/ConditionalSplitRightPanel.jsx`
- Create: `app/frontend/src/components/flows/builder/nodes/ConditionalSplitNode/data/mockData.js`

**Interfaces:**
- Consumes: `useFlowBuilderStore` from `@/store/flowBuilderStore` (same store, shared via `@/` alias)
- Consumes: `AudienceFilterBuilder` from `@/components/flows/builder/trigger/audience/AudienceFilterBuilder` (v1 path, shared)
- Consumes: `EventPropertyConditions` from `@/components/flows/builder/trigger/audience/EventPropertyConditions` (v1 path, shared)
- Produces: `default export ConditionalSplitNode` (canvas renderer) + `default export ConditionalSplitRightPanel`

- [ ] **Step 1: Create the data directory and mockData.js**

```bash
mkdir -p app/frontend/src/components/flows/builder/nodes/ConditionalSplitNode/data
```

Create `app/frontend/src/components/flows/builder/nodes/ConditionalSplitNode/data/mockData.js` with the exact same content as the updated v1 `src/components/flows/builder/nodes/ConditionalSplitNode/data/mockData.js` from Task 1.

- [ ] **Step 2: Create index.jsx — canvas node renderer**

Create `app/frontend/src/components/flows/builder/nodes/ConditionalSplitNode/index.jsx`:

```jsx
import React from "react";
import { Handle, Position } from "reactflow";
import { GitFork } from "lucide-react";

const TEAL = "#0D9488";
const BORDER = "#E5E7EB";

function PortRow({ portId, label, color, wired }) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 6,
        padding: "3px 16px 3px 12px",
        minHeight: 24,
      }}
    >
      <span
        style={{
          fontSize: 10,
          color: "#475569",
          whiteSpace: "nowrap",
          maxWidth: 180,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </span>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          flexShrink: 0,
          border: `2px solid ${wired ? color : "#CBD5E1"}`,
          background: wired ? color : "transparent",
          transition: "all 0.15s",
        }}
      />
      <Handle
        id={portId}
        type="source"
        position={Position.Right}
        style={{
          position: "absolute",
          right: -4,
          top: "50%",
          transform: "translateY(-50%)",
          width: 10,
          height: 10,
          background: "transparent",
          border: "none",
        }}
      />
    </div>
  );
}

export default function ConditionalSplitNode({ id, data, selected }) {
  const mode = data?.mode ?? null;
  const wiredPorts = data?.wiredPorts ?? [];

  const ports = [];
  if (mode === "filter") {
    const groups = data?.filterGroups ?? [];
    groups.forEach((g, i) => {
      ports.push({ id: g.id, label: g.label || `Branch ${i + 1}`, color: TEAL });
    });
    ports.push({ id: "else", label: "Else", color: "#94A3B8" });
  } else if (mode === "ab") {
    const paths = data?.abPaths ?? [];
    paths.forEach((p) => {
      ports.push({ id: p.id, label: `${p.label}: ${p.percentage}%`, color: TEAL });
    });
  } else if (mode === "expression") {
    const exprs = data?.expressions ?? [];
    exprs.forEach((e, i) => {
      const raw = e.rawText?.trim() || e.variable || `Expression ${i + 1}`;
      ports.push({
        id: e.id,
        label: raw.length > 22 ? raw.slice(0, 20) + "…" : raw,
        color: TEAL,
      });
    });
    ports.push({ id: "false", label: "False", color: "#EF4444" });
  }

  const modeLabel = { filter: "Filter", ab: "A/B Test", expression: "Expression" }[mode] ?? null;
  const isEmpty = !mode;

  return (
    <div
      data-testid={`rf-conditionalsplit-node-${id}`}
      style={{
        background: "#fff",
        border: `${selected ? "2px" : "1.5px"} ${isEmpty ? "dashed" : "solid"} ${isEmpty ? "rgba(13,148,136,0.4)" : TEAL}`,
        borderRadius: 12,
        boxShadow: selected
          ? "0 0 0 3px rgba(13,148,136,0.15)"
          : "0 1px 6px rgba(0,0,0,0.07)",
        width: 260,
        position: "relative",
        overflow: "visible",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: TEAL, width: 10, height: 10, top: -5 }}
      />

      {isEmpty ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px 16px",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: TEAL,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GitFork size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>
            Conditional Split
          </span>
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>Click to configure</span>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px" }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: TEAL,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <GitFork size={13} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: TEAL,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Conditional Split
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#0F172A",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {data?.label || "Conditional Split"}
              </div>
            </div>
            {modeLabel && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  padding: "2px 7px",
                  borderRadius: 10,
                  background: "#CCFBF1",
                  color: TEAL,
                  flexShrink: 0,
                }}
              >
                {modeLabel}
              </span>
            )}
          </div>

          {ports.length > 0 && (
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 2, paddingBottom: 4 }}>
              {ports.map((p) => (
                <PortRow
                  key={p.id}
                  portId={p.id}
                  label={p.label}
                  color={p.color}
                  wired={wiredPorts.includes(p.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create ConditionalSplitRightPanel.jsx for v2**

Create `app/frontend/src/components/flows/builder/nodes/ConditionalSplitNode/ConditionalSplitRightPanel.jsx`.

This file is functionally identical to v1's `ConditionalSplitRightPanel.jsx` after Task 5's edits. Copy the full updated v1 file content verbatim. The only difference: v2's right panel receives `node`, `updateNodeData`, and `removeNode` as props (matching the webhook pattern in `ConfigTab.jsx`) rather than pulling from the store itself.

Modify the main export signature and the internal `patch` / `node` / `data` derivation:

```jsx
// Replace the store-connected export at the bottom with a prop-driven version:
export default function ConditionalSplitRightPanel({ node, updateNodeData, removeNode }) {
  const data = node?.data ?? {};

  const patch = useCallback(
    (p) => {
      if (!node) return;
      updateNodeData(node.id, p);
    },
    [node, updateNodeData],
  );

  if (!node) return null;

  // ... rest of JSX identical to v1 (header, mode selector, tab content)
}
```

Remove the `useFlowBuilderStore` calls for `selectedNodeId`, `nodes`, `updateNodeData`, `removeNode` — those come from props instead. Keep `useFlowBuilderStore` only inside `EventPropertyConditions` (which handles its own store subscription internally).

- [ ] **Step 4: Commit**

```bash
git add app/frontend/src/components/flows/builder/nodes/ConditionalSplitNode/
git commit -m "feat: create v2 ConditionalSplitNode — canvas and right panel

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Wire v2 — Canvas, ConfigTab, LogicNode

**Files:**
- Modify: `app/frontend/src/components/flows/builder/Canvas.jsx`
- Modify: `app/frontend/src/components/flows/builder/panels/ConfigTab.jsx`
- Modify: `app/frontend/src/components/flows/builder/nodes/LogicNode.jsx`

**Interfaces:**
- Consumes: `ConditionalSplitNode` from `./nodes/ConditionalSplitNode` (canvas renderer)
- Consumes: `ConditionalSplitRightPanel` from `./nodes/ConditionalSplitNode/ConditionalSplitRightPanel`

- [ ] **Step 1: Update Canvas.jsx nodeTypes**

In `app/frontend/src/components/flows/builder/Canvas.jsx`, add the import at the top:

```jsx
import ConditionalSplitNode from "./nodes/ConditionalSplitNode";
```

Find the `nodeTypes` object and change `condition: LogicNode` to `condition: ConditionalSplitNode`:

```js
const nodeTypes = {
  trigger: TriggerNode,
  channel: ChannelNode,
  wait: LogicNode,
  condition: ConditionalSplitNode,   // was: LogicNode
  split: LogicNode,
  wait_until: LogicNode,
  end: ExitNode,
  goal: ExitNode,
  generic: GenericNode,
  webhook: WebhookNode,
};
```

- [ ] **Step 2: Update ConfigTab.jsx to route condition nodes**

In `app/frontend/src/components/flows/builder/panels/ConfigTab.jsx`, add the import:

```jsx
import ConditionalSplitRightPanel from "@/components/flows/builder/nodes/ConditionalSplitNode/ConditionalSplitRightPanel";
```

Wait — this import path would be wrong since the v2 ConditionalSplitNode is in `app/frontend/src/`. Use a relative import instead:

```jsx
import ConditionalSplitRightPanel from "../nodes/ConditionalSplitNode/ConditionalSplitRightPanel";
```

Inside `ConfigTab`, find where `node?.type === "webhook"` is checked and add the condition node check immediately after:

```jsx
// existing webhook check
if (node?.type === "webhook") {
  return (
    <div className="absolute inset-0 overflow-hidden flex flex-col" data-testid="right-config-tab">
      <WebhookRightPanel
        node={node}
        updateNodeData={updateNodeData}
        removeNode={removeNode}
      />
    </div>
  );
}

// ADD THIS:
if (node?.type === "condition") {
  return (
    <div className="absolute inset-0 overflow-hidden flex flex-col" data-testid="right-config-tab">
      <ConditionalSplitRightPanel
        node={node}
        updateNodeData={updateNodeData}
        removeNode={removeNode}
      />
    </div>
  );
}
```

- [ ] **Step 3: Remove condition from LogicNode.jsx KIND_META**

In `app/frontend/src/components/flows/builder/nodes/LogicNode.jsx`, remove the `condition` entry from `KIND_META`:

```js
// Before:
const KIND_META = {
  wait:       { Icon: Clock,              label: "Wait",       color: "#64748B" },
  condition:  { Icon: GitFork,            label: "Condition",  color: "#F59E0B" },
  split:      { Icon: SplitSquareVertical,label: "A/B Split",  color: "#8B5CF6" },
  wait_until: { Icon: TimerReset,         label: "Wait until", color: "#64748B" },
};

// After:
const KIND_META = {
  wait:       { Icon: Clock,              label: "Wait",       color: "#64748B" },
  split:      { Icon: SplitSquareVertical,label: "A/B Split",  color: "#8B5CF6" },
  wait_until: { Icon: TimerReset,         label: "Wait until", color: "#64748B" },
};
```

Also remove `GitFork` from the LogicNode import if it was only used for `condition`:

```jsx
// Check if GitFork is still needed — if not, remove it:
import { Clock, SplitSquareVertical, TimerReset } from "lucide-react";
```

- [ ] **Step 4: Run dev server and verify v2**

```bash
yarn start
```

Navigate to the v2 flow builder. Drag a condition node onto the canvas. Verify:
- The canvas node shows the new ConditionalSplitNode renderer (dashed border, GitFork icon, "Click to configure") — not the old LogicNode amber box
- Clicking it opens the full ConditionalSplitRightPanel with Filter / A/B Test / Expression tabs
- Filter tab shows the same block-based UI as verified in Task 5
- A/B Test and Expression tabs work as before

- [ ] **Step 5: Verify v2 trigger Step 2 still works**

In v2, open the trigger configuration. Step 2 should show the 4-type block strip (no "Event property") — same as v1 trigger.

- [ ] **Step 6: Commit**

```bash
git add app/frontend/src/components/flows/builder/Canvas.jsx
git add app/frontend/src/components/flows/builder/panels/ConfigTab.jsx
git add app/frontend/src/components/flows/builder/nodes/LogicNode.jsx
git commit -m "feat: wire v2 condition node to ConditionalSplitNode renderer

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Self-Review Checklist (completed)

**Spec coverage:**
- ✅ `AudienceFilterBuilder` extracted from `Step2WhoContent` — Task 2 + 3
- ✅ `EventPropertyConditions` new component — Task 4
- ✅ Five block types in conditional split filter — Task 5 (SPLIT_BLOCK_TYPES)
- ✅ Four block types in trigger (no event_property) — Task 3 (TRIGGER_BLOCK_TYPES)
- ✅ Trigger event read from store via `nodes.find(n => n.type === "trigger")` — Task 4
- ✅ No-trigger-event placeholder — Task 4
- ✅ Auto-reset on trigger event change — Task 4
- ✅ AND/OR combinator between branches — Task 5 (`filterGroupsCombinator`)
- ✅ AND/OR combinator between blocks within branch — `AudienceFilterBuilder` Task 2
- ✅ Else pill at bottom — Task 5 FilterTab
- ✅ `newBlock()` factory — Task 1
- ✅ Updated `newFilterGroup()` — Task 1
- ✅ Updated `defaultConditionalSplitData` — Task 1
- ✅ v2 canvas node renderer — Task 6
- ✅ v2 full right panel — Task 6
- ✅ v2 ConfigTab routing — Task 7
- ✅ v2 LogicNode cleanup — Task 7
- ✅ v2 Canvas nodeTypes update — Task 7
