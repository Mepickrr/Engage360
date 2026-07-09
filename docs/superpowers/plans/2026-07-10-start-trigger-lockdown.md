# Start-Trigger Lockdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** During first-time trigger setup in the flow builder (v1 and v2), make the trigger wizard impossible to dismiss without configuring a trigger — the only exits are explicit "Save draft" or "Delete flow" actions.

**Architecture:** Add a `lockdown` boolean prop (true only when no `start-trigger` node exists yet) threaded through `StartTriggerWizard` → `EventPickerModal`, which gates every existing close path (Escape/backdrop via `Dialog`'s `onOpenChange`, the Radix `DialogContent` X button, and the wizard's own footer "Cancel" button) and adds two new header actions. `BuilderTopbar` gets a `locked` prop that disables its back-arrow. The two page components (`FlowBuilder.jsx`, `FlowBuilderV2.jsx`) compute `lockdown` from live canvas state, derive the auto-open condition from "no trigger node" instead of "route is /new", and implement the Save Draft / Delete Flow handlers using `createFlow`/`deleteFlow` from `flowsApi.js`.

**Tech Stack:** React, Zustand (`useFlowBuilderStore`), React Router, TanStack Query, Radix Dialog (`@/components/ui/dialog`), Jest + React Testing Library.

## Global Constraints

- Lockdown applies ONLY when there is no `start-trigger` node yet on the canvas. Editing an already-configured trigger (pencil icon) keeps today's normal close/cancel behavior — no `lockdown` prop passed (defaults to `false`), zero behavior change.
- The two builders (`FlowBuilder.jsx` / v1, `FlowBuilderV2.jsx` / v2) get identical treatment; v1's basePath is `/flows`, v2's is `/flows-v2`.
- New props default to values that preserve current behavior, so existing tests for `StartTriggerWizard`, `EventPickerModal`, and `BuilderTopbar` must keep passing unmodified.
- No API/schema changes — `createFlow`/`deleteFlow` in `src/lib/flowsApi.js` already exist and are reused as-is.

---

## Task 1: `StartTriggerWizard` lockdown support

**Files:**
- Modify: `src/components/flows/builder/trigger/StartTriggerWizard.jsx`
- Test: `src/components/flows/builder/trigger/__tests__/StartTriggerWizard.lockdown.test.jsx`

**Interfaces:**
- Consumes: nothing new from other tasks.
- Produces: `StartTriggerWizard` accepts three new optional props — `lockdown` (bool, default `false`), `onSaveDraft` (fn, called with no args), `onDeleteFlow` (fn, called with no args). When `lockdown` is `true`: `data-testid="trigger-wizard-save-draft"` and `data-testid="trigger-wizard-delete-flow"` buttons render in the header; the Radix close X (rendered by `DialogContent`) is hidden; Escape/backdrop-click no-ops; the footer "Cancel" button (visible on the `step1`/`broadcast`/`broadcast-source-1` stages) does not render. Task 2 (`EventPickerModal`) consumes the same three props, forwarded unchanged from the `stage === "picker"` render branch.

- [ ] **Step 1: Write the failing test for the Dialog-level guard and header buttons**

Create `src/components/flows/builder/trigger/__tests__/StartTriggerWizard.lockdown.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StartTriggerWizard from "../StartTriggerWizard";

function pickAnyEventTrigger() {
  fireEvent.click(screen.getByTestId("event-picker-header-Ecommerce"));
  fireEvent.click(screen.getByTestId("event-picker-card-Order placed"));
}

describe("StartTriggerWizard — lockdown mode", () => {
  it("shows Save draft and Delete flow instead of a close button when locked", () => {
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
    expect(screen.getByTestId("trigger-wizard-save-draft")).toBeInTheDocument();
    expect(screen.getByTestId("trigger-wizard-delete-flow")).toBeInTheDocument();
  });

  it("calls onSaveDraft / onDeleteFlow when their buttons are clicked", () => {
    const onSaveDraft = jest.fn();
    const onDeleteFlow = jest.fn();
    render(
      <StartTriggerWizard
        open
        initialConfig={null}
        lockdown
        onClose={() => {}}
        onComplete={() => {}}
        onSaveDraft={onSaveDraft}
        onDeleteFlow={onDeleteFlow}
      />,
    );
    fireEvent.click(screen.getByTestId("trigger-wizard-save-draft"));
    expect(onSaveDraft).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("trigger-wizard-delete-flow"));
    expect(onDeleteFlow).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose on Escape when locked", () => {
    const onClose = jest.fn();
    render(
      <StartTriggerWizard
        open
        initialConfig={null}
        lockdown
        onClose={onClose}
        onComplete={() => {}}
        onSaveDraft={() => {}}
        onDeleteFlow={() => {}}
      />,
    );
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

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

  it("renders the normal close button and Cancel when lockdown is false (editing)", () => {
    render(
      <StartTriggerWizard
        open
        initialConfig={null}
        onClose={() => {}}
        onComplete={() => {}}
      />,
    );
    expect(screen.queryByTestId("trigger-wizard-save-draft")).not.toBeInTheDocument();
    expect(screen.queryByTestId("trigger-wizard-delete-flow")).not.toBeInTheDocument();
    pickAnyEventTrigger();
    expect(screen.getByTestId("trigger-wizard-back")).toHaveTextContent("Cancel");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx craco test StartTriggerWizard.lockdown --watchAll=false`
Expected: FAIL — `trigger-wizard-save-draft` / `trigger-wizard-delete-flow` not found (props don't exist yet), and the Escape test fails because `onClose` IS called today.

- [ ] **Step 3: Add the props and gate the Dialog / DialogContent**

In `src/components/flows/builder/trigger/StartTriggerWizard.jsx`, update the function signature (around line 67):

```jsx
export default function StartTriggerWizard({
  open,
  initialConfig,
  onClose,
  onComplete,
  lockdown = false,
  onSaveDraft,
  onDeleteFlow,
}) {
```

Update the picker-stage early return (around line 328) to forward the new props:

```jsx
  // The picker modal is its own Dialog (own backdrop) when opened standalone.
  if (stage === "picker") {
    return (
      <EventPickerModal
        open={open}
        onClose={onClose}
        onPick={onPickEvent}
        lockdown={lockdown}
        onSaveDraft={onSaveDraft}
        onDeleteFlow={onDeleteFlow}
      />
    );
  }
```

Update the shared Dialog (around line 354) to stop closing on Escape/backdrop when locked, and hide the Radix X button:

```jsx
      <Dialog open={open} onOpenChange={(o) => { if (!o && !lockdown) onClose(); }}>
        <DialogContent
          className="max-w-3xl p-0 max-h-[92vh] flex flex-col overflow-hidden"
          data-testid="trigger-wizard"
          hideCloseButton={lockdown}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
```

- [ ] **Step 4: Add the header Save draft / Delete flow actions**

Replace the header block (around line 362):

```jsx
          <header className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-base font-semibold text-text-primary">
                Configure trigger
              </div>
              <div className="text-[12px] text-text-muted hidden sm:block">
                {stepperLabel}
              </div>
            </div>
            {lockdown && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onSaveDraft}
                  data-testid="trigger-wizard-save-draft"
                  className="px-2.5 py-1.5 text-[12px] font-medium text-text-secondary hover:text-text-primary rounded-md hover:bg-slate-100"
                >
                  Save draft
                </button>
                <button
                  type="button"
                  onClick={onDeleteFlow}
                  data-testid="trigger-wizard-delete-flow"
                  className="px-2.5 py-1.5 text-[12px] font-medium text-rose-600 hover:text-rose-700 rounded-md hover:bg-rose-50"
                >
                  Delete flow
                </button>
              </div>
            )}
          </header>
```

- [ ] **Step 5: Hide the footer Cancel button when locked**

Replace the footer back/cancel button (around line 468):

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

Note the surrounding `<footer>` uses `justify-between`; when this button doesn't render, the `<div className="flex items-center gap-2">` (Next/Finish buttons) will sit alone — that's fine since `justify-between` degrades gracefully with one child, no other markup change needed.

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx craco test StartTriggerWizard.lockdown --watchAll=false`
Expected: PASS — all 6 cases green.

- [ ] **Step 7: Run the full existing StartTriggerWizard test suite to confirm no regressions**

Run: `npx craco test StartTriggerWizard --watchAll=false`
Expected: PASS — `StartTriggerWizard.dateTime.test.jsx`, `StartTriggerWizard.googleSheet.test.jsx`, `StartTriggerWizard.webhook.test.jsx` all still pass unchanged (they never pass `lockdown`, so it defaults to `false` and behavior is identical to before).

- [ ] **Step 8: Commit**

```bash
git add src/components/flows/builder/trigger/StartTriggerWizard.jsx src/components/flows/builder/trigger/__tests__/StartTriggerWizard.lockdown.test.jsx
git commit -m "feat: add lockdown mode to StartTriggerWizard for first-time trigger setup"
```

---

## Task 2: `EventPickerModal` lockdown support

**Files:**
- Modify: `src/components/flows/builder/trigger/EventPickerModal.jsx`
- Test: `src/components/flows/builder/trigger/__tests__/EventPickerModal.lockdown.test.jsx`

**Interfaces:**
- Consumes: nothing from Task 1's internals — this is the sibling component `StartTriggerWizard` renders during the `"picker"` stage (Task 1, Step 3 already forwards `lockdown`/`onSaveDraft`/`onDeleteFlow` to it).
- Produces: `EventPickerModal` accepts the same three optional props (`lockdown` default `false`, `onSaveDraft`, `onDeleteFlow`) with the same `data-testid`s (`trigger-wizard-save-draft`, `trigger-wizard-delete-flow`) so Task 1's own tests (which pick a trigger, moving off the picker stage) and any picker-stage-specific test use consistent selectors.

- [ ] **Step 1: Write the failing test**

Create `src/components/flows/builder/trigger/__tests__/EventPickerModal.lockdown.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import EventPickerModal from "../EventPickerModal";

describe("EventPickerModal — lockdown mode", () => {
  it("shows Save draft and Delete flow instead of a close button when locked", () => {
    render(
      <EventPickerModal
        open
        onClose={() => {}}
        onPick={() => {}}
        lockdown
        onSaveDraft={() => {}}
        onDeleteFlow={() => {}}
      />,
    );
    expect(screen.getByTestId("trigger-wizard-save-draft")).toBeInTheDocument();
    expect(screen.getByTestId("trigger-wizard-delete-flow")).toBeInTheDocument();
  });

  it("does not call onClose on Escape when locked", () => {
    const onClose = jest.fn();
    render(
      <EventPickerModal
        open
        onClose={onClose}
        onPick={() => {}}
        lockdown
        onSaveDraft={() => {}}
        onDeleteFlow={() => {}}
      />,
    );
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders no Save draft/Delete flow buttons when lockdown is false", () => {
    render(<EventPickerModal open onClose={() => {}} onPick={() => {}} />);
    expect(screen.queryByTestId("trigger-wizard-save-draft")).not.toBeInTheDocument();
    expect(screen.queryByTestId("trigger-wizard-delete-flow")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx craco test EventPickerModal.lockdown --watchAll=false`
Expected: FAIL — buttons not found, Escape still calls `onClose`.

- [ ] **Step 3: Add the props and gate the Dialog**

In `src/components/flows/builder/trigger/EventPickerModal.jsx`, update the signature (line 8):

```jsx
export default function EventPickerModal({
  open,
  onClose,
  onPick,
  lockdown = false,
  onSaveDraft,
  onDeleteFlow,
}) {
```

Update the Dialog (around line 63):

```jsx
    <Dialog open={open} onOpenChange={(o) => { if (!o && !lockdown) onClose(); }}>
      <DialogContent
        className="max-w-4xl p-0 max-h-[90vh] flex flex-col overflow-hidden"
        data-testid="event-picker-modal"
        hideCloseButton={lockdown}
      >
```

- [ ] **Step 4: Add the header Save draft / Delete flow actions**

Replace the header block (around line 69):

```jsx
        <header className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-base font-semibold text-text-primary">
              Select Start Trigger
            </div>
            <div className="text-[12px] text-text-muted">
              Choose the event that will start this flow.
            </div>
          </div>
          {lockdown && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onSaveDraft}
                data-testid="trigger-wizard-save-draft"
                className="px-2.5 py-1.5 text-[12px] font-medium text-text-secondary hover:text-text-primary rounded-md hover:bg-slate-100"
              >
                Save draft
              </button>
              <button
                type="button"
                onClick={onDeleteFlow}
                data-testid="trigger-wizard-delete-flow"
                className="px-2.5 py-1.5 text-[12px] font-medium text-rose-600 hover:text-rose-700 rounded-md hover:bg-rose-50"
              >
                Delete flow
              </button>
            </div>
          )}
        </header>
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx craco test EventPickerModal.lockdown --watchAll=false`
Expected: PASS.

- [ ] **Step 6: Re-run Task 1's suite to confirm the picker-stage lockdown tests still pass end-to-end**

Run: `npx craco test StartTriggerWizard --watchAll=false`
Expected: PASS — no change, since Task 1 already forwards the props correctly.

- [ ] **Step 7: Commit**

```bash
git add src/components/flows/builder/trigger/EventPickerModal.jsx src/components/flows/builder/trigger/__tests__/EventPickerModal.lockdown.test.jsx
git commit -m "feat: add lockdown mode to EventPickerModal for first-time trigger setup"
```

---

## Task 3: `BuilderTopbar` locked back-arrow

**Files:**
- Modify: `src/components/flows/builder/BuilderTopbar.jsx`
- Test: `src/components/flows/builder/__tests__/BuilderTopbar.test.jsx`

**Interfaces:**
- Consumes: nothing from Tasks 1–2.
- Produces: `BuilderTopbar` accepts a new optional prop `locked` (bool, default `false`). When `true`, the back-arrow button (`data-testid="builder-back"`) is `disabled` and its `onClick` is a no-op — `navigate` is never called.

- [ ] **Step 1: Write the failing test**

Add to `src/components/flows/builder/__tests__/BuilderTopbar.test.jsx` (append inside the existing `describe` block, reusing the file's existing `renderTopbar` helper and `jest.mock("react-router-dom", ...)` — note that mock returns a fixed `jest.fn()` from `useNavigate()`, so capture it once to assert against):

First, change the top of the file so the mocked navigate fn is capturable — replace:

```jsx
jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
  MemoryRouter: ({ children }) => children,
}), { virtual: true });
```

with:

```jsx
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  MemoryRouter: ({ children }) => children,
}), { virtual: true });
```

and add `mockNavigate.mockClear();` as the first line of `renderTopbar`:

```jsx
function renderTopbar(metaOverrides = {}) {
  mockNavigate.mockClear();
  useFlowBuilderStore.setState({
```

Then add a new function accepting props and new test cases at the end of the file (before the final `});`):

```jsx
function renderTopbarWithProps(props = {}) {
  mockNavigate.mockClear();
  useFlowBuilderStore.setState({
    flowId: "flow-1",
    meta: { name: "Diwali Sale Flow", status: "active" },
    nodes: [],
    edges: [],
    autosaveStatus: "idle",
  });
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <BuilderTopbar {...props} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("BuilderTopbar — locked mode", () => {
  it("disables the back button and does not navigate when locked", () => {
    renderTopbarWithProps({ locked: true });
    const backButton = screen.getByTestId("builder-back");
    expect(backButton).toBeDisabled();
    fireEvent.click(backButton);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("navigates on back-button click when not locked", () => {
    renderTopbarWithProps({ locked: false });
    fireEvent.click(screen.getByTestId("builder-back"));
    expect(mockNavigate).toHaveBeenCalledWith("/flows");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx craco test BuilderTopbar --watchAll=false`
Expected: FAIL — the back button is not disabled and `mockNavigate` was called even with `locked: true` (prop doesn't exist yet).

- [ ] **Step 3: Add the `locked` prop**

In `src/components/flows/builder/BuilderTopbar.jsx`, update the signature (line 279):

```jsx
export default function BuilderTopbar({ basePath = "/flows", locked = false }) {
```

Update the back button (around line 457):

```jsx
          <button
            type="button"
            data-testid="builder-back"
            onClick={() => { if (!locked) navigate(basePath); }}
            disabled={locked}
            className={`p-1.5 rounded-md transition-colors flex-shrink-0 ${
              locked
                ? "text-slate-300 cursor-not-allowed"
                : "hover:bg-slate-100 text-text-muted hover:text-text-primary"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx craco test BuilderTopbar --watchAll=false`
Expected: PASS — all cases including the pre-existing ones (unaffected since `locked` defaults to `false`).

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/BuilderTopbar.jsx src/components/flows/builder/__tests__/BuilderTopbar.test.jsx
git commit -m "feat: add locked prop to BuilderTopbar to disable back navigation during lockdown"
```

---

## Task 4: Wire lockdown into `FlowBuilder.jsx` (v1)

**Files:**
- Modify: `src/pages/FlowBuilder.jsx`
- Test: `src/pages/__tests__/FlowBuilder.lockdown.test.jsx`

**Interfaces:**
- Consumes: `StartTriggerWizard`'s `lockdown`/`onSaveDraft`/`onDeleteFlow` props (Task 1), `BuilderTopbar`'s `locked` prop (Task 3), `createFlow`/`deleteFlow` from `src/lib/flowsApi.js` (existing, unmodified).
- Produces: nothing consumed by later tasks — Task 5 mirrors this task's logic in `FlowBuilderV2.jsx` independently.

- [ ] **Step 1: Write the failing test**

Create `src/pages/__tests__/FlowBuilder.lockdown.test.jsx`. This mocks every heavy child (`Canvas`, `NodePalette`, `RightPanel`, `reactflow`, `AiCallingGlobalWizard`, `AiChatbotGlobalWizard`) so the test isolates the new wiring: the auto-open condition, `lockdown` derivation, and the Save Draft / Delete Flow handlers. `StartTriggerWizard` and `BuilderTopbar` are mocked to thin stand-ins that expose the props under test via `data-testid` buttons/attributes.

```jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";

const mockNavigate = jest.fn();
let mockParams = { id: "new" };
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}), { virtual: true });

jest.mock("reactflow", () => ({
  ReactFlowProvider: ({ children }) => <div>{children}</div>,
}), { virtual: true });

jest.mock("@/components/flows/builder/Canvas", () => () => <div data-testid="canvas" />);
jest.mock("@/components/flows/builder/NodePalette", () => () => <div data-testid="node-palette" />);
jest.mock("@/components/flows/builder/RightPanel", () => () => <div data-testid="right-panel" />);
jest.mock("@/components/flows/builder/nodes/AiCallingNode/AiCallingGlobalWizard", () => () => null);
jest.mock("@/components/flows/builder/nodes/AiChatbotNode/AiChatbotGlobalWizard", () => () => null);

jest.mock("@/components/flows/builder/BuilderTopbar", () => (props) => (
  <div data-testid="topbar" data-locked={String(!!props.locked)} />
));

jest.mock("@/components/flows/builder/trigger/StartTriggerWizard", () => (props) => (
  props.open ? (
    <div data-testid="wizard" data-lockdown={String(!!props.lockdown)}>
      <button data-testid="wizard-save-draft" onClick={props.onSaveDraft}>Save draft</button>
      <button data-testid="wizard-delete-flow" onClick={props.onDeleteFlow}>Delete flow</button>
    </div>
  ) : null
));

jest.mock("@/lib/flowsApi", () => ({
  createFlow: jest.fn(() => Promise.resolve({ id: "flow-99" })),
  fetchFlow: jest.fn(() => Promise.resolve(null)),
  updateFlow: jest.fn(() => Promise.resolve({})),
  deleteFlow: jest.fn(() => Promise.resolve({})),
}));

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

import FlowBuilder from "../FlowBuilder";
import { createFlow, deleteFlow } from "@/lib/flowsApi";

function renderBuilder() {
  mockNavigate.mockClear();
  createFlow.mockClear();
  deleteFlow.mockClear();
  useFlowBuilderStore.getState().reset();
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <FlowBuilder />
    </QueryClientProvider>
  );
}

describe("FlowBuilder — start-trigger lockdown wiring", () => {
  beforeEach(() => {
    mockParams = { id: "new" };
  });

  it("opens the wizard in lockdown mode and locks the topbar for a new flow with no nodes", () => {
    renderBuilder();
    expect(screen.getByTestId("wizard")).toHaveAttribute("data-lockdown", "true");
    expect(screen.getByTestId("topbar")).toHaveAttribute("data-locked", "true");
  });

  it("Save draft creates a flow and navigates to the flows list when no flow exists yet", async () => {
    renderBuilder();
    fireEvent.click(screen.getByTestId("wizard-save-draft"));
    await waitFor(() => expect(createFlow).toHaveBeenCalledWith({
      name: "Untitled flow",
      nodes: [],
      edges: [],
    }));
    expect(mockNavigate).toHaveBeenCalledWith("/flows");
  });

  it("Delete flow navigates to the flows list without calling deleteFlow when no flow exists yet", () => {
    renderBuilder();
    fireEvent.click(screen.getByTestId("wizard-delete-flow"));
    expect(deleteFlow).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/flows");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx craco test FlowBuilder.lockdown --watchAll=false`
Expected: FAIL — `StartTriggerWizard` mock never receives a `lockdown` prop, `BuilderTopbar` mock never receives `locked`, and there are no `onSaveDraft`/`onDeleteFlow` handlers yet.

- [ ] **Step 3: Add imports and derive `hasTriggerNode` / `lockdown`**

In `src/pages/FlowBuilder.jsx`, add `deleteFlow` to the existing `flowsApi` import (line 5):

```jsx
import {
  createFlow,
  fetchFlow,
  updateFlow,
  deleteFlow,
} from "@/lib/flowsApi";
```

Replace the `isNew`/`triggerModalOpen`/`triggerConfigured` block (lines 28–34):

```jsx
  const isNew = !id || id === "new";
  const [triggerModalOpen, setTriggerModalOpen] = useState(isNew);
  const [aiCallingWizardOpen,  setAiCallingWizardOpen]  = useState(false);
  const [aiChatbotWizardOpen,  setAiChatbotWizardOpen]  = useState(false);
```

(the `triggerConfigured` ref is removed — it's no longer needed once `onClose` stops depending on it, see Step 5).

- [ ] **Step 4: Force the wizard open when a loaded flow has no trigger node**

Update the hydrate effect (around line 70):

```jsx
  const hydratedIdRef = useRef(null);
  useEffect(() => {
    if (serverFlow && hydratedIdRef.current !== serverFlow.id) {
      hydratedIdRef.current = serverFlow.id;
      hydrate(serverFlow);
      const hasTrigger = (serverFlow.nodes || []).some((n) => n.id === "start-trigger-node");
      if (!hasTrigger) setTriggerModalOpen(true);
    }
  }, [serverFlow, hydrate]);
```

- [ ] **Step 5: Derive `lockdown`, add Save Draft / Delete Flow handlers, simplify `onClose`**

The line `const existingTriggerConfig = nodes?.find((n) => n.id === "start-trigger-node")?.data?.config ?? null;` already exists (around line 146) — keep it, and add right after it:

```jsx
  const lockdown = !existingTriggerConfig;

  const handleSaveDraft = useCallback(async () => {
    setTriggerModalOpen(false);
    if (!flowId) {
      await createFlow({ name: "Untitled flow", nodes: [], edges: [] });
    }
    navigate("/flows");
  }, [flowId, navigate]);

  const handleDeleteFlow = useCallback(async () => {
    setTriggerModalOpen(false);
    if (flowId) {
      await deleteFlow(flowId);
    }
    navigate("/flows");
  }, [flowId, navigate]);
```

Update `handleTriggerComplete` (around line 179) to drop the now-removed ref:

```jsx
  const handleTriggerComplete = useCallback(
    (config) => {
      setTriggerModalOpen(false);
      placeTriggerNode(config);
      toast.success("Trigger configured");
    },
    [placeTriggerNode],
  );
```

- [ ] **Step 6: Pass the new props to `BuilderTopbar` and `StartTriggerWizard`**

Update the render (around line 285 and 298):

```jsx
        <BuilderTopbar locked={triggerModalOpen && lockdown} />
```

```jsx
      <StartTriggerWizard
        open={triggerModalOpen}
        initialConfig={existingTriggerConfig}
        lockdown={lockdown}
        onClose={() => setTriggerModalOpen(false)}
        onComplete={handleTriggerComplete}
        onSaveDraft={handleSaveDraft}
        onDeleteFlow={handleDeleteFlow}
      />
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx craco test FlowBuilder.lockdown --watchAll=false`
Expected: PASS — all 3 cases green.

- [ ] **Step 8: Run the full test suite to confirm no regressions**

Run: `npx craco test --watchAll=false`
Expected: PASS — every existing suite (StartTriggerWizard variants, BuilderTopbar, node tests, etc.) still green.

- [ ] **Step 9: Commit**

```bash
git add src/pages/FlowBuilder.jsx src/pages/__tests__/FlowBuilder.lockdown.test.jsx
git commit -m "feat: lock start-trigger wizard until configured in FlowBuilder (v1)"
```

---

## Task 5: Wire lockdown into `FlowBuilderV2.jsx` (v2)

**Files:**
- Modify: `src/pages/FlowBuilderV2.jsx`
- Test: `src/pages/__tests__/FlowBuilderV2.lockdown.test.jsx`

**Interfaces:**
- Consumes: same as Task 4 (`StartTriggerWizard`, `BuilderTopbar`, `flowsApi`), applied independently to the v2 page. No dependency on Task 4's code changes (only its proven pattern).
- Produces: nothing consumed elsewhere — this is the last task.

- [ ] **Step 1: Write the failing test**

Create `src/pages/__tests__/FlowBuilderV2.lockdown.test.jsx` — identical structure to Task 4's test, with these differences: import `FlowBuilderV2` from `"../FlowBuilderV2"`, and expect `mockNavigate` to have been called with `"/flows-v2"` instead of `"/flows"`.

```jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";

const mockNavigate = jest.fn();
let mockParams = { id: "new" };
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}), { virtual: true });

jest.mock("reactflow", () => ({
  ReactFlowProvider: ({ children }) => <div>{children}</div>,
}), { virtual: true });

jest.mock("@/components/flows/builder/Canvas", () => () => <div data-testid="canvas" />);
jest.mock("@/components/flows/builder/NodePalette", () => () => <div data-testid="node-palette" />);
jest.mock("@/components/flows/builder/RightPanel", () => () => <div data-testid="right-panel" />);
jest.mock("@/components/flows/builder/nodes/AiCallingNode/AiCallingGlobalWizard", () => () => null);
jest.mock("@/components/flows/builder/nodes/AiChatbotNode/AiChatbotGlobalWizard", () => () => null);

jest.mock("@/components/flows/builder/BuilderTopbar", () => (props) => (
  <div data-testid="topbar" data-locked={String(!!props.locked)} />
));

jest.mock("@/components/flows/builder/trigger/StartTriggerWizard", () => (props) => (
  props.open ? (
    <div data-testid="wizard" data-lockdown={String(!!props.lockdown)}>
      <button data-testid="wizard-save-draft" onClick={props.onSaveDraft}>Save draft</button>
      <button data-testid="wizard-delete-flow" onClick={props.onDeleteFlow}>Delete flow</button>
    </div>
  ) : null
));

jest.mock("@/lib/flowsApi", () => ({
  createFlow: jest.fn(() => Promise.resolve({ id: "flow-99" })),
  fetchFlow: jest.fn(() => Promise.resolve(null)),
  updateFlow: jest.fn(() => Promise.resolve({})),
  deleteFlow: jest.fn(() => Promise.resolve({})),
}));

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

import FlowBuilderV2 from "../FlowBuilderV2";
import { createFlow, deleteFlow } from "@/lib/flowsApi";

function renderBuilder() {
  mockNavigate.mockClear();
  createFlow.mockClear();
  deleteFlow.mockClear();
  useFlowBuilderStore.getState().reset();
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <FlowBuilderV2 />
    </QueryClientProvider>
  );
}

describe("FlowBuilderV2 — start-trigger lockdown wiring", () => {
  beforeEach(() => {
    mockParams = { id: "new" };
  });

  it("opens the wizard in lockdown mode and locks the topbar for a new flow with no nodes", () => {
    renderBuilder();
    expect(screen.getByTestId("wizard")).toHaveAttribute("data-lockdown", "true");
    expect(screen.getByTestId("topbar")).toHaveAttribute("data-locked", "true");
  });

  it("Save draft creates a flow and navigates to the v2 flows list when no flow exists yet", async () => {
    renderBuilder();
    fireEvent.click(screen.getByTestId("wizard-save-draft"));
    await waitFor(() => expect(createFlow).toHaveBeenCalledWith({
      name: "Untitled flow",
      nodes: [],
      edges: [],
    }));
    expect(mockNavigate).toHaveBeenCalledWith("/flows-v2");
  });

  it("Delete flow navigates to the v2 flows list without calling deleteFlow when no flow exists yet", () => {
    renderBuilder();
    fireEvent.click(screen.getByTestId("wizard-delete-flow"));
    expect(deleteFlow).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/flows-v2");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx craco test FlowBuilderV2.lockdown --watchAll=false`
Expected: FAIL — same reasons as Task 4, Step 2.

- [ ] **Step 3: Add imports and derive `hasTriggerNode` / `lockdown`**

In `src/pages/FlowBuilderV2.jsx`, add `deleteFlow` to the existing `flowsApi` import (line 5):

```jsx
import {
  createFlow,
  fetchFlow,
  updateFlow,
  deleteFlow,
} from "@/lib/flowsApi";
```

Replace the `isNew`/`triggerModalOpen`/`triggerConfigured` block (lines 61–67):

```jsx
  const isNew = !id || id === "new";
  const [triggerModalOpen, setTriggerModalOpen] = useState(isNew);
  const [aiCallingWizardOpen,  setAiCallingWizardOpen]  = useState(false);
  const [aiChatbotWizardOpen,  setAiChatbotWizardOpen]  = useState(false);
```

- [ ] **Step 4: Force the wizard open when a loaded flow has no trigger node**

Update the hydrate effect (around line 103):

```jsx
  const hydratedIdRef = useRef(null);
  useEffect(() => {
    if (serverFlow && hydratedIdRef.current !== serverFlow.id) {
      hydratedIdRef.current = serverFlow.id;
      hydrate(serverFlow);
      const hasTrigger = (serverFlow.nodes || []).some((n) => n.id === "start-trigger-node");
      if (!hasTrigger) setTriggerModalOpen(true);
    }
  }, [serverFlow, hydrate]);
```

- [ ] **Step 5: Derive `lockdown`, add Save Draft / Delete Flow handlers, simplify `onClose`**

The line `const existingTriggerConfig = nodes?.find((n) => n.id === "start-trigger-node")?.data?.config ?? null;` already exists (around line 179) — keep it, and add right after it:

```jsx
  const lockdown = !existingTriggerConfig;

  const handleSaveDraft = useCallback(async () => {
    setTriggerModalOpen(false);
    if (!flowId) {
      await createFlow({ name: "Untitled flow", nodes: [], edges: [] });
    }
    navigate("/flows-v2");
  }, [flowId, navigate]);

  const handleDeleteFlow = useCallback(async () => {
    setTriggerModalOpen(false);
    if (flowId) {
      await deleteFlow(flowId);
    }
    navigate("/flows-v2");
  }, [flowId, navigate]);
```

Update `handleTriggerComplete` (around line 212):

```jsx
  const handleTriggerComplete = useCallback(
    (config) => {
      setTriggerModalOpen(false);
      placeTriggerNode(config);
      toast.success("Trigger configured");
    },
    [placeTriggerNode],
  );
```

- [ ] **Step 6: Pass the new props to `BuilderTopbar` and `StartTriggerWizard`**

Update the render (around line 328 and 341):

```jsx
        <BuilderTopbar basePath="/flows-v2" locked={triggerModalOpen && lockdown} />
```

```jsx
      <StartTriggerWizard
        open={triggerModalOpen}
        initialConfig={existingTriggerConfig}
        lockdown={lockdown}
        onClose={() => setTriggerModalOpen(false)}
        onComplete={handleTriggerComplete}
        onSaveDraft={handleSaveDraft}
        onDeleteFlow={handleDeleteFlow}
      />
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx craco test FlowBuilderV2.lockdown --watchAll=false`
Expected: PASS — all 3 cases green.

- [ ] **Step 8: Run the full test suite to confirm no regressions**

Run: `npx craco test --watchAll=false`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/pages/FlowBuilderV2.jsx src/pages/__tests__/FlowBuilderV2.lockdown.test.jsx
git commit -m "feat: lock start-trigger wizard until configured in FlowBuilderV2"
```

---

## Manual verification (both builders)

After all tasks land, verify end-to-end in the browser for both `/flows/builder/new` and `/flows-v2/builder/new`:

1. Open a new flow — the trigger wizard opens, there is no X button, Escape does nothing, clicking outside the modal does nothing, and the topbar's back-arrow is greyed out and unclickable.
2. Click "Save draft" — you land on the flows list, and a new "Untitled flow" draft appears.
3. Re-open that draft from the flows list — the trigger wizard force-opens again in lockdown mode (still no trigger configured).
4. Open a new flow again, click "Delete flow" — you land on the flows list, no new draft was created.
5. Configure a trigger fully (Finish) — the wizard closes, the trigger node appears on canvas, topbar back-arrow works normally.
6. Click the pencil icon on the configured trigger node to edit it — the wizard opens WITHOUT lockdown: X button is present, Escape/backdrop-click closes it, footer says "Cancel" on step 1.
