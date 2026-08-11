# Conditional Event Property Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the Conditional Split node's "Event property" filter block so it shows the locked start-trigger event plus a flat AND/OR list of attribute conditions only — removing the Has Executed/Has Not Executed qualifier, frequency ("at least N times"), and time-window ("in the last X days") UI.

**Architecture:** `EventPropertyConditions.jsx` currently duplicates the qualifier/frequency/time-range UI from `UserBehaviorConditions.jsx`, wrapping a nested attributes sub-list. We rewrite it (in both the v1 `trigger/audience/` and v2 `triggerV2/audience/` copies) to instead follow the flatter pattern already used by `UserPropertyConditions.jsx`: one `conditions` array of `{ property, operator, value }` rows, combined directly with `CombinatorPill`, rendered with the existing `AttributeConditionRow` component. The locked trigger-event badge, empty-state placeholder, and reset-on-trigger-change behavior are all preserved unchanged. `filterSummary.js`'s `event_property` summarizer is updated to describe attribute conditions instead of frequency/time-window text.

**Tech Stack:** React, Zustand (`useFlowBuilderStore`), Jest + React Testing Library (`craco test`).

## Global Constraints

- Per `CLAUDE.md`: `trigger/` (v1) and `triggerV2/` (v2) are already-forked copies for the Start Trigger wizard split, so each copy is edited independently — no `FlowVariantContext` needed here since this isn't a v1/v2 behavioral toggle, it's the same change applied to both forks.
- After all changes, run both lockdown suites: `npx craco test --testPathPattern="FlowBuilder.lockdown|FlowBuilderV2.lockdown" --watchAll=false`.
- No data migration for old saved `frequency`/`time_range`/`qualifier` fields — components simply stop reading/writing them (per the approved spec).
- No changes to `UserBehaviorConditions.jsx`, `UserAffinityConditions.jsx`, or `AttributesSubList.jsx` — they remain used by other block types.

---

### Task 1: Simplify v1 `EventPropertyConditions.jsx` and add tests

**Files:**
- Modify: `src/components/flows/builder/trigger/audience/EventPropertyConditions.jsx`
- Test: `src/components/flows/builder/trigger/audience/__tests__/EventPropertyConditions.test.jsx` (new)

**Interfaces:**
- Consumes: `useFlowBuilderStore` (`@/store/flowBuilderStore`), `CombinatorPill` (`./CombinatorPill`, props `{ value, onChange, testId }`), `AttributeConditionRow` (`../AttributeConditionRow`, props `{ condition, attributesPool, onChange, onRemove, testId }`), `getPropertiesForEvent` (`@/components/flows/builder/triggerEventProperties`), `catalogueData` (`@/data/eventCatalogue.json`).
- Produces: `EventPropertyConditions({ block, onChange, testIdPrefix })` — a default export React component. `block` shape: `{ combinator: "AND"|"OR", conditions: Array<{ event, property, operator, value }> }`. Calls `onChange(nextBlock)` with the same shape. This is consumed by `AudienceFilterBuilder.jsx`'s `ConditionBlock` switch (unchanged call site — no signature change).

- [ ] **Step 1: Write the failing tests**

Create `src/components/flows/builder/trigger/audience/__tests__/EventPropertyConditions.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import EventPropertyConditions from "../EventPropertyConditions";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";

function setTriggerEvent(eventName) {
  useFlowBuilderStore.setState({
    nodes: eventName
      ? [{ id: "start", type: "trigger", data: { event_name: eventName } }]
      : [],
  });
}

describe("EventPropertyConditions", () => {
  afterEach(() => {
    useFlowBuilderStore.setState({ nodes: [] });
  });

  it("shows the placeholder when there is no trigger event", () => {
    setTriggerEvent(null);
    render(
      <EventPropertyConditions
        block={{ combinator: "AND", conditions: [] }}
        onChange={() => {}}
        testIdPrefix="ep"
      />,
    );
    expect(
      screen.getByText("Add a start trigger event to use this filter."),
    ).toBeInTheDocument();
  });

  it("shows the locked trigger event badge, not an event picker", () => {
    setTriggerEvent("Product Viewed");
    render(
      <EventPropertyConditions
        block={{ combinator: "AND", conditions: [{ property: "", operator: "", value: "" }] }}
        onChange={() => {}}
        testIdPrefix="ep"
      />,
    );
    expect(screen.getByText("Trigger event:")).toBeInTheDocument();
    expect(screen.getByText("Product Viewed")).toBeInTheDocument();
  });

  it("does not render qualifier, frequency, or time-window controls", () => {
    setTriggerEvent("Product Viewed");
    render(
      <EventPropertyConditions
        block={{ combinator: "AND", conditions: [{ property: "", operator: "", value: "" }] }}
        onChange={() => {}}
        testIdPrefix="ep"
      />,
    );
    expect(screen.queryByText("Has Executed")).not.toBeInTheDocument();
    expect(screen.queryByText("Has Not Executed")).not.toBeInTheDocument();
    expect(screen.queryByText(/times$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/in the last/i)).not.toBeInTheDocument();
  });

  it("renders one AttributeConditionRow per condition with an AND/OR pill between two or more", () => {
    setTriggerEvent("Product Viewed");
    render(
      <EventPropertyConditions
        block={{
          combinator: "OR",
          conditions: [
            { property: "", operator: "", value: "" },
            { property: "", operator: "", value: "" },
          ],
        }}
        onChange={() => {}}
        testIdPrefix="ep"
      />,
    );
    expect(screen.getByTestId("ep-row-0")).toBeInTheDocument();
    expect(screen.getByTestId("ep-row-1")).toBeInTheDocument();
    expect(screen.getByTestId("ep-combinator")).toHaveTextContent("OR");
  });

  it("adds a new flat condition (no qualifier/frequency/time_range fields) on Add condition", () => {
    setTriggerEvent("Product Viewed");
    const onChange = jest.fn();
    render(
      <EventPropertyConditions
        block={{ combinator: "AND", conditions: [{ property: "", operator: "", value: "" }] }}
        onChange={onChange}
        testIdPrefix="ep"
      />,
    );
    fireEvent.click(screen.getByTestId("ep-add-cond"));
    const nextBlock = onChange.mock.calls[0][0];
    expect(nextBlock.conditions).toHaveLength(2);
    expect(nextBlock.conditions[1]).toEqual(
      expect.objectContaining({ property: "", operator: "", value: "" }),
    );
    expect(nextBlock.conditions[1]).not.toHaveProperty("qualifier");
    expect(nextBlock.conditions[1]).not.toHaveProperty("frequency");
    expect(nextBlock.conditions[1]).not.toHaveProperty("time_range");
  });

  it("resets conditions to a single flat empty condition when the trigger event changes", () => {
    setTriggerEvent("Product Viewed");
    const onChange = jest.fn();
    const { rerender } = render(
      <EventPropertyConditions
        block={{
          combinator: "AND",
          conditions: [{ property: "Product Price", operator: ">", value: "100" }],
        }}
        onChange={onChange}
        testIdPrefix="ep"
      />,
    );
    setTriggerEvent("Cart Abandoned");
    rerender(
      <EventPropertyConditions
        block={{
          combinator: "AND",
          conditions: [{ property: "Product Price", operator: ">", value: "100" }],
        }}
        onChange={onChange}
        testIdPrefix="ep"
      />,
    );
    const resetCall = onChange.mock.calls.find(
      (call) => call[0].conditions?.[0]?.property === "",
    );
    expect(resetCall).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx craco test --testPathPattern="trigger/audience/__tests__/EventPropertyConditions.test.jsx" --watchAll=false`
Expected: FAIL — current component still renders qualifier/frequency/time-window UI, and `defaultCondition()` still includes those fields, so several assertions fail.

- [ ] **Step 3: Rewrite the component**

Replace the full contents of `src/components/flows/builder/trigger/audience/EventPropertyConditions.jsx` with:

```jsx
import React, { useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import catalogueData from "@/data/eventCatalogue.json";
import { getPropertiesForEvent } from "@/components/flows/builder/triggerEventProperties";
import CombinatorPill from "./CombinatorPill";
import AttributeConditionRow from "../AttributeConditionRow";

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
  return { event: eventName, property: "", operator: "", value: "" };
}

export default function EventPropertyConditions({
  block,
  onChange,
  testIdPrefix,
}) {
  const triggerEvent = useFlowBuilderStore((s) => {
    const node = s.nodes.find(
      (n) =>
        n.type === "trigger" ||
        n.type === "startTrigger" ||
        n.type === "start-trigger" ||
        n.id === "start",
    );
    if (!node) return null;
    return (
      node.data?.event_name ||
      node.data?.groups?.[0]?.event ||
      node.data?.config?.triggerGroups?.[0]?.event ||
      null
    );
  });

  const prevTriggerEventRef = useRef(triggerEvent);
  const conditions = block.conditions || [];
  const combinator = block.combinator || "AND";

  const update = (next) => onChange({ ...block, ...next });
  const setCondition = (i, c) =>
    update({ conditions: conditions.map((x, idx) => (idx === i ? c : x)) });
  const addCondition = () =>
    update({ conditions: [...conditions, defaultCondition(triggerEvent)] });
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
    <div className="space-y-3">
      {/* Locked event badge */}
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <span>Trigger event:</span>
        <span className="px-2 py-0.5 text-[12px] font-medium rounded-full bg-teal-50 text-teal-700 border border-teal-200">
          {triggerEvent}
        </span>
      </div>

      {conditions.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <CombinatorPill
              value={combinator}
              onChange={(v) => update({ combinator: v })}
              testId={`${testIdPrefix}-combinator`}
            />
          )}
          <AttributeConditionRow
            condition={c}
            attributesPool={propPool}
            onChange={(nc) => setCondition(i, { ...nc, event: triggerEvent })}
            onRemove={() => removeCondition(i)}
            testId={`${testIdPrefix}-row-${i}`}
          />
        </React.Fragment>
      ))}

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

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx craco test --testPathPattern="trigger/audience/__tests__/EventPropertyConditions.test.jsx" --watchAll=false`
Expected: PASS (all 6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/trigger/audience/EventPropertyConditions.jsx src/components/flows/builder/trigger/audience/__tests__/EventPropertyConditions.test.jsx
git commit -m "$(cat <<'EOF'
refactor: simplify v1 Event Property filter to flat attribute conditions

Removes the Has Executed/frequency/time-window UI from the Conditional
Split node's Event property block, leaving the locked trigger event
badge plus a flat AND/OR list of attribute conditions.
EOF
)"
```

---

### Task 2: Simplify v2 `EventPropertyConditions.jsx` and add tests

**Files:**
- Modify: `src/components/flows/builder/triggerV2/audience/EventPropertyConditions.jsx`
- Test: `src/components/flows/builder/triggerV2/audience/__tests__/EventPropertyConditions.test.jsx` (new)

**Interfaces:**
- Consumes: same as Task 1 but from the `triggerV2` fork: `CombinatorPill` (`./CombinatorPill`), `AttributeConditionRow` (`../AttributeConditionRow`), `getPropertiesForEvent` (same shared path `@/components/flows/builder/triggerEventProperties`), `catalogueData` (`@/data/eventCatalogue.json`).
- Produces: identical component signature to Task 1's `EventPropertyConditions`, consumed by the v2 `AudienceFilterBuilder.jsx`'s `ConditionBlock` switch (unchanged call site).

- [ ] **Step 1: Write the failing tests**

Create `src/components/flows/builder/triggerV2/audience/__tests__/EventPropertyConditions.test.jsx` with the same content as Task 1's test file, but importing `EventPropertyConditions` from `../EventPropertyConditions` under the `triggerV2` path (the import statement `from "@/store/flowBuilderStore"` stays the same — v1 and v2 share the same store):

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import EventPropertyConditions from "../EventPropertyConditions";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";

function setTriggerEvent(eventName) {
  useFlowBuilderStore.setState({
    nodes: eventName
      ? [{ id: "start", type: "trigger", data: { event_name: eventName } }]
      : [],
  });
}

describe("EventPropertyConditions (v2)", () => {
  afterEach(() => {
    useFlowBuilderStore.setState({ nodes: [] });
  });

  it("shows the placeholder when there is no trigger event", () => {
    setTriggerEvent(null);
    render(
      <EventPropertyConditions
        block={{ combinator: "AND", conditions: [] }}
        onChange={() => {}}
        testIdPrefix="ep"
      />,
    );
    expect(
      screen.getByText("Add a start trigger event to use this filter."),
    ).toBeInTheDocument();
  });

  it("shows the locked trigger event badge, not an event picker", () => {
    setTriggerEvent("Product Viewed");
    render(
      <EventPropertyConditions
        block={{ combinator: "AND", conditions: [{ property: "", operator: "", value: "" }] }}
        onChange={() => {}}
        testIdPrefix="ep"
      />,
    );
    expect(screen.getByText("Trigger event:")).toBeInTheDocument();
    expect(screen.getByText("Product Viewed")).toBeInTheDocument();
  });

  it("does not render qualifier, frequency, or time-window controls", () => {
    setTriggerEvent("Product Viewed");
    render(
      <EventPropertyConditions
        block={{ combinator: "AND", conditions: [{ property: "", operator: "", value: "" }] }}
        onChange={() => {}}
        testIdPrefix="ep"
      />,
    );
    expect(screen.queryByText("Has Executed")).not.toBeInTheDocument();
    expect(screen.queryByText("Has Not Executed")).not.toBeInTheDocument();
    expect(screen.queryByText(/times$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/in the last/i)).not.toBeInTheDocument();
  });

  it("renders one AttributeConditionRow per condition with an AND/OR pill between two or more", () => {
    setTriggerEvent("Product Viewed");
    render(
      <EventPropertyConditions
        block={{
          combinator: "OR",
          conditions: [
            { property: "", operator: "", value: "" },
            { property: "", operator: "", value: "" },
          ],
        }}
        onChange={() => {}}
        testIdPrefix="ep"
      />,
    );
    expect(screen.getByTestId("ep-row-0")).toBeInTheDocument();
    expect(screen.getByTestId("ep-row-1")).toBeInTheDocument();
    expect(screen.getByTestId("ep-combinator")).toHaveTextContent("OR");
  });

  it("adds a new flat condition (no qualifier/frequency/time_range fields) on Add condition", () => {
    setTriggerEvent("Product Viewed");
    const onChange = jest.fn();
    render(
      <EventPropertyConditions
        block={{ combinator: "AND", conditions: [{ property: "", operator: "", value: "" }] }}
        onChange={onChange}
        testIdPrefix="ep"
      />,
    );
    fireEvent.click(screen.getByTestId("ep-add-cond"));
    const nextBlock = onChange.mock.calls[0][0];
    expect(nextBlock.conditions).toHaveLength(2);
    expect(nextBlock.conditions[1]).toEqual(
      expect.objectContaining({ property: "", operator: "", value: "" }),
    );
    expect(nextBlock.conditions[1]).not.toHaveProperty("qualifier");
    expect(nextBlock.conditions[1]).not.toHaveProperty("frequency");
    expect(nextBlock.conditions[1]).not.toHaveProperty("time_range");
  });

  it("resets conditions to a single flat empty condition when the trigger event changes", () => {
    setTriggerEvent("Product Viewed");
    const onChange = jest.fn();
    const { rerender } = render(
      <EventPropertyConditions
        block={{
          combinator: "AND",
          conditions: [{ property: "Product Price", operator: ">", value: "100" }],
        }}
        onChange={onChange}
        testIdPrefix="ep"
      />,
    );
    setTriggerEvent("Cart Abandoned");
    rerender(
      <EventPropertyConditions
        block={{
          combinator: "AND",
          conditions: [{ property: "Product Price", operator: ">", value: "100" }],
        }}
        onChange={onChange}
        testIdPrefix="ep"
      />,
    );
    const resetCall = onChange.mock.calls.find(
      (call) => call[0].conditions?.[0]?.property === "",
    );
    expect(resetCall).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx craco test --testPathPattern="triggerV2/audience/__tests__/EventPropertyConditions.test.jsx" --watchAll=false`
Expected: FAIL — current v2 component still renders qualifier/frequency/time-window UI via `AttributesSubList`.

- [ ] **Step 3: Rewrite the component**

Replace the full contents of `src/components/flows/builder/triggerV2/audience/EventPropertyConditions.jsx` with:

```jsx
import React, { useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import catalogueData from "@/data/eventCatalogue.json";
import { getPropertiesForEvent } from "@/components/flows/builder/triggerEventProperties";
import CombinatorPill from "./CombinatorPill";
import AttributeConditionRow from "../AttributeConditionRow";

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
  return { event: eventName, property: "", operator: "", value: "" };
}

export default function EventPropertyConditions({
  block,
  onChange,
  testIdPrefix,
}) {
  const triggerEvent = useFlowBuilderStore((s) => {
    const node = s.nodes.find(
      (n) =>
        n.type === "trigger" ||
        n.type === "startTrigger" ||
        n.type === "start-trigger" ||
        n.id === "start",
    );
    if (!node) return null;
    return (
      node.data?.event_name ||
      node.data?.groups?.[0]?.event ||
      node.data?.config?.triggerGroups?.[0]?.event ||
      null
    );
  });

  const prevTriggerEventRef = useRef(triggerEvent);
  const conditions = block.conditions || [];
  const combinator = block.combinator || "AND";

  const update = (next) => onChange({ ...block, ...next });
  const setCondition = (i, c) =>
    update({ conditions: conditions.map((x, idx) => (idx === i ? c : x)) });
  const addCondition = () =>
    update({ conditions: [...conditions, defaultCondition(triggerEvent)] });
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
    <div className="space-y-3">
      {/* Locked event badge */}
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <span>Trigger event:</span>
        <span className="px-2 py-0.5 text-[12px] font-medium rounded-full bg-teal-50 text-teal-700 border border-teal-200">
          {triggerEvent}
        </span>
      </div>

      {conditions.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <CombinatorPill
              value={combinator}
              onChange={(v) => update({ combinator: v })}
              testId={`${testIdPrefix}-combinator`}
            />
          )}
          <AttributeConditionRow
            condition={c}
            attributesPool={propPool}
            onChange={(nc) => setCondition(i, { ...nc, event: triggerEvent })}
            onRemove={() => removeCondition(i)}
            testId={`${testIdPrefix}-row-${i}`}
          />
        </React.Fragment>
      ))}

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

Note: `AttributesSubList.jsx` in `triggerV2/audience/` is no longer imported by this file, but it is left in place unmodified — it's still used by `UserBehaviorConditions.jsx` and `UserAffinityConditions.jsx`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx craco test --testPathPattern="triggerV2/audience/__tests__/EventPropertyConditions.test.jsx" --watchAll=false`
Expected: PASS (all 6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/triggerV2/audience/EventPropertyConditions.jsx src/components/flows/builder/triggerV2/audience/__tests__/EventPropertyConditions.test.jsx
git commit -m "$(cat <<'EOF'
refactor: simplify v2 Event Property filter to flat attribute conditions

Mirrors the v1 change: removes Has Executed/frequency/time-window UI
from the Conditional Split node's Event property block in Flow Builder
v2, leaving the locked trigger event badge plus flat AND/OR attribute
conditions.
EOF
)"
```

---

### Task 3: Update `filterSummary.js` to describe attribute conditions instead of frequency/time-window text

**Files:**
- Modify: `src/components/flows/builder/nodes/ConditionalSplitNode/filterSummary.js`
- Test: `src/components/flows/builder/nodes/ConditionalSplitNode/__tests__/filterSummary.test.js` (new)

**Interfaces:**
- Consumes: nothing new — pure functions operating on plain objects (`block`, `group`).
- Produces: `summarizeFilterGroup(group, opts)` (unchanged signature/export) and `countGroupConditions(group)` (unchanged) — both still exported and used as-is by `ConditionalSplitRightPanel.jsx`'s `FilterTab` (`summarizeFilterGroup(group)` call, no call-site change needed). The internal `event_property` summarizer changes from `summarizeExecutionCondition` (frequency/time-window text) to a new `summarizeEventPropertyBlock(block)` that reads `condition.event`, `condition.property`, `condition.operator`, `condition.value` (the flat shape produced by Tasks 1–2) and ignores `qualifier`/`frequency`/`time_range` if present on old data.

- [ ] **Step 1: Write the failing tests**

Create `src/components/flows/builder/nodes/ConditionalSplitNode/__tests__/filterSummary.test.js`:

```js
import { summarizeFilterGroup } from "../filterSummary";

describe("filterSummary — event_property block", () => {
  it("summarizes a single attribute condition prefixed with the event name", () => {
    const group = {
      id: "fg_1",
      label: "Branch 1",
      blocksCombinator: "AND",
      blocks: [
        {
          id: "blk_1",
          type: "event_property",
          combinator: "AND",
          conditions: [
            { event: "Product Viewed", property: "Product Price", operator: ">", value: "100" },
          ],
        },
      ],
    };
    expect(summarizeFilterGroup(group, { maxLength: 200 })).toBe(
      "Product Viewed where Product Price > 100",
    );
  });

  it("joins multiple attribute conditions with the block combinator", () => {
    const group = {
      id: "fg_1",
      label: "Branch 1",
      blocksCombinator: "AND",
      blocks: [
        {
          id: "blk_1",
          type: "event_property",
          combinator: "OR",
          conditions: [
            { event: "Product Viewed", property: "Product Price", operator: ">", value: "100" },
            { event: "Product Viewed", property: "SKU ID", operator: "Is", value: "X123" },
          ],
        },
      ],
    };
    expect(summarizeFilterGroup(group, { maxLength: 200 })).toBe(
      "Product Viewed where Product Price > 100 OR SKU ID Is X123",
    );
  });

  it("falls back to just the event name when no attribute conditions are filled in", () => {
    const group = {
      id: "fg_1",
      label: "Branch 1",
      blocksCombinator: "AND",
      blocks: [
        {
          id: "blk_1",
          type: "event_property",
          combinator: "AND",
          conditions: [{ event: "Product Viewed", property: "", operator: "", value: "" }],
        },
      ],
    };
    expect(summarizeFilterGroup(group, { maxLength: 200 })).toBe("Product Viewed");
  });

  it("does not include frequency or time-window phrasing even if stale fields are present on old data", () => {
    const group = {
      id: "fg_1",
      label: "Branch 1",
      blocksCombinator: "AND",
      blocks: [
        {
          id: "blk_1",
          type: "event_property",
          combinator: "AND",
          conditions: [
            {
              event: "Product Viewed",
              property: "Product Price",
              operator: ">",
              value: "100",
              qualifier: "has_executed",
              frequency: "at_least",
              count: 2,
              time_range: { op: "in_last", n: 7, unit: "days" },
            },
          ],
        },
      ],
    };
    const summary = summarizeFilterGroup(group, { maxLength: 200 });
    expect(summary).toBe("Product Viewed where Product Price > 100");
    expect(summary).not.toMatch(/times/i);
    expect(summary).not.toMatch(/in the last/i);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx craco test --testPathPattern="ConditionalSplitNode/__tests__/filterSummary.test.js" --watchAll=false`
Expected: FAIL — current `summarizeExecutionCondition` produces "Executed \"Product Viewed\" ..." frequency/time-window text, not "Product Viewed where ...".

- [ ] **Step 3: Update the summarizer**

In `src/components/flows/builder/nodes/ConditionalSplitNode/filterSummary.js`, add a new function and change the `summarizeBlock` dispatch for `event_property`:

Replace:
```js
function summarizeBlock(block) {
  const combinator = block.combinator || "AND";
  let parts;

  if (block.type === "segment") {
    const segs = (block.segments || []).filter(Boolean);
    return segs.length ? `Segment: ${segs.join(" or ")}` : "";
  }

  const summarizer = {
    property: summarizePropertyCondition,
    behavior: summarizeExecutionCondition,
    event_property: summarizeExecutionCondition,
    affinity: summarizeAffinityCondition,
  }[block.type];

  parts = (block.conditions || []).map(summarizer || (() => "")).filter(Boolean);
  return parts.join(` ${combinator} `);
}
```

with:
```js
function summarizeEventPropertyBlock(block) {
  const conditions = block.conditions || [];
  if (!conditions.length) return "";
  const eventName = conditions.find((c) => c.event)?.event || "";
  const combinator = block.combinator || "AND";
  const parts = conditions.map(summarizePropertyCondition).filter(Boolean);
  if (!parts.length) return eventName;
  return eventName
    ? `${eventName} where ${parts.join(` ${combinator} `)}`
    : parts.join(` ${combinator} `);
}

function summarizeBlock(block) {
  const combinator = block.combinator || "AND";

  if (block.type === "segment") {
    const segs = (block.segments || []).filter(Boolean);
    return segs.length ? `Segment: ${segs.join(" or ")}` : "";
  }

  if (block.type === "event_property") {
    return summarizeEventPropertyBlock(block);
  }

  const summarizer = {
    property: summarizePropertyCondition,
    behavior: summarizeExecutionCondition,
    affinity: summarizeAffinityCondition,
  }[block.type];

  const parts = (block.conditions || []).map(summarizer || (() => "")).filter(Boolean);
  return parts.join(` ${combinator} `);
}
```

`summarizeExecutionCondition` stays unchanged and still used by `behavior` blocks (`UserBehaviorConditions`), which keep their frequency/time-window UI.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx craco test --testPathPattern="ConditionalSplitNode/__tests__/filterSummary.test.js" --watchAll=false`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/ConditionalSplitNode/filterSummary.js src/components/flows/builder/nodes/ConditionalSplitNode/__tests__/filterSummary.test.js
git commit -m "$(cat <<'EOF'
fix: summarize Event Property branches by attribute conditions

The collapsed branch card previously showed frequency/time-window text
("Has Executed X at least Y times in the last Z days") for
event_property blocks. Since that UI is removed, the summary now reads
"<event> where <attribute conditions>" to match what the block actually
configures.
EOF
)"
```

---

### Task 4: Full-suite verification and lockdown check

**Files:** None modified — verification only.

**Interfaces:** N/A.

- [ ] **Step 1: Run the full Conditional Split / trigger audience test set**

Run:
```bash
npx craco test --testPathPattern="ConditionalSplitNode|trigger/audience|triggerV2/audience" --watchAll=false
```
Expected: PASS — includes the new tests from Tasks 1–3 plus all pre-existing tests for `ConditionalFilterModal`, `ConditionalFilterModalV2`, `AudienceFilterBuilder`, `UserPropertyConditions`, `UserBehaviorConditions`, `UserAffinityConditions`, `CombinatorPill`, etc. (none of which were modified, so they must still pass unchanged).

- [ ] **Step 2: Run both FlowBuilder lockdown suites**

Per `CLAUDE.md`, since `EventPropertyConditions.jsx` lives under a shared builder path family:

```bash
npx craco test --testPathPattern="FlowBuilder.lockdown|FlowBuilderV2.lockdown" --watchAll=false
```
Expected: PASS — confirms no leakage between v1/v2 builder behavior from this change.

- [ ] **Step 3: Manually verify in the running app**

Start the dev server, open a flow with a Start Trigger event configured (e.g. "Product Viewed"), add a Conditional Split node, open the Filter tab, add an "Event property" block, and confirm:
- The trigger event badge shows "Product Viewed" (not editable).
- No Has Executed/Has Not Executed, frequency, or time-window controls appear.
- Attribute conditions can be added, edited, and combined with AND/OR.
- The collapsed branch summary reads like "Product Viewed where Product Price > 100".
- Repeat in Flow Builder v2 (`flows-v2/builder`) to confirm parity.

- [ ] **Step 4: No commit needed for this task** (verification only — if step 3 surfaces an issue, fix it as part of the relevant earlier task's file and re-commit there).
