# Flow Builder Header Checklist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `BuilderTopbar.jsx` (shared by `FlowBuilder.jsx` v1 and `FlowBuilderV2.jsx` v2) to visually represent every item in the header checklist spec, with no new backend wiring — new interactive elements either reuse existing data/logic or show a `toast.info(...)` stub, matching the pattern already used for Preview and Download Report.

**Architecture:** All new pieces are added as small named-export function components inside the existing `src/components/flows/builder/BuilderTopbar.jsx` file, following the file's existing convention (`StatusBadge`, `ActiveToggle`, `SaveIndicator`, `MoreMenu` are already defined this way in the same file). A new reusable `TopbarIconButton` wraps the existing `Tooltip`/`TooltipTrigger`/`TooltipContent` primitives from `src/components/ui/tooltip.jsx` so every icon-only action gets a hover label consistently. The final task wires all pieces into the header's returned JSX in the order specified by the design spec.

**Tech Stack:** React, Tailwind CSS, lucide-react icons, Radix-based `Tooltip` (`@/components/ui/tooltip`), `@tanstack/react-query`, Zustand (`useFlowBuilderStore`), `sonner` toasts, Jest + `@testing-library/react` (run via `craco test`).

## Global Constraints

- No new backend fields, API calls, or status-transition logic — per spec, this pass is visual representation only.
- Any new clickable element that has no real behavior yet must show `toast.info("<Label> coming soon")`, matching the existing `handlePreview` / `handleDownloadReport` stub pattern in `BuilderTopbar.jsx`.
- Icon-only actions (Undo, Redo, Version History, View Analytics, View all Customer Chat, Test Mode, Preview) must use the shared `TopbarIconButton` so tooltips are consistent — no ad hoc `title=` attributes for these.
- Text stays visible (no tooltip-only) for: Flow Name, Flow Tag, Status Badge, Save indicator, Live/Inactive toggle — per spec.
- "Has been live" gating (Version History, View all Customer Chat, View Analytics) is computed as `status !== "draft"` — no new field, reuses existing `meta.status`.
- Follow existing file conventions: Tailwind utility classes, `data-testid` on every interactive element, named exports for anything gaining a dedicated test.

---

### Task 1: Extend status config to all 11 states

**Files:**
- Modify: `src/components/flows/builder/BuilderTopbar.jsx:26-43` (the `STATUS_CONFIG` object and `StatusBadge` function)
- Test: `src/components/flows/builder/__tests__/StatusBadge.test.jsx`

**Interfaces:**
- Produces: `export const STATUS_CONFIG` (object keyed by status string → `{ label, bg, text, dot }`), `export function StatusBadge({ status })`.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/flows/builder/__tests__/StatusBadge.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { StatusBadge, STATUS_CONFIG } from "../BuilderTopbar";

describe("StatusBadge", () => {
  it("renders a label for every status in STATUS_CONFIG", () => {
    Object.keys(STATUS_CONFIG).forEach((status) => {
      const { unmount } = render(<StatusBadge status={status} />);
      expect(screen.getByText(STATUS_CONFIG[status].label)).toBeInTheDocument();
      unmount();
    });
  });

  it("covers all 11 required statuses", () => {
    const required = [
      "draft", "active", "archived", "test", "paused", "completed",
      "scheduled", "rerun_completed", "dnd", "error", "inprogress",
    ];
    required.forEach((key) => expect(STATUS_CONFIG).toHaveProperty(key));
  });

  it("labels the active status as Live", () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("falls back to the draft config for an unknown status", () => {
    render(<StatusBadge status="not-a-real-status" />);
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test src/components/flows/builder/__tests__/StatusBadge.test.jsx --watchAll=false`
Expected: FAIL — `STATUS_CONFIG` and `StatusBadge` are not exported yet (import error / undefined).

- [ ] **Step 3: Update `STATUS_CONFIG` and export it and `StatusBadge`**

Replace the block at `BuilderTopbar.jsx:26-43`:

```jsx
// ── Status config ────────────────────────────────────────────────────────────
export const STATUS_CONFIG = {
  draft:            { label: "Draft",           bg: "bg-slate-100", text: "text-slate-600",  dot: "bg-slate-400"  },
  active:           { label: "Live",             bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  paused:           { label: "Paused",           bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400"  },
  archived:         { label: "Archive",          bg: "bg-slate-100", text: "text-slate-500",  dot: "bg-slate-300"  },
  test:             { label: "Test",             bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500" },
  completed:        { label: "Completed",        bg: "bg-sky-50",    text: "text-sky-700",    dot: "bg-sky-500"    },
  scheduled:        { label: "Scheduled",        bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
  rerun_completed:  { label: "Rerun Completed",  bg: "bg-teal-50",   text: "text-teal-700",   dot: "bg-teal-500"   },
  dnd:               { label: "DND",              bg: "bg-rose-50",   text: "text-rose-700",   dot: "bg-rose-500"   },
  error:            { label: "Error",            bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500"    },
  inprogress:       { label: "In Progress",      bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500"   },
};

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test src/components/flows/builder/__tests__/StatusBadge.test.jsx --watchAll=false`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/BuilderTopbar.jsx src/components/flows/builder/__tests__/StatusBadge.test.jsx
git commit -m "feat: extend flow status badge to all 11 statuses"
```

---

### Task 2: Add `FlowTagPill` component

**Files:**
- Modify: `src/components/flows/builder/BuilderTopbar.jsx` (add after `StatusBadge`, add `Tag` and `ChevronDown` to the lucide-react import, add `toast` usage — `toast` is already imported)
- Test: `src/components/flows/builder/__tests__/FlowTagPill.test.jsx`

**Interfaces:**
- Consumes: nothing external.
- Produces: `export const FLOW_TAG_OPTIONS = ["Transactional", "Promotional", "Broadcast", "Retention"]`, `export function FlowTagPill({ tag, onClick })`.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/flows/builder/__tests__/FlowTagPill.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FlowTagPill, FLOW_TAG_OPTIONS } from "../BuilderTopbar";

describe("FlowTagPill", () => {
  it("renders the current tag", () => {
    render(<FlowTagPill tag="Retention" onClick={() => {}} />);
    expect(screen.getByText("Retention")).toBeInTheDocument();
  });

  it("defaults to Promotional when no tag is given", () => {
    render(<FlowTagPill onClick={() => {}} />);
    expect(screen.getByText("Promotional")).toBeInTheDocument();
  });

  it("calls onClick when the pill is clicked", () => {
    const onClick = jest.fn();
    render(<FlowTagPill tag="Broadcast" onClick={onClick} />);
    fireEvent.click(screen.getByTestId("builder-tag-pill"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("exposes all four tag options", () => {
    expect(FLOW_TAG_OPTIONS).toEqual(["Transactional", "Promotional", "Broadcast", "Retention"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test src/components/flows/builder/__tests__/FlowTagPill.test.jsx --watchAll=false`
Expected: FAIL — `FlowTagPill` / `FLOW_TAG_OPTIONS` not exported.

- [ ] **Step 3: Add `Tag` and `ChevronDown` to the lucide-react import, then add the component**

In the `lucide-react` import block near the top of `BuilderTopbar.jsx`, add `Tag` and `ChevronDown`:

```jsx
import {
  ArrowLeft,
  CircleAlert,
  Loader2,
  Play,
  BarChart2,
  Download,
  MoreHorizontal,
  Clock,
  FlaskConical,
  BookMarked,
  Tag,
  ChevronDown,
} from "lucide-react";
```

Add this new component directly below `StatusBadge`:

```jsx
// ── Flow tag pill ────────────────────────────────────────────────────────────
export const FLOW_TAG_OPTIONS = ["Transactional", "Promotional", "Broadcast", "Retention"];

export function FlowTagPill({ tag, onClick }) {
  return (
    <button
      type="button"
      data-testid="builder-tag-pill"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-text-secondary hover:bg-slate-200 transition-colors"
    >
      <Tag className="w-3 h-3" />
      {tag || "Promotional"}
      <ChevronDown className="w-3 h-3" />
    </button>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test src/components/flows/builder/__tests__/FlowTagPill.test.jsx --watchAll=false`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/BuilderTopbar.jsx src/components/flows/builder/__tests__/FlowTagPill.test.jsx
git commit -m "feat: add flow tag pill to builder header"
```

---

### Task 3: Add `WarningBadge` component

**Files:**
- Modify: `src/components/flows/builder/BuilderTopbar.jsx` (add after `FlowTagPill`; add `TriangleAlert` to the lucide-react import)
- Test: `src/components/flows/builder/__tests__/WarningBadge.test.jsx`

**Interfaces:**
- Produces: `export function WarningBadge({ count, onClick })` — renders `null` when `count` is falsy or `<= 0`.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/flows/builder/__tests__/WarningBadge.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { WarningBadge } from "../BuilderTopbar";

describe("WarningBadge", () => {
  it("renders nothing when count is 0", () => {
    const { container } = render(<WarningBadge count={0} onClick={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when count is undefined", () => {
    const { container } = render(<WarningBadge onClick={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the issue count when count is positive", () => {
    render(<WarningBadge count={2} onClick={() => {}} />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = jest.fn();
    render(<WarningBadge count={3} onClick={onClick} />);
    fireEvent.click(screen.getByTestId("builder-warning-badge"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test src/components/flows/builder/__tests__/WarningBadge.test.jsx --watchAll=false`
Expected: FAIL — `WarningBadge` not exported.

- [ ] **Step 3: Add `TriangleAlert` to the import and add the component**

Add `TriangleAlert` to the same lucide-react import block from Task 2:

```jsx
  Tag,
  ChevronDown,
  TriangleAlert,
} from "lucide-react";
```

Add below `FlowTagPill`:

```jsx
// ── Flow warning badge ───────────────────────────────────────────────────────
export function WarningBadge({ count, onClick }) {
  if (!count || count <= 0) return null;
  return (
    <button
      type="button"
      data-testid="builder-warning-badge"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
    >
      <TriangleAlert className="w-3 h-3" />
      {count}
    </button>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test src/components/flows/builder/__tests__/WarningBadge.test.jsx --watchAll=false`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/BuilderTopbar.jsx src/components/flows/builder/__tests__/WarningBadge.test.jsx
git commit -m "feat: add flow warning badge to builder header"
```

---

### Task 4: Extend `SaveIndicator` with the last editor's name

**Files:**
- Modify: `src/components/flows/builder/BuilderTopbar.jsx:64-106` (the `SaveIndicator` function — add `export`, add `lastSavedBy` prop)
- Test: `src/components/flows/builder/__tests__/SaveIndicator.test.jsx`

**Interfaces:**
- Produces: `export function SaveIndicator({ status, lastSavedAt, lastSavedBy })`. When `status === "saved"` (i.e. a `label` was computed) and `lastSavedBy` is provided, renders `"<label> · <lastSavedBy>"`; when `lastSavedBy` is omitted, renders just `<label>` (unchanged from today).

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/flows/builder/__tests__/SaveIndicator.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { SaveIndicator } from "../BuilderTopbar";

describe("SaveIndicator", () => {
  it("shows Saving… while saving, without an author", () => {
    render(<SaveIndicator status="saving" lastSavedBy="Meenal K." />);
    expect(screen.getByText("Saving…")).toBeInTheDocument();
  });

  it("shows Save failed on error, without an author", () => {
    render(<SaveIndicator status="error" lastSavedBy="Meenal K." />);
    expect(screen.getByText("Save failed")).toBeInTheDocument();
  });

  it("appends the author name after the saved-time label", () => {
    render(
      <SaveIndicator status="saved" lastSavedAt={Date.now()} lastSavedBy="Meenal K." />
    );
    expect(screen.getByText("Just saved · Meenal K.")).toBeInTheDocument();
  });

  it("omits the author suffix when lastSavedBy is not provided", () => {
    render(<SaveIndicator status="saved" lastSavedAt={Date.now()} />);
    expect(screen.getByText("Just saved")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test src/components/flows/builder/__tests__/SaveIndicator.test.jsx --watchAll=false`
Expected: FAIL — `SaveIndicator` not exported / author suffix missing.

- [ ] **Step 3: Update `SaveIndicator`**

Replace the block at `BuilderTopbar.jsx:64-106`:

```jsx
// ── Autosave / last-saved indicator ─────────────────────────────────────────
export function SaveIndicator({ status, lastSavedAt, lastSavedBy }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (status === "saving") { setLabel(""); return; }
    if (status === "error")  { setLabel(""); return; }
    if (!lastSavedAt) return;
    function compute() {
      const diff = Math.round((Date.now() - lastSavedAt) / 1000);
      if (diff < 5)   return "Just saved";
      if (diff < 60)  return `Saved ${diff}s ago`;
      const mins = Math.round(diff / 60);
      if (mins < 60)  return `Saved ${mins}m ago`;
      const hrs  = Math.round(mins / 60);
      if (hrs < 24)   return `Saved ${hrs}h ago`;
      return `Saved ${Math.round(hrs / 24)}d ago`;
    }
    setLabel(compute());
    const id = setInterval(() => setLabel(compute()), 30_000);
    return () => clearInterval(id);
  }, [status, lastSavedAt]);

  if (status === "saving")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
        <Loader2 className="w-3 h-3 animate-spin" /> Saving…
      </span>
    );
  if (status === "error")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-rose-500">
        <CircleAlert className="w-3 h-3" /> Save failed
      </span>
    );
  if (label)
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
        <Clock className="w-3 h-3" /> {label}{lastSavedBy ? ` · ${lastSavedBy}` : ""}
      </span>
    );
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test src/components/flows/builder/__tests__/SaveIndicator.test.jsx --watchAll=false`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/BuilderTopbar.jsx src/components/flows/builder/__tests__/SaveIndicator.test.jsx
git commit -m "feat: show last editor's name in the save indicator"
```

---

### Task 5: Add reusable `TopbarIconButton`

**Files:**
- Modify: `src/components/flows/builder/BuilderTopbar.jsx` (add import for `Tooltip`/`TooltipTrigger`/`TooltipContent`/`TooltipProvider`, add the component after `Divider`)
- Test: `src/components/flows/builder/__tests__/TopbarIconButton.test.jsx`

**Interfaces:**
- Produces: `export function TopbarIconButton({ icon: Icon, label, onClick, disabled, testId })`. Must be rendered inside a `TooltipProvider` by its consumer (matches the existing `TopBar.jsx` pattern) — the component itself renders `Tooltip > TooltipTrigger > button` + `TooltipContent`.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/flows/builder/__tests__/TopbarIconButton.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TopbarIconButton } from "../BuilderTopbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Play } from "lucide-react";

function renderButton(props) {
  return render(
    <TooltipProvider>
      <TopbarIconButton icon={Play} label="Preview Flow" testId="tb-preview" {...props} />
    </TooltipProvider>
  );
}

describe("TopbarIconButton", () => {
  it("renders a button with the given testId", () => {
    renderButton({ onClick: () => {} });
    expect(screen.getByTestId("tb-preview")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = jest.fn();
    renderButton({ onClick });
    fireEvent.click(screen.getByTestId("tb-preview"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled is true", () => {
    renderButton({ onClick: () => {}, disabled: true });
    expect(screen.getByTestId("tb-preview")).toBeDisabled();
  });

  it("exposes the label as accessible tooltip content", () => {
    renderButton({ onClick: () => {} });
    expect(screen.getByText("Preview Flow")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test src/components/flows/builder/__tests__/TopbarIconButton.test.jsx --watchAll=false`
Expected: FAIL — `TopbarIconButton` not exported.

- [ ] **Step 3: Add the Tooltip import and the component**

Add near the top of `BuilderTopbar.jsx`, alongside the other local imports:

```jsx
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
```

(`TooltipProvider` is added once around the whole header in Task 8 — it is not needed per-button.)

Add below the existing `Divider` function:

```jsx
// ── Icon button with hover tooltip ──────────────────────────────────────────
export function TopbarIconButton({ icon: Icon, label, onClick, disabled, testId }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          data-testid={testId}
          onClick={onClick}
          disabled={disabled}
          className="w-8 h-8 rounded-md flex items-center justify-center border border-border text-text-secondary hover:bg-slate-50 hover:text-text-primary disabled:opacity-40 transition-colors"
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test src/components/flows/builder/__tests__/TopbarIconButton.test.jsx --watchAll=false`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/BuilderTopbar.jsx src/components/flows/builder/__tests__/TopbarIconButton.test.jsx
git commit -m "feat: add reusable tooltip icon button for builder header"
```

---

### Task 6: Add `VersionHistoryMenu` component

**Files:**
- Modify: `src/components/flows/builder/BuilderTopbar.jsx` (add after `MoreMenu`; add `History` to the lucide-react import)
- Test: `src/components/flows/builder/__tests__/VersionHistoryMenu.test.jsx`

**Interfaces:**
- Consumes: `TopbarIconButton` from Task 5 (via internal trigger button — reimplemented inline since it needs a dropdown, not a tooltip, matching `MoreMenu`'s existing click-outside pattern).
- Produces: `export function VersionHistoryMenu({ versions })`. `versions` is an array of `{ id, liveAt, editedBy }`. Renders a clock-icon trigger button (`data-testid="builder-version-history"`); clicking toggles a dropdown listing each version as `"<liveAt> · <editedBy>"`, or an empty-state message `"No live versions yet"` when `versions` is empty/undefined.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/flows/builder/__tests__/VersionHistoryMenu.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { VersionHistoryMenu } from "../BuilderTopbar";

describe("VersionHistoryMenu", () => {
  it("is closed by default", () => {
    render(<VersionHistoryMenu versions={[]} />);
    expect(screen.queryByTestId("builder-version-history-list")).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no versions", () => {
    render(<VersionHistoryMenu versions={[]} />);
    fireEvent.click(screen.getByTestId("builder-version-history"));
    expect(screen.getByText("No live versions yet")).toBeInTheDocument();
  });

  it("lists each version with its live date and editor", () => {
    render(
      <VersionHistoryMenu
        versions={[{ id: "v1", liveAt: "2026-06-01", editedBy: "Meenal K." }]}
      />
    );
    fireEvent.click(screen.getByTestId("builder-version-history"));
    expect(screen.getByText("2026-06-01 · Meenal K.")).toBeInTheDocument();
  });

  it("toggles closed when the trigger is clicked again", () => {
    render(<VersionHistoryMenu versions={[]} />);
    const trigger = screen.getByTestId("builder-version-history");
    fireEvent.click(trigger);
    expect(screen.getByTestId("builder-version-history-list")).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByTestId("builder-version-history-list")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test src/components/flows/builder/__tests__/VersionHistoryMenu.test.jsx --watchAll=false`
Expected: FAIL — `VersionHistoryMenu` not exported.

- [ ] **Step 3: Add `History` to the import and add the component**

Add `History` to the lucide-react import block:

```jsx
  Tag,
  ChevronDown,
  TriangleAlert,
  History,
} from "lucide-react";
```

Add below `MoreMenu`:

```jsx
// ── Version history menu ─────────────────────────────────────────────────────
export function VersionHistoryMenu({ versions }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    function onDoc(e) { if (!ref.current?.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const list = versions || [];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        data-testid="builder-version-history"
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 rounded-md flex items-center justify-center border border-border text-text-secondary hover:bg-slate-50 hover:text-text-primary transition-colors"
      >
        <History className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div
          data-testid="builder-version-history-list"
          className="absolute right-0 top-full mt-1 w-56 bg-white border border-border rounded-lg shadow-lg z-50 py-1 overflow-hidden"
        >
          {list.length === 0 ? (
            <div className="px-3 py-2 text-[12px] text-text-muted">No live versions yet</div>
          ) : (
            list.map((v) => (
              <div key={v.id} className="px-3 py-2 text-[12px] text-text-primary">
                {v.liveAt} · {v.editedBy}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test src/components/flows/builder/__tests__/VersionHistoryMenu.test.jsx --watchAll=false`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/BuilderTopbar.jsx src/components/flows/builder/__tests__/VersionHistoryMenu.test.jsx
git commit -m "feat: add version history dropdown to builder header"
```

---

### Task 7: Extend `MoreMenu` with a Download Error Report item

**Files:**
- Modify: `src/components/flows/builder/BuilderTopbar.jsx:108-142` (the `MoreMenu` function)
- Test: `src/components/flows/builder/__tests__/MoreMenu.test.jsx`

**Interfaces:**
- Produces: `export function MoreMenu({ onDownload, onDownloadError })` — adds a second menu item, "Download error report", calling `onDownloadError`.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/flows/builder/__tests__/MoreMenu.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MoreMenu } from "../BuilderTopbar";

describe("MoreMenu", () => {
  it("opens to show both download items", () => {
    render(<MoreMenu onDownload={() => {}} onDownloadError={() => {}} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Download report")).toBeInTheDocument();
    expect(screen.getByText("Download error report")).toBeInTheDocument();
  });

  it("calls onDownloadError and closes when the error report item is clicked", () => {
    const onDownloadError = jest.fn();
    render(<MoreMenu onDownload={() => {}} onDownloadError={onDownloadError} />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Download error report"));
    expect(onDownloadError).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Download error report")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test src/components/flows/builder/__tests__/MoreMenu.test.jsx --watchAll=false`
Expected: FAIL — `MoreMenu` not exported / no "Download error report" item.

- [ ] **Step 3: Update `MoreMenu`**

Replace the block at `BuilderTopbar.jsx:108-142`:

```jsx
// ── More menu ────────────────────────────────────────────────────────────────
export function MoreMenu({ onDownload, onDownloadError }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    function onDoc(e) { if (!ref.current?.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 rounded-md flex items-center justify-center border border-border text-text-secondary hover:bg-slate-50 hover:text-text-primary transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border rounded-lg shadow-lg z-50 py-1 overflow-hidden">
          <button
            type="button"
            onClick={() => { onDownload(); setOpen(false); }}
            className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-[13px] text-text-primary hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5 text-text-muted" />
            Download report
          </button>
          <button
            type="button"
            onClick={() => { onDownloadError(); setOpen(false); }}
            className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-[13px] text-text-primary hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5 text-text-muted" />
            Download error report
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test src/components/flows/builder/__tests__/MoreMenu.test.jsx --watchAll=false`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/BuilderTopbar.jsx src/components/flows/builder/__tests__/MoreMenu.test.jsx
git commit -m "feat: add download error report option to builder header menu"
```

---

### Task 8: Wire everything into `BuilderTopbar` and add the new stub handlers

**Files:**
- Modify: `src/components/flows/builder/BuilderTopbar.jsx` (the `BuilderTopbar` default-export function — handlers block and returned JSX)
- Test: `src/components/flows/builder/__tests__/BuilderTopbar.test.jsx`

**Interfaces:**
- Consumes: `StatusBadge`, `FlowTagPill`, `WarningBadge`, `SaveIndicator`, `TopbarIconButton`, `VersionHistoryMenu`, `MoreMenu` (all from Tasks 1–7), plus existing `ActiveToggle`, `Divider`.
- Produces: no new exports — this is the integration point. Adds local handlers `handleTagClick`, `handleWarningClick`, `handleUndo`, `handleRedo`, `handleViewChats`, `handleDownloadErrorReport`, each calling `toast.info(...)`, and a derived `const hasBeenLive = status !== "draft";`.

- [ ] **Step 1: Write the failing integration test**

This test mocks the store, router, react-query mutations, and API module so the header can render standalone.

```jsx
// src/components/flows/builder/__tests__/BuilderTopbar.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import BuilderTopbar from "../BuilderTopbar";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import { toast } from "sonner";

jest.mock("@/lib/flowsApi", () => ({
  updateFlow: jest.fn(() => Promise.resolve({})),
  publishFlow: jest.fn(() => Promise.resolve({})),
  pauseFlow: jest.fn(() => Promise.resolve({})),
  resumeFlow: jest.fn(() => Promise.resolve({})),
}));

jest.mock("sonner", () => ({ toast: { info: jest.fn(), success: jest.fn(), error: jest.fn() } }));

function renderTopbar(metaOverrides = {}) {
  useFlowBuilderStore.setState({
    flowId: "flow-1",
    meta: { name: "Diwali Sale Flow", status: "active", ...metaOverrides },
    nodes: [],
    edges: [],
    autosaveStatus: "idle",
  });
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <BuilderTopbar />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("BuilderTopbar integration", () => {
  it("renders the flow tag pill and status badge", () => {
    renderTopbar();
    expect(screen.getByTestId("builder-tag-pill")).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("shows Version History and View all Customer Chat once the flow has been live", () => {
    renderTopbar({ status: "active" });
    expect(screen.getByTestId("builder-version-history")).toBeInTheDocument();
    expect(screen.getByTestId("builder-chats")).toBeInTheDocument();
  });

  it("hides Version History and View all Customer Chat for a draft flow", () => {
    renderTopbar({ status: "draft" });
    expect(screen.queryByTestId("builder-version-history")).not.toBeInTheDocument();
    expect(screen.queryByTestId("builder-chats")).not.toBeInTheDocument();
  });

  it("shows a coming-soon toast when Undo is clicked", () => {
    renderTopbar();
    fireEvent.click(screen.getByTestId("builder-undo"));
    expect(toast.info).toHaveBeenCalledWith("Undo coming soon");
  });

  it("shows a coming-soon toast when Redo is clicked", () => {
    renderTopbar();
    fireEvent.click(screen.getByTestId("builder-redo"));
    expect(toast.info).toHaveBeenCalledWith("Redo coming soon");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test src/components/flows/builder/__tests__/BuilderTopbar.test.jsx --watchAll=false`
Expected: FAIL — new `data-testid`s (`builder-chats`, `builder-undo`, `builder-redo`) don't exist yet, tag pill not wired into the returned JSX yet.

- [ ] **Step 3: Add `Undo2`, `Redo2`, `MessageCircle` to the lucide-react import**

```jsx
  Tag,
  ChevronDown,
  TriangleAlert,
  History,
  Undo2,
  Redo2,
  MessageCircle,
} from "lucide-react";
```

- [ ] **Step 4: Add the new handlers and `hasBeenLive`**

Add directly below the existing `handleDownloadReport` definition (`BuilderTopbar.jsx`, inside the `handlers` section):

```jsx
  const handleDownloadErrorReport = () => {
    toast.info("Generating error report…");
  };

  const handleUndo = () => {
    toast.info("Undo coming soon");
  };

  const handleRedo = () => {
    toast.info("Redo coming soon");
  };

  const handleViewChats = () => {
    toast.info("Customer chat view coming soon");
  };

  const handleTagClick = () => {
    toast.info("Flow tag editing coming soon");
  };

  const handleWarningClick = () => {
    toast.info("Flow issue list coming soon");
  };

  const hasBeenLive = status !== "draft";
```

- [ ] **Step 5: Rewrite the returned JSX**

Replace the full `return ( <header> ... </header> )` block with:

```jsx
  return (
    <TooltipProvider delayDuration={150}>
      <header
        data-testid="builder-topbar"
        className="h-[52px] bg-surface border-b border-border flex items-center justify-between px-3 gap-3 flex-shrink-0"
      >
        {/* ── Left group ── */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            data-testid="builder-back"
            onClick={() => navigate(basePath)}
            className="p-1.5 rounded-md hover:bg-slate-100 text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <Divider />

          {editing ? (
            <input
              ref={inputRef}
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitName();
                if (e.key === "Escape") { setEditing(false); setDraftName(meta?.name || "Untitled flow"); }
              }}
              data-testid="builder-name-input"
              className="text-[14px] font-semibold text-text-primary bg-transparent border-b-2 border-primary outline-none max-w-[260px]"
            />
          ) : (
            <button
              type="button"
              data-testid="builder-name"
              onClick={() => flowId && setEditing(true)}
              title="Click to rename"
              className="text-[14px] font-semibold text-text-primary hover:text-primary truncate max-w-[240px] transition-colors"
              disabled={!flowId}
            >
              {meta?.name || "Untitled flow"}
            </button>
          )}

          <FlowTagPill tag={meta?.tag} onClick={handleTagClick} />

          <ActiveToggle
            active={isActive}
            disabled={!flowId || pauseMut.isPending || resumeMut.isPending || publishMut.isPending}
            onToggle={handleToggle}
          />

          <StatusBadge status={status} />

          <WarningBadge count={meta?.warningCount} onClick={handleWarningClick} />
        </div>

        {/* ── Center: last saved ── */}
        <div className="flex-shrink-0">
          <SaveIndicator status={autosaveStatus} lastSavedAt={lastSavedAt} lastSavedBy={meta?.updated_by_name || "You"} />
        </div>

        {/* ── Right group ── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <TopbarIconButton icon={Undo2} label="Undo" testId="builder-undo" onClick={handleUndo} />
          <TopbarIconButton icon={Redo2} label="Redo" testId="builder-redo" onClick={handleRedo} />

          {hasBeenLive && (
            <>
              <Divider />
              <VersionHistoryMenu versions={[]} />
              <TopbarIconButton
                icon={BarChart2}
                label="View Analytics"
                testId="builder-analytics"
                disabled={!flowId}
                onClick={() => navigate(`/flows/builder/${flowId}/analytics`)}
              />
              <TopbarIconButton
                icon={MessageCircle}
                label="View all Customer Chat"
                testId="builder-chats"
                onClick={handleViewChats}
              />
            </>
          )}

          <Divider />

          {status === "active" && (
            <button
              type="button"
              data-testid="builder-pause"
              onClick={() => pauseMut.mutate()}
              disabled={pauseMut.isPending}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md border border-border text-[12px] text-text-secondary hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Pause
            </button>
          )}
          {status === "paused" && (
            <button
              type="button"
              data-testid="builder-resume"
              onClick={() => resumeMut.mutate()}
              disabled={resumeMut.isPending}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md border border-border text-[12px] text-text-secondary hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Resume
            </button>
          )}

          <TopbarIconButton icon={Play} label="Preview Flow" testId="builder-play" disabled={!flowId} onClick={handlePreview} />
          <TopbarIconButton icon={FlaskConical} label="Test Mode" testId="builder-test" disabled={!flowId} onClick={() => setSaveJourneyOpen(true)} />

          <button
            type="button"
            data-testid="builder-save-journey"
            onClick={() => setSaveJourneyOpen(true)}
            disabled={!flowId}
            className="inline-flex items-center gap-1.5 px-4 h-8 rounded-md bg-primary text-white text-[12px] font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <BookMarked className="w-3.5 h-3.5" />
            )}
            Save Journey
          </button>

          <MoreMenu onDownload={handleDownloadReport} onDownloadError={handleDownloadErrorReport} />
        </div>

        <SaveJourneyModal
          open={saveJourneyOpen}
          onClose={() => setSaveJourneyOpen(false)}
          triggerEventName={triggerEventName}
          onGoLive={handleGoLive}
          onTestMode={handleTestMode}
          onPreview={handlePreview}
        />
      </header>
    </TooltipProvider>
  );
}
```

Also add `TooltipProvider` to the Task 5 import line, so the full import reads:

```jsx
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
```

- [ ] **Step 6: Run test to verify it passes**

Run: `CI=true npx craco test src/components/flows/builder/__tests__/BuilderTopbar.test.jsx --watchAll=false`
Expected: PASS (5 tests)

- [ ] **Step 7: Run the full test suite for this file's directory to check nothing else broke**

Run: `CI=true npx craco test src/components/flows/builder/__tests__/ --watchAll=false`
Expected: PASS — all `StatusBadge`, `FlowTagPill`, `WarningBadge`, `SaveIndicator`, `TopbarIconButton`, `VersionHistoryMenu`, `MoreMenu`, `BuilderTopbar` tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/components/flows/builder/BuilderTopbar.jsx src/components/flows/builder/__tests__/BuilderTopbar.test.jsx
git commit -m "feat: wire full header checklist into BuilderTopbar"
```

---

### Task 9: Manual verification in both Flow Builder v1 and v2

**Files:** none (manual check only)

- [ ] **Step 1: Start the dev server**

Run: `npm start`

- [ ] **Step 2: Open an existing flow in v1 builder**

Navigate to `/flows/builder/<some-flow-id>` and confirm: flow tag pill, status badge (correct label/color for that flow's status), warning badge (only if the flow has a `meta.warningCount`), save indicator with author suffix, Undo/Redo icons, Version History + Analytics + Chats icons (only if flow is not in Draft), Test/Preview icons with hover tooltips, and the `⋯` menu showing both "Download report" and "Download error report".

- [ ] **Step 3: Open the same flow in v2 builder**

Navigate to `/flows-v2/builder/<same-flow-id>` and confirm the header looks identical to v1 (same shared `BuilderTopbar` component).

- [ ] **Step 4: Confirm no console errors**

Check the browser console for React warnings/errors while interacting with each new element (clicking Undo, Redo, tag pill, warning badge, chats icon, version history, download error report — each should just show a toast, no crash).

- [ ] **Step 5: Report back**

No commit for this task — it's a verification checkpoint. Note any visual issues found (e.g. crowding at narrow widths) for a follow-up pass; per the spec, responsive/collapse behavior is explicitly out of scope for this plan.

---

## Post-implementation note

Everything behind `toast.info("... coming soon")` (tag editing, warning list, undo/redo, version history selection, customer chat viewer, download report/error report popups, test mode/live-toggle confirmation popups, interactive preview) is intentionally unwired, per the spec's "Explicitly out of scope for this pass" section. Each of those is a candidate for its own follow-up brainstorming → spec → plan cycle when picked up.
