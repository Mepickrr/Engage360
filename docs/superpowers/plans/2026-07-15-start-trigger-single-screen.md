# Start Trigger Wizard: Merge to Single Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In Flow Builder V2's Start Trigger modal, merge the "When" and "Who" steps into a single screen, reorder/trim the "Who" section, hide "User Affinity" everywhere in Flow Builder V2, and simplify the modal's header/footer copy.

**Architecture:** `StartTriggerWizard.jsx` currently drives a `stage` state machine (`picker → step1 → step2 → ...`) that renders `Step1WhenContent`/`WebhookTriggerStep1`/`DateRelativeTriggerContent`/`EventOffsetTriggerContent` on step1 and `Step2WhoContent` on step2, with a step-dot header and Next/Back/Finish footer buttons. We collapse `step1`+`step2` into one `stage: "config"` for those four trigger kinds so both pieces of content render on one scrollable screen, gated by the existing `skipStep2` flag. `Step2WhoContent.jsx` is rewritten in place (same file, same props contract minus the removed ones) to reorder its sections, drop "User affinity" and "Show count", and gate "Exclude Users" on the main selector. Broadcast/Broadcast-source/Google-Sheet flows keep their existing content structure but pick up the same simplified header/footer text.

**Tech Stack:** React (function components + hooks), Jest + React Testing Library (`render`, `screen`, `fireEvent`), CRA/craco (`npm test` via `react-scripts test` under the hood).

## Global Constraints

- Flow Builder V2 only — do not touch `FlowTriggerModal.jsx` (legacy V1) or any V1 trigger UI.
- Keep all existing `data-testid` attributes stable unless a step explicitly says to change one — other code/tests may depend on them.
- "User Affinity" removal is UI-only: do not delete `UserAffinityConditions.jsx`, the `affinity` case in `AudienceFilterBuilder.jsx`, or the affinity helpers in `triggerHelpers.js`/`triggerNodeUtils.js`.
- Every task must leave `npm test -- --watchAll=false <affected test files>` green before moving to the next task.

---

### Task 1: Hide "User Affinity" in Broadcast-source audience filter and Conditional Split node

**Files:**
- Modify: `src/components/flows/builder/trigger/BroadcastSourceStep2.jsx:7-12`
- Modify: `src/components/flows/builder/nodes/ConditionalSplitNode/data/mockData.js:86-90`
- Test: `src/components/flows/builder/trigger/__tests__/BroadcastSourceStep2.test.jsx` (new file)

**Interfaces:**
- Consumes: existing `TRIGGER_BLOCK_TYPES` array shape `{ id: string, label: string }[]` in `BroadcastSourceStep2.jsx`, passed straight into `AudienceFilterBuilder`'s `blockTypes` prop (unchanged interface).
- Produces: nothing new consumed by later tasks — this is a leaf change.

- [ ] **Step 1: Write the failing test for BroadcastSourceStep2**

Create `src/components/flows/builder/trigger/__tests__/BroadcastSourceStep2.test.jsx`:

```jsx
import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import BroadcastSourceStep2 from "../BroadcastSourceStep2";

function Harness() {
  const [schedule, setSchedule] = useState({ type: "immediate" });
  const [audience, setAudience] = useState({ include_all: false, include: null, exclude_enabled: false });
  return (
    <BroadcastSourceStep2
      schedule={schedule}
      setSchedule={setSchedule}
      audience={audience}
      setAudience={setAudience}
    />
  );
}

describe("BroadcastSourceStep2 — audience filter tabs", () => {
  it("does not offer a User affinity tab in the include filter builder", () => {
    render(<Harness />);
    expect(screen.getByText("User property")).toBeInTheDocument();
    expect(screen.getByText("User behavior")).toBeInTheDocument();
    expect(screen.getByText("Custom segment")).toBeInTheDocument();
    expect(screen.queryByText("User affinity")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/flows/builder/trigger/__tests__/BroadcastSourceStep2.test.jsx --watchAll=false`
Expected: FAIL — `queryByText("User affinity")` finds the tab, so the "not.toBeInTheDocument()" assertion fails.

- [ ] **Step 3: Remove the affinity entry from BroadcastSourceStep2's block types**

In `src/components/flows/builder/trigger/BroadcastSourceStep2.jsx`, change:

```jsx
const TRIGGER_BLOCK_TYPES = [
  { id: "property", label: "User property" },
  { id: "behavior", label: "User behavior" },
  { id: "affinity", label: "User affinity" },
  { id: "segment", label: "Custom segment" },
];
```

to:

```jsx
const TRIGGER_BLOCK_TYPES = [
  { id: "property", label: "User property" },
  { id: "behavior", label: "User behavior" },
  { id: "segment", label: "Custom segment" },
];
```

- [ ] **Step 4: Remove the affinity entry from the Conditional Split node's block types**

In `src/components/flows/builder/nodes/ConditionalSplitNode/data/mockData.js`, change:

```js
  { id: "property",       label: "User property" },
  { id: "behavior",       label: "User behavior" },
  { id: "affinity",       label: "User affinity" },
  { id: "event_property", label: "Event property" },
  { id: "segment",        label: "Custom segment" },
```

to:

```js
  { id: "property",       label: "User property" },
  { id: "behavior",       label: "User behavior" },
  { id: "event_property", label: "Event property" },
  { id: "segment",        label: "Custom segment" },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx craco test src/components/flows/builder/trigger/__tests__/BroadcastSourceStep2.test.jsx --watchAll=false`
Expected: PASS

- [ ] **Step 6: Run the full builder test suite to check for regressions**

Run: `npx craco test src/components/flows/builder --watchAll=false`
Expected: PASS (no existing test references "affinity" today, per repo grep — see spec).

- [ ] **Step 7: Commit**

```bash
git add src/components/flows/builder/trigger/BroadcastSourceStep2.jsx src/components/flows/builder/nodes/ConditionalSplitNode/data/mockData.js src/components/flows/builder/trigger/__tests__/BroadcastSourceStep2.test.jsx
git commit -m "fix: hide User affinity tab in broadcast-source and conditional split filters"
```

---

### Task 2: Rewrite Step2WhoContent — reorder, gate Exclude Users, remove Show count and User affinity

**Files:**
- Modify: `src/components/flows/builder/trigger/Step2WhoContent.jsx` (full rewrite of the component body; `AudienceKindBlock` helper unchanged)
- Test: `src/components/flows/builder/trigger/__tests__/Step2WhoContent.test.jsx` (new file)

**Interfaces:**
- Consumes: `emptyConditionBlock` from `./triggerHelpers` (unchanged), `AudienceFilterBuilder` from `./audience/AudienceFilterBuilder` (unchanged).
- Produces: `Step2WhoContent` component with **new props**: `{ audience, setAudience }` only — `showCount`, `count`, `loadingCount` props are **removed** (Show count section deleted). `StartTriggerWizard.jsx` (Task 3) must stop passing those three props and may drop the `onShowCount`/`count`/`loadingCount` state entirely once this lands.

- [ ] **Step 1: Write the failing tests for the new Step2WhoContent layout**

Create `src/components/flows/builder/trigger/__tests__/Step2WhoContent.test.jsx`:

```jsx
import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Step2WhoContent from "../Step2WhoContent";

function emptyAudience() {
  return {
    include_all: true,
    include: { blocks: [{ id: "b1", type: "property", combinator: "AND", conditions: [] }], blocksCombinator: "AND" },
    exclude_enabled: false,
    exclude: { blocks: [{ id: "b2", type: "behavior", combinator: "AND", conditions: [] }], blocksCombinator: "AND" },
    limit_enabled: false,
    limit_entry: { count: 1, window: 1, unit: "days" },
    audience_kind: "all",
  };
}

function Harness({ initial }) {
  const [audience, setAudience] = useState(initial || emptyAudience());
  return <Step2WhoContent audience={audience} setAudience={setAudience} />;
}

describe("Step2WhoContent", () => {
  it("renders Limit entry frequency before the All-users/Filter-users selector", () => {
    render(<Harness />);
    const limitLabel = screen.getByText("Limit entry frequency");
    const selectorLabel = screen.getByText("All users who match the start trigger");
    // DOCUMENT_POSITION_FOLLOWING (4) means selectorLabel comes after limitLabel in the DOM.
    // eslint-disable-next-line no-bitwise
    expect(limitLabel.compareDocumentPosition(selectorLabel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("does not render a Show count button", () => {
    render(<Harness />);
    expect(screen.queryByTestId("audience-show-count")).not.toBeInTheDocument();
    expect(screen.queryByText("Show count")).not.toBeInTheDocument();
  });

  it("hides Exclude Users when All users is selected", () => {
    render(<Harness />);
    expect(screen.getByTestId("audience-all-users")).toBeChecked();
    expect(screen.queryByText("Exclude Users")).not.toBeInTheDocument();
  });

  it("shows Exclude Users only after switching to Filter users by", () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId("audience-filter-users"));
    expect(screen.getByText("Exclude Users")).toBeInTheDocument();
  });

  it("does not offer a User affinity filter tab", () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId("audience-filter-users"));
    expect(screen.getByText("User property")).toBeInTheDocument();
    expect(screen.getByText("User behavior")).toBeInTheDocument();
    expect(screen.getByText("Custom segment")).toBeInTheDocument();
    expect(screen.queryByText("User affinity")).not.toBeInTheDocument();
  });

  it("still shows Limit entry frequency when All users is selected", () => {
    render(<Harness />);
    expect(screen.getByTestId("audience-limit-toggle")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx craco test src/components/flows/builder/trigger/__tests__/Step2WhoContent.test.jsx --watchAll=false`
Expected: FAIL — current file shows the selector before Limit entry frequency, always renders Exclude Users, includes a User affinity tab, and still renders Show count.

- [ ] **Step 3: Rewrite Step2WhoContent.jsx**

Replace the full contents of `src/components/flows/builder/trigger/Step2WhoContent.jsx` with:

```jsx
import React from "react";
import AudienceFilterBuilder from "./audience/AudienceFilterBuilder";
import { emptyConditionBlock } from "./triggerHelpers";

const TRIGGER_BLOCK_TYPES = [
  { id: "property", label: "User property" },
  { id: "behavior", label: "User behavior" },
  { id: "segment", label: "Custom segment" },
];

const AUDIENCE_KINDS = [
  { id: "all", label: "All Users" },
  { id: "identified", label: "Engage Identified" },
  { id: "known", label: "Known User" },
];

export default function Step2WhoContent({ audience, setAudience }) {
  const setIncludeAll = (all) => setAudience({ ...audience, include_all: all });
  const filtering = !audience.include_all;

  return (
    <div className="space-y-5">
      {/* Limit entry frequency */}
      <div className="pb-4 border-b border-border space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!audience.limit_enabled}
            onChange={(e) => setAudience({ ...audience, limit_enabled: e.target.checked })}
            className="accent-primary"
            data-testid="audience-limit-toggle"
          />
          <span className="text-sm font-medium">Limit entry frequency</span>
        </label>
        {audience.limit_enabled && (
          <div className="pl-6 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-text-secondary">Limit to</span>
            <input
              type="number"
              min={1}
              value={audience.limit_entry?.count ?? 1}
              onChange={(e) =>
                setAudience({ ...audience, limit_entry: { ...(audience.limit_entry || {}), count: Number(e.target.value) } })
              }
              data-testid="audience-limit-count"
              className="w-16 px-2 py-1.5 text-sm rounded-md border border-border bg-surface"
            />
            <span className="text-text-secondary">time(s) within</span>
            <input
              type="number"
              min={1}
              value={audience.limit_entry?.window ?? 1}
              onChange={(e) =>
                setAudience({ ...audience, limit_entry: { ...(audience.limit_entry || {}), window: Number(e.target.value) } })
              }
              data-testid="audience-limit-window"
              className="w-16 px-2 py-1.5 text-sm rounded-md border border-border bg-surface"
            />
            <select
              value={audience.limit_entry?.unit || "days"}
              onChange={(e) =>
                setAudience({ ...audience, limit_entry: { ...(audience.limit_entry || {}), unit: e.target.value } })
              }
              data-testid="audience-limit-unit"
              className="h-9 text-sm rounded-md border border-border bg-surface px-2"
            >
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
          </div>
        )}
      </div>

      {/* Main selector */}
      <div className="flex items-center gap-5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={!!audience.include_all}
            onChange={() => setIncludeAll(true)}
            data-testid="audience-all-users"
            className="accent-primary"
          />
          <span className="text-sm">All users who match the start trigger</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={!audience.include_all}
            onChange={() => setIncludeAll(false)}
            data-testid="audience-filter-users"
            className="accent-primary"
          />
          <span className="text-sm">Filter users by</span>
        </label>
      </div>

      {filtering && (
        <>
          {/* Audience kind pills */}
          <AudienceKindBlock
            value={audience.audience_kind || "all"}
            onChange={(v) => setAudience({ ...audience, audience_kind: v })}
          />
          <div className="h-px bg-border" />

          {/* Include blocks */}
          <AudienceFilterBuilder
            blockSet={audience.include || { blocks: [emptyConditionBlock("property")], blocksCombinator: "AND" }}
            onChange={(b) => setAudience({ ...audience, include: b })}
            testIdPrefix="audience-include"
            blockTypes={TRIGGER_BLOCK_TYPES}
          />

          {/* Exclude Users — only shown while filtering */}
          <div className="border-t border-border pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!audience.exclude_enabled}
                onChange={(e) => setAudience({ ...audience, exclude_enabled: e.target.checked })}
                data-testid="audience-exclude-toggle"
                className="accent-primary"
              />
              <span className="text-sm font-medium text-text-primary">Exclude Users</span>
            </label>
            {audience.exclude_enabled && (
              <div className="mt-3">
                <AudienceFilterBuilder
                  blockSet={audience.exclude || { blocks: [emptyConditionBlock("behavior")], blocksCombinator: "AND" }}
                  onChange={(b) => setAudience({ ...audience, exclude: b })}
                  testIdPrefix="audience-exclude"
                  blockTypes={TRIGGER_BLOCK_TYPES}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Audience Kind pills ───────────────────────────────────────
function AudienceKindBlock({ value, onChange }) {
  return (
    <div className="space-y-2" data-testid="audience-type-block">
      <div className="text-[12px] font-medium uppercase tracking-wide text-text-muted">
        Audience Type
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {AUDIENCE_KINDS.map((t) => {
          const active = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              data-testid={`audience-type-${t.id}`}
              className={`rounded-full border px-3.5 py-2 text-[13px] transition-colors ${
                active
                  ? "bg-primary text-white border-primary"
                  : "bg-surface text-text-primary border-border hover:bg-primary-tint hover:border-primary/40"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

Note what was deliberately dropped versus the old file: the `Loader2` import, the `showCount`/`count`/`loadingCount` props, the "Show count" `<div>` block at the bottom, the two dead `{false && ...}` "Global control group"/"Flow control group" blocks (already unreachable, and unrelated to this feature — safe to drop since they never rendered), and the `"affinity"` entry from `TRIGGER_BLOCK_TYPES`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx craco test src/components/flows/builder/trigger/__tests__/Step2WhoContent.test.jsx --watchAll=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/trigger/Step2WhoContent.jsx src/components/flows/builder/trigger/__tests__/Step2WhoContent.test.jsx
git commit -m "feat: reorder Who section, gate Exclude Users on filter mode, drop Show count and User affinity"
```

---

### Task 3: Merge Step 1 + Step 2 into a single screen in StartTriggerWizard

**Files:**
- Modify: `src/components/flows/builder/trigger/StartTriggerWizard.jsx`
- Modify: `src/components/flows/builder/trigger/__tests__/StartTriggerWizard.webhook.test.jsx`
- Modify: `src/components/flows/builder/trigger/__tests__/StartTriggerWizard.dateTime.test.jsx`
- Modify: `src/components/flows/builder/trigger/__tests__/StartTriggerWizard.lockdown.test.jsx`
- Test: `src/components/flows/builder/trigger/__tests__/StartTriggerWizard.event.test.jsx` (new file)

**Interfaces:**
- Consumes: `Step2WhoContent` from Task 2 with props `{ audience, setAudience }` only (no `showCount`/`count`/`loadingCount`).
- Produces: `stage` values narrow to `"picker" | "config" | "broadcast" | "broadcast-source-1" | "broadcast-source-2"` (the `"step1"`/`"step2"` split is gone for the four merged kinds). `data-testid="trigger-wizard-finish"` remains the id of the final action button (Task 4 renames its label text only). `data-testid="trigger-wizard-back"` / `"trigger-wizard-next"` no longer render for the merged kinds (there is only one screen), but `trigger-wizard-next` still renders for `broadcast-source-1` unchanged.

- [ ] **Step 1: Write the failing test for the merged Event-trigger flow**

Create `src/components/flows/builder/trigger/__tests__/StartTriggerWizard.event.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StartTriggerWizard from "../StartTriggerWizard";

function pickOrderPlaced() {
  fireEvent.click(screen.getByTestId("event-picker-header-Ecommerce"));
  fireEvent.click(screen.getByTestId("event-picker-card-Order placed"));
}

describe("StartTriggerWizard — merged single screen (Event trigger)", () => {
  it("shows the When content and the Who content on the same screen, with no Next/Back buttons", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickOrderPlaced();

    expect(screen.getByTestId("trigger-group-0")).toBeInTheDocument();
    expect(screen.getByTestId("audience-all-users")).toBeInTheDocument();
    expect(screen.queryByTestId("trigger-wizard-next")).not.toBeInTheDocument();
    expect(screen.getByTestId("trigger-wizard-finish")).toBeInTheDocument();
  });

  it("finishes with kind: event and the configured audience, without a Next click", () => {
    const onComplete = jest.fn();
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={onComplete} />);
    pickOrderPlaced();

    fireEvent.click(screen.getByTestId("audience-filter-users"));
    fireEvent.click(screen.getByTestId("trigger-wizard-finish"));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "event",
        audience: expect.objectContaining({ include_all: false }),
      }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/flows/builder/trigger/__tests__/StartTriggerWizard.event.test.jsx --watchAll=false`
Expected: FAIL — today, after picking "Order placed", only `Step1WhenContent` renders (`audience-all-users` is not yet on screen) and a `trigger-wizard-next` button is present.

- [ ] **Step 3: Collapse the stage machine — update state, comment, and skip-flags**

In `src/components/flows/builder/trigger/StartTriggerWizard.jsx`, change the stage comment and initial state (no functional change yet, just documents the new value set):

```jsx
  // "picker" | "config" | "broadcast" | "broadcast-source-1" | "broadcast-source-2"
  const [stage, setStage] = useState("picker");
```

- [ ] **Step 4: Point every `setStage("step1")` call (for the 4 merged kinds) to `setStage("config")`**

There are 7 call sites in the hydrate-on-edit `useEffect` and in `onPickEvent` that call `setStage("step1")` for webhook / date_relative / event_offset / google_sheet / default-event branches. Replace each `setStage("step1")` that is reached by the webhook, date-relative, event-offset, or default-event branches with `setStage("config")`. Concretely, in `StartTriggerWizard.jsx`:

- Line ~124 (`initialConfig?.kind === "webhook"` branch): `setStage("step1")` → `setStage("config")`
- Line ~131 (`initialConfig?.kind === "date_relative"` branch): `setStage("step1")` → `setStage("config")`
- Line ~138 (`initialConfig?.kind === "event_offset"` branch): `setStage("step1")` → `setStage("config")`
- Line ~156 (`initialConfig?.kind === "google_sheet_new_row"` branch): leave as `setStage("step1")` for now — Google Sheet is single-content-screen already and is only renamed via `stage` checks in Step 6 below, not merged with anything. Rename it too, to keep `"step1"` out of the stage vocabulary entirely: `setStage("config")`.
- Line ~175 (final `else` branch, default event kind): `setStage("step1")` → `setStage("config")`
- Line ~222 (webhook branch in `onPickEvent`): `setStage("step1")` → `setStage("config")`
- Line ~229 (google sheet branch in `onPickEvent`): `setStage("step1")` → `setStage("config")`
- Line ~249 (date_relative branch in `onPickEvent`): `setStage("step1")` → `setStage("config")`
- Line ~256 (event_offset branch in `onPickEvent`): `setStage("step1")` → `setStage("config")`
- Line ~262 (final `else` branch in `onPickEvent`, default event kind): `setStage("step1")` → `setStage("config")`
- Line ~281 (`onPickEvent`'s "picking for existing group" branch, after closing the picker): `setStage("step1")` → `setStage("config")`

Also update the `if (stage === "picker")` early-return check just below — it stays exactly as-is (`stage === "picker"` is still a valid stage value, unaffected by this rename).

- [ ] **Step 5: Update `skipStep2` derivation and its one remaining use**

The variable name `skipStep2` still accurately describes "the Who section is skipped for this trigger" — keep the name (renaming it is not required by the spec and would toun extra surface). No code change needed here; it is reused as-is in Step 6.

- [ ] **Step 6: Merge the render block — one screen shows step1-content then Who-content**

Replace this block (currently around line 432-473):

```jsx
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {stage === "step1" && isWebhook && (
              <WebhookTriggerStep1 config={webhookConfig} setConfig={setWebhookConfig} />
            )}
            {stage === "step1" && isGoogleSheet && (
              <GoogleSheetTriggerStep1 config={googleSheetConfig} setConfig={setGoogleSheetConfig} />
            )}
            {stage === "step1" && isDateRelative && !isWebhook && !isGoogleSheet && (
              <DateRelativeTriggerContent
                dateConfig={dateConfig}
                setDateConfig={setDateConfig}
              />
            )}
            {stage === "step1" && isEventOffset && !isWebhook && !isGoogleSheet && (
              <EventOffsetTriggerContent
                config={eventOffsetConfig}
                setConfig={setEventOffsetConfig}
              />
            )}
            {stage === "step1" && !isDateRelative && !isEventOffset && !isWebhook && !isGoogleSheet && (
              <Step1WhenContent
                triggerGroups={triggerGroups}
                setTriggerGroups={setTriggerGroups}
                groupsCombinator={groupsCombinator}
                setGroupsCombinator={setGroupsCombinator}
                exitTrigger={exitTrigger}
                setExitTrigger={setExitTrigger}
                onPickEventForGroup={(idx) => {
                  setPickingForGroupIdx(idx);
                  setStage("picker");
                }}
              />
            )}
            {stage === "step2" && (
              <Step2WhoContent
                audience={audience}
                setAudience={setAudience}
                showCount={onShowCount}
                count={count}
                loadingCount={loadingCount}
              />
            )}
            {stage === "broadcast" && (
              <BroadcastConfig config={broadcast} setConfig={setBroadcast} />
            )}
            {stage === "broadcast-source-1" && (
              <BroadcastSourceStep1
                sourceType={broadcastSourceType}
                config={broadcastSourceConfig}
                setConfig={setBroadcastSourceConfig}
              />
            )}
            {stage === "broadcast-source-2" && (
              <BroadcastSourceStep2
                schedule={broadcastSourceSchedule}
                setSchedule={setBroadcastSourceSchedule}
                audience={audience}
                setAudience={setAudience}
              />
            )}
          </div>
```

with:

```jsx
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            {stage === "config" && isWebhook && (
              <WebhookTriggerStep1 config={webhookConfig} setConfig={setWebhookConfig} />
            )}
            {stage === "config" && isGoogleSheet && (
              <GoogleSheetTriggerStep1 config={googleSheetConfig} setConfig={setGoogleSheetConfig} />
            )}
            {stage === "config" && isDateRelative && !isWebhook && !isGoogleSheet && (
              <DateRelativeTriggerContent
                dateConfig={dateConfig}
                setDateConfig={setDateConfig}
              />
            )}
            {stage === "config" && isEventOffset && !isWebhook && !isGoogleSheet && (
              <EventOffsetTriggerContent
                config={eventOffsetConfig}
                setConfig={setEventOffsetConfig}
              />
            )}
            {stage === "config" && !isDateRelative && !isEventOffset && !isWebhook && !isGoogleSheet && (
              <Step1WhenContent
                triggerGroups={triggerGroups}
                setTriggerGroups={setTriggerGroups}
                groupsCombinator={groupsCombinator}
                setGroupsCombinator={setGroupsCombinator}
                exitTrigger={exitTrigger}
                setExitTrigger={setExitTrigger}
                onPickEventForGroup={(idx) => {
                  setPickingForGroupIdx(idx);
                  setStage("picker");
                }}
              />
            )}
            {stage === "config" && !skipStep2 && (
              <Step2WhoContent audience={audience} setAudience={setAudience} />
            )}
            {stage === "broadcast" && (
              <BroadcastConfig config={broadcast} setConfig={setBroadcast} />
            )}
            {stage === "broadcast-source-1" && (
              <BroadcastSourceStep1
                sourceType={broadcastSourceType}
                config={broadcastSourceConfig}
                setConfig={setBroadcastSourceConfig}
              />
            )}
            {stage === "broadcast-source-2" && (
              <BroadcastSourceStep2
                schedule={broadcastSourceSchedule}
                setSchedule={setBroadcastSourceSchedule}
                audience={audience}
                setAudience={setAudience}
              />
            )}
          </div>
```

- [ ] **Step 7: Update the footer — drop Next/Back for the merged stage, gate Submit's disabled state on webhook validity**

Replace the footer's back-button condition (currently `stage === "step2" || stage === "broadcast-source-2" || !lockdown`) and its label (currently `stage === "step2" || stage === "broadcast-source-2" ? "Back" : "Cancel"`) with the `"config"` stage no longer implying "Back" — there is nothing to go back to within `"config"` (the event-picker re-open is a separate control on the When content itself). Change:

```jsx
            {(stage === "step2" || stage === "broadcast-source-2" || !lockdown) && (
              <button
                type="button"
                onClick={() => {
                  if (stage === "step2") setStage("step1");
                  else if (stage === "broadcast-source-2") setStage("broadcast-source-1");
                  else onClose();
                }}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-text-secondary hover:text-text-primary rounded-md hover:bg-slate-100"
                data-testid="trigger-wizard-back"
              >
                <ArrowLeft className="w-4 h-4" />
                {stage === "step2" || stage === "broadcast-source-2" ? "Back" : "Cancel"}
              </button>
            )}
```

to:

```jsx
            {(stage === "broadcast-source-2" || !lockdown) && (
              <button
                type="button"
                onClick={() => {
                  if (stage === "broadcast-source-2") setStage("broadcast-source-1");
                  else onClose();
                }}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-text-secondary hover:text-text-primary rounded-md hover:bg-slate-100"
                data-testid="trigger-wizard-back"
              >
                <ArrowLeft className="w-4 h-4" />
                {stage === "broadcast-source-2" ? "Back" : "Cancel"}
              </button>
            )}
```

Then remove the old `"step1"`-only Next button entirely (it no longer applies — there is no more `"step1"` stage) by deleting this block:

```jsx
              {stage === "step1" && !skipStep2 && (
                <button
                  type="button"
                  onClick={() => setStage("step2")}
                  disabled={isWebhook && !isWebhookStep1Valid(webhookConfig)}
                  data-testid="trigger-wizard-next"
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundImage: "linear-gradient(135deg, #6C3AE8 0%, #8B5CF6 100%)" }}
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
```

Finally, update the Finish button's render condition and disabled logic (currently `stage === "step2" || (stage === "step1" && skipStep2) || stage === "broadcast" || stage === "broadcast-source-2"`, disabled only for invalid Google Sheet):

```jsx
              {(stage === "step2" ||
                (stage === "step1" && skipStep2) ||
                stage === "broadcast" ||
                stage === "broadcast-source-2") && (
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={isGoogleSheet && !isGoogleSheetStep1Valid(googleSheetConfig)}
                  data-testid="trigger-wizard-finish"
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundImage: "linear-gradient(135deg, #6C3AE8 0%, #8B5CF6 100%)" }}
                >
                  Finish
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
```

becomes:

```jsx
              {(stage === "config" || stage === "broadcast" || stage === "broadcast-source-2") && (
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={
                    (isGoogleSheet && !isGoogleSheetStep1Valid(googleSheetConfig)) ||
                    (isWebhook && !isWebhookStep1Valid(webhookConfig))
                  }
                  data-testid="trigger-wizard-finish"
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundImage: "linear-gradient(135deg, #6C3AE8 0%, #8B5CF6 100%)" }}
                >
                  Finish
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
```

(Label text stays "Finish" for now — Task 4 renames it to "Submit" along with the header.)

- [ ] **Step 8: Remove the step-dot header row for the merged kinds**

The two `StepDot` blocks (one for `stage !== "broadcast" && !stage.startsWith("broadcast-source")`, one for `stage.startsWith("broadcast-source")`) reference `stage === "step1"`/`stage === "step2"` for `active`/`done`. Since `"step1"`/`"step2"` no longer exist, update the first block's dots to reflect the merged stage — change:

```jsx
          {stage !== "broadcast" && !stage.startsWith("broadcast-source") && (
            <div className="px-5 pt-4 flex items-center gap-3">
              <StepDot n={1} active={stage === "step1"} done={stage === "step2"} label={isWebhook ? "Configure Webhook" : isGoogleSheet ? "Configure Google Sheet Data Entry" : "When"} />
              <span className="flex-1 h-px bg-border" />
              <StepDot
                n={2}
                active={stage === "step2"}
                done={false}
                label="Who"
                disabled={skipStep2}
              />
            </div>
          )}
```

to:

```jsx
          {stage !== "broadcast" && !stage.startsWith("broadcast-source") && (
            <div className="px-5 pt-4 flex items-center gap-3">
              <StepDot n={1} active={stage === "config"} done={false} label={isWebhook ? "Configure Webhook" : isGoogleSheet ? "Configure Google Sheet Data Entry" : "When"} />
              <span className="flex-1 h-px bg-border" />
              <StepDot
                n={2}
                active={stage === "config" && !skipStep2}
                done={false}
                label="Who"
                disabled={skipStep2}
              />
            </div>
          )}
```

(This keeps the step dots functionally correct for this task; Task 4 deletes this whole block along with the `stepperLabel` text as part of the header simplification, so the exact "done"/"active" values here are short-lived.)

- [ ] **Step 9: Remove the now-unused `onShowCount`/`count`/`loadingCount` wiring**

`Step2WhoContent` (Task 2) no longer accepts `showCount`/`count`/`loadingCount`, and Step 6 above already stopped passing them. Delete the now-dead `onShowCount` function and the `count`/`loadingCount` state:

```jsx
  const [count, setCount] = useState(null);
  const [loadingCount, setLoadingCount] = useState(false);
```

and

```jsx
  const onShowCount = () => {
    setLoadingCount(true);
    setTimeout(() => {
      setCount(mockedAudienceCount());
      setLoadingCount(false);
    }, 600);
  };
```

Also remove `setCount(null);` from the hydrate `useEffect` (it referenced the now-deleted `count` state) and remove the now-unused `mockedAudienceCount` import from `./triggerHelpers` (keep `emptyConditionBlock`, which is still used).

- [ ] **Step 10: Update `StartTriggerWizard.webhook.test.jsx` for the merged screen**

Replace the third test (the one that clicks `trigger-wizard-next` mid-flow) — the full file becomes:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StartTriggerWizard from "../StartTriggerWizard";

beforeEach(() => {
  Object.assign(navigator, { clipboard: { writeText: jest.fn() } });
});

function pickWebhookTrigger() {
  fireEvent.click(screen.getByTestId("event-picker-header-Webhook and API"));
  fireEvent.click(screen.getByTestId("event-picker-card-Webhook trigger"));
}

describe("StartTriggerWizard — Webhook trigger", () => {
  it("routes to WebhookTriggerStep1 instead of Step1WhenContent when picked", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickWebhookTrigger();
    expect(screen.getByTestId("webhook-step1")).toBeInTheDocument();
  });

  it("disables Submit until the webhook config is valid, then enables it", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickWebhookTrigger();
    expect(screen.getByTestId("trigger-wizard-finish")).toBeDisabled();

    fireEvent.change(screen.getByTestId("webhook-sample-payload"), {
      target: { value: '{"vas_id": "+919999999999"}' },
    });
    fireEvent.change(screen.getByTestId("webhook-unique-id-type"), { target: { value: "Phone Number" } });
    fireEvent.change(screen.getByTestId("webhook-unique-id-var"), { target: { value: "vas_id" } });
    expect(screen.getByTestId("trigger-wizard-finish")).not.toBeDisabled();
  });

  it("shows the Who-enters-the-flow content on the same screen and finishes with a kind: webhook config", () => {
    const onComplete = jest.fn();
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={onComplete} />);
    pickWebhookTrigger();

    fireEvent.change(screen.getByTestId("webhook-sample-payload"), {
      target: { value: '{"vas_id": "+919999999999"}' },
    });
    fireEvent.change(screen.getByTestId("webhook-unique-id-type"), { target: { value: "Phone Number" } });
    fireEvent.change(screen.getByTestId("webhook-unique-id-var"), { target: { value: "vas_id" } });

    fireEvent.click(screen.getByTestId("audience-filter-users"));
    expect(screen.getByTestId("audience-type-block")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("trigger-wizard-finish"));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "webhook",
        uniqueId: { type: "Phone Number", payloadVariable: "vas_id" },
        payloadVariables: [{ path: "vas_id", example: "+919999999999" }],
      }),
    );
  });
});
```

- [ ] **Step 11: Update `StartTriggerWizard.dateTime.test.jsx` for the merged screen**

Replace every `fireEvent.click(screen.getByTestId("trigger-wizard-next"));` line (there are 3) by simply deleting that line — the Who content (or the Finish button, for `skipStep2` cases) is now on the same screen as soon as the trigger content renders. The full file becomes:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StartTriggerWizard from "../StartTriggerWizard";

function pickDateAndTimeCard(cardName) {
  fireEvent.click(screen.getByTestId("event-picker-header-Date and time"));
  fireEvent.click(screen.getByTestId(`event-picker-card-${cardName}`));
}

describe("StartTriggerWizard — Date and time section", () => {
  it("routes user-attribute date cards to DateRelativeTriggerContent, not the attribute-condition builder", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickDateAndTimeCard("Birthday");
    expect(screen.queryByTestId("trigger-wizard-back")).toBeInTheDocument();
    expect(screen.queryByText(/Add evaluate rule/i)).not.toBeInTheDocument();
  });

  it("pre-selects the clicked card's date attribute and finishes with it", () => {
    const onComplete = jest.fn();
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={onComplete} />);
    pickDateAndTimeCard("Birthday");

    fireEvent.click(screen.getByTestId("trigger-wizard-finish"));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "date_relative",
        dateConfig: expect.objectContaining({ attribute: "date_of_birth" }),
      }),
    );
  });

  it("pre-selects Account Created's attribute distinctly from Birthday's", () => {
    const onComplete = jest.fn();
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={onComplete} />);
    pickDateAndTimeCard("Account Created");

    fireEvent.click(screen.getByTestId("trigger-wizard-finish"));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        dateConfig: expect.objectContaining({ attribute: "account_created" }),
      }),
    );
  });

  it("routes Back in Stock to EventOffsetTriggerContent instead of the attribute-condition builder", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickDateAndTimeCard("Back in Stock");
    expect(screen.getByTestId("event-offset-step1")).toBeInTheDocument();
  });

  it("still shows the Who-enters-the-flow content for Back in Stock, then finishes with kind: event_offset", () => {
    const onComplete = jest.fn();
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={onComplete} />);
    pickDateAndTimeCard("Back in Stock");

    expect(screen.getByTestId("audience-filter-users")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("trigger-wizard-finish"));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "event_offset",
        eventOffsetConfig: expect.objectContaining({ event: "Back in Stock", value: 1, unit: "Hours" }),
      }),
    );
  });

  it("hydrates an existing event_offset config back into EventOffsetTriggerContent on edit", () => {
    const initialConfig = {
      kind: "event_offset",
      eventOffsetConfig: { event: "Price Drop", value: 2, unit: "Days" },
      audience: { include_all: true },
    };
    render(<StartTriggerWizard open initialConfig={initialConfig} onClose={() => {}} onComplete={() => {}} />);
    expect(screen.getByTestId("event-offset-step1")).toBeInTheDocument();
    expect(screen.getByTestId("event-offset-value-input")).toHaveValue(2);
  });
});
```

- [ ] **Step 12: Update `StartTriggerWizard.lockdown.test.jsx` — the step2-specific Back test no longer applies**

Replace the last two tests (`"hides the footer Cancel button on step1 when locked, after picking a trigger"` and `"still shows Back (not Cancel) on step2 when locked"`) with a single test reflecting the merged screen (there is no more "Back" step to reach in lockdown mode — the whole config is one screen, so Cancel/Back is hidden throughout, exactly like the old step1 behavior). Change:

```jsx
  it("hides the footer Cancel button on step1 when locked, after picking a trigger", () => {
    render(
      <StartTriggerWizard
        open
        initialConfig={null}
        lockdown
        onClose={() => {}}
        onComplete={() => {}}
        onSaveDraft={() => {}}
        onDeleteFlow={() => {}}
      />,
    );
    pickAnyEventTrigger();
    expect(screen.getByTestId("trigger-wizard")).toBeInTheDocument();
    expect(screen.queryByTestId("trigger-wizard-back")).not.toBeInTheDocument();
  });

  it("still shows Back (not Cancel) on step2 when locked", () => {
    render(
      <StartTriggerWizard
        open
        initialConfig={null}
        lockdown
        onClose={() => {}}
        onComplete={() => {}}
        onSaveDraft={() => {}}
        onDeleteFlow={() => {}}
      />,
    );
    pickAnyEventTrigger();
    fireEvent.click(screen.getByTestId("trigger-wizard-next"));
    expect(screen.getByTestId("trigger-wizard-back")).toBeInTheDocument();
    expect(screen.getByTestId("trigger-wizard-back")).toHaveTextContent("Back");
  });
```

to:

```jsx
  it("hides the footer Cancel/Back button on the merged config screen when locked", () => {
    render(
      <StartTriggerWizard
        open
        initialConfig={null}
        lockdown
        onClose={() => {}}
        onComplete={() => {}}
        onSaveDraft={() => {}}
        onDeleteFlow={() => {}}
      />,
    );
    pickAnyEventTrigger();
    expect(screen.getByTestId("trigger-wizard")).toBeInTheDocument();
    expect(screen.queryByTestId("trigger-wizard-back")).not.toBeInTheDocument();
  });
```

- [ ] **Step 13: Run the full affected test suite**

Run: `npx craco test src/components/flows/builder/trigger --watchAll=false`
Expected: PASS — all of `StartTriggerWizard.event.test.jsx`, `StartTriggerWizard.webhook.test.jsx`, `StartTriggerWizard.dateTime.test.jsx`, `StartTriggerWizard.lockdown.test.jsx`, `StartTriggerWizard.googleSheet.test.jsx`, and the isolated content tests all pass.

- [ ] **Step 14: Commit**

```bash
git add src/components/flows/builder/trigger/StartTriggerWizard.jsx src/components/flows/builder/trigger/__tests__/StartTriggerWizard.webhook.test.jsx src/components/flows/builder/trigger/__tests__/StartTriggerWizard.dateTime.test.jsx src/components/flows/builder/trigger/__tests__/StartTriggerWizard.lockdown.test.jsx src/components/flows/builder/trigger/__tests__/StartTriggerWizard.event.test.jsx
git commit -m "feat: merge Start Trigger When+Who steps into a single screen"
```

---

### Task 4: Simplify header title and footer "Submit" label across every trigger kind

**Files:**
- Modify: `src/components/flows/builder/trigger/StartTriggerWizard.jsx`
- Test: `src/components/flows/builder/trigger/__tests__/StartTriggerWizard.header.test.jsx` (new file)

**Interfaces:**
- Consumes: nothing new — pure text/JSX-structure change on top of Task 3's merged stage machine.
- Produces: header title text is `"Configure Start Trigger"`; there is no step-label subtitle and no step-dot row anywhere; the wizard's final action button (`data-testid="trigger-wizard-finish"`) reads `"Submit"` in every stage that renders it (`config`, `broadcast`, `broadcast-source-2`); `data-testid="trigger-wizard-next"` (still used only for `broadcast-source-1` → `broadcast-source-2`) is unchanged and still reads `"Next"`.

- [ ] **Step 1: Write the failing header/footer tests**

Create `src/components/flows/builder/trigger/__tests__/StartTriggerWizard.header.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StartTriggerWizard from "../StartTriggerWizard";

function pickOrderPlaced() {
  fireEvent.click(screen.getByTestId("event-picker-header-Ecommerce"));
  fireEvent.click(screen.getByTestId("event-picker-card-Order placed"));
}

function pickCsvBroadcast() {
  fireEvent.click(screen.getByTestId("event-picker-header-Broadcast"));
  fireEvent.click(screen.getByTestId("event-picker-card-CSV upload"));
}

describe("StartTriggerWizard — simplified header and Submit footer", () => {
  it("shows the simple 'Configure Start Trigger' title with no step label, for the event trigger", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickOrderPlaced();
    expect(screen.getByText("Configure Start Trigger")).toBeInTheDocument();
    expect(screen.queryByText(/When will users enter the flow/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Who will enter the flow/i)).not.toBeInTheDocument();
  });

  it("labels the final action Submit instead of Finish, for the event trigger", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickOrderPlaced();
    expect(screen.getByTestId("trigger-wizard-finish")).toHaveTextContent("Submit");
  });

  it("shows the simple title for broadcast-source, and Submit only on its final screen", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickCsvBroadcast();
    expect(screen.getByText("Configure Start Trigger")).toBeInTheDocument();
    expect(screen.getByTestId("trigger-wizard-next")).toHaveTextContent("Next");
    fireEvent.click(screen.getByTestId("trigger-wizard-next"));
    expect(screen.getByTestId("trigger-wizard-finish")).toHaveTextContent("Submit");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/flows/builder/trigger/__tests__/StartTriggerWizard.header.test.jsx --watchAll=false`
Expected: FAIL — header still says "Configure trigger" with a step-label subtitle, and the final button still reads "Finish".

- [ ] **Step 3: Simplify the header — drop the step-label subtitle and both step-dot rows**

In `src/components/flows/builder/trigger/StartTriggerWizard.jsx`, delete the `sourceStepLabel`/`stepperLabel` computation block entirely:

```jsx
  const sourceStepLabel =
    broadcastSourceType === "csv" ? "Select CSV files" : "Select segments";
  const stepperLabel =
    stage === "broadcast"
      ? "Configure broadcast"
      : stage === "broadcast-source-1" || stage === "broadcast-source-2"
      ? `1. ${sourceStepLabel} → 2. Schedule & audience`
      : isWebhook
      ? "1. Configure Webhook → 2. Who will enter the flow"
      : isGoogleSheet
      ? "1. Configure Google Sheet Data Entry"
      : "1. When will users enter the flow → 2. Who will enter the flow";
```

Change the header markup from:

```jsx
          <DialogTitle className="sr-only">Configure trigger</DialogTitle>
          <header className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-base font-semibold text-text-primary">
                Configure trigger
              </div>
              <div className="text-[12px] text-text-muted hidden sm:block">
                {stepperLabel}
              </div>
            </div>
```

to:

```jsx
          <DialogTitle className="sr-only">Configure Start Trigger</DialogTitle>
          <header className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-base font-semibold text-text-primary">
                Configure Start Trigger
              </div>
            </div>
```

Delete both step-dot rows entirely (the block introduced/adjusted in Task 3 Step 8, and the `broadcast-source` one):

```jsx
          {stage !== "broadcast" && !stage.startsWith("broadcast-source") && (
            <div className="px-5 pt-4 flex items-center gap-3">
              <StepDot n={1} active={stage === "config"} done={false} label={isWebhook ? "Configure Webhook" : isGoogleSheet ? "Configure Google Sheet Data Entry" : "When"} />
              <span className="flex-1 h-px bg-border" />
              <StepDot
                n={2}
                active={stage === "config" && !skipStep2}
                done={false}
                label="Who"
                disabled={skipStep2}
              />
            </div>
          )}

          {stage.startsWith("broadcast-source") && (
            <div className="px-5 pt-4 flex items-center gap-3">
              <StepDot
                n={1}
                active={stage === "broadcast-source-1"}
                done={stage === "broadcast-source-2"}
                label={sourceStepLabel}
              />
              <span className="flex-1 h-px bg-border" />
              <StepDot
                n={2}
                active={stage === "broadcast-source-2"}
                done={false}
                label="Schedule & Audience"
              />
            </div>
          )}
```

(delete both blocks, nothing replaces them). Also delete the now-unused `StepDot` function definition at the bottom of the file.

- [ ] **Step 4: Rename the final action button's label from "Finish" to "Submit"**

Change:

```jsx
                  Finish
                  <ArrowRight className="w-4 h-4" />
```

to:

```jsx
                  Submit
                  <ArrowRight className="w-4 h-4" />
```

(The `data-testid="trigger-wizard-finish"` stays unchanged — only the visible label text changes.)

- [ ] **Step 5: Run test to verify it passes**

Run: `npx craco test src/components/flows/builder/trigger/__tests__/StartTriggerWizard.header.test.jsx --watchAll=false`
Expected: PASS

- [ ] **Step 6: Run the full builder test suite**

Run: `npx craco test src/components/flows/builder --watchAll=false`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/flows/builder/trigger/StartTriggerWizard.jsx src/components/flows/builder/trigger/__tests__/StartTriggerWizard.header.test.jsx
git commit -m "feat: simplify Start Trigger header and rename Finish to Submit"
```

---

## Final Verification

- [ ] Run the entire flows/builder test suite once more end to end: `npx craco test src/components/flows/builder --watchAll=false`
- [ ] Manually smoke-test in the running app (see the `run`/`verify` skills if available): open Flow Builder V2, add a Start Trigger, pick "Abandoned cart", confirm the When and Who content appear on one screen with "Limit entry frequency" above the All-users/Filter-users selector, "Exclude Users" only appears after choosing "Filter users by", there is no "User affinity" tab anywhere, there is no "Show count" button, the header reads "Configure Start Trigger" with no step numbering, and the footer button reads "Submit".
